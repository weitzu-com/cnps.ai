#!/usr/bin/env python3
"""Private, encrypted local backups; verify only in a disposable isolated database."""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import stat
import subprocess
import tarfile
import tempfile
from datetime import datetime, timezone
import zipfile
import urllib.request
import urllib.parse

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

APP_DIR = Path('/opt/cnps-crm')
STATE_DIR = Path('/var/lib/cnps-crm-backup')
BACKUP_DIR = Path('/var/backups/cnps-crm')
KEY_PATH = STATE_DIR / 'encryption.key'
MAGIC = b'CNPSBKP1'
KEEP = 7
CHUNK = 1024 * 1024
RESERVE_BYTES = 5 * 1024**3
CONFIG_FILES = ['.env', 'files.env', '.files.env', '.bootstrap-auth.json', '.upstash-backup-env.json', 'compose.yml', 'file-gateway/compose.override.yml']
VOLUMES = ['cnps-crm_app-data', 'cnps-crm_document-data']
UPSTASH_CONFIG = APP_DIR / '.upstash-backup-env.json'
PMP_PREFIX = 'cnps:crm:business:v1:'
INQUIRY_PREFIX = 'cnps:crm:inquiry:v1:'
AUDIT_PREFIX = 'cnps:crm:audit:v1:event:'
MAX_UPSTASH_KEYS = 100000
UPSTASH_MEMBER = 'upstash/pmp-inquiry.json'
CORE_STATS_SQL = '''SELECT json_build_object(
'table_count', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'),
'user_count', (SELECT count(*) FROM core."user"),
'workspace_count', (SELECT count(*) FROM core.workspace))::text;'''


def require(condition, code):
    if not condition:
        raise RuntimeError(code)


def private_dir(directory):
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    info = directory.lstat()
    require(stat.S_ISDIR(info.st_mode) and not stat.S_ISLNK(info.st_mode)
            and info.st_uid == 0, 'unsafe_private_directory')
    directory.chmod(0o700)


def read_key():
    private_dir(STATE_DIR)
    try:
        fd = os.open(KEY_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    except FileExistsError:
        pass
    else:
        with os.fdopen(fd, 'w') as stream:
            stream.write(secrets.token_hex(32) + '\n')
            stream.flush()
            os.fsync(stream.fileno())
    info = KEY_PATH.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid == 0
            and info.st_mode & 0o077 == 0, 'unsafe_backup_key')
    fd = os.open(KEY_PATH, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'r') as stream:
        value = stream.read(128).strip()
    require(re.fullmatch('[0-9a-f]{64}', value) is not None, 'invalid_backup_key')
    return bytes.fromhex(value)


def run(arguments, *, data=None, timeout=120):
    result = subprocess.run(arguments, input=data, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, timeout=timeout)
    require(result.returncode == 0, 'operation_failed_' + arguments[0])
    return result.stdout


def db_container():
    value = run(['docker', 'compose', '--project-directory', str(APP_DIR),
                 '-f', str(APP_DIR / 'compose.yml'), 'ps', '-q', 'db']).decode().strip()
    require(re.fullmatch('[0-9a-f]{12,64}', value) is not None, 'database_container_missing')
    return value


def db_stats(container, database='cnps'):
    result = run(['docker', 'exec', container, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1',
                  '-U', 'cnps', '-d', database, '-c', CORE_STATS_SQL])
    return json.loads(result)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def upstash_config():
    info = UPSTASH_CONFIG.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid == 0 and info.st_mode & 0o077 == 0,
            'unsafe_upstash_config')
    value = json.loads(UPSTASH_CONFIG.read_text())
    parsed = urllib.parse.urlparse(value.get('url', ''))
    require(parsed.scheme == 'https' and parsed.hostname and parsed.hostname.endswith('.upstash.io')
            and parsed.port in (None, 443) and parsed.path in ('', '/')
            and not parsed.username and not parsed.password and not parsed.query and not parsed.fragment,
            'invalid_upstash_endpoint')
    require(isinstance(value.get('token'), str) and 32 <= len(value['token']) <= 4096, 'invalid_upstash_token')
    return {'url': value['url'].rstrip('/'), 'token': value['token']}


def upstash_command(config, command, endpoint=''):
    data = json.dumps(command, separators=(',', ':')).encode()
    require(len(data) <= 512 * 1024, 'upstash_command_too_large')
    request = urllib.request.Request(config['url'] + endpoint, data=data, method='POST', headers={
        'Authorization': 'Bearer ' + config['token'], 'Content-Type': 'application/json',
        'User-Agent': 'codex-cnps-crm-private-backup/1',
    })
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=60) as response:
        raw = response.read(64 * 1024 * 1024 + 1)
    require(len(raw) <= 64 * 1024 * 1024, 'upstash_response_too_large')
    result = json.loads(raw)
    if endpoint == '/multi-exec':
        require(isinstance(result, list) and all(isinstance(item, dict) and 'result' in item
                and 'error' not in item for item in result), 'upstash_read_transaction_failed')
        return [item['result'] for item in result]
    require(isinstance(result, dict) and 'result' in result and 'error' not in result, 'upstash_command_failed')
    return result['result']


def scan_upstash(config, audit_before=None):
    keys = set()
    for prefix in [PMP_PREFIX, INQUIRY_PREFIX, AUDIT_PREFIX]:
        cursor = '0'
        for _ in range(1000):
            result = upstash_command(config, ['SCAN', cursor, 'MATCH', prefix + '*', 'COUNT', 100])
            require(isinstance(result, list) and len(result) == 2 and isinstance(result[1], list), 'invalid_upstash_scan')
            cursor = str(result[0])
            require(cursor.isdigit(), 'invalid_upstash_cursor')
            for key in result[1]:
                require(isinstance(key, str) and key.startswith(prefix) and len(key) <= 1000, 'invalid_upstash_key')
                if prefix == AUDIT_PREFIX and audit_before is not None:
                    match = re.fullmatch(re.escape(AUDIT_PREFIX) + r'(\d{1,16}):[A-Za-z0-9._:-]{1,128}', key)
                    require(match is not None, 'invalid_audit_key')
                    if int(match[1]) > audit_before:
                        continue
                keys.add(key)
            require(len(keys) <= MAX_UPSTASH_KEYS, 'upstash_backup_key_limit')
            if cursor == '0':
                break
        else:
            raise RuntimeError('upstash_scan_limit')
    return sorted(keys)


def validate_upstash(snapshot):
    require(isinstance(snapshot, dict) and snapshot.get('version') == 1
            and isinstance(snapshot.get('entries'), list), 'invalid_upstash_snapshot')
    require(len(snapshot['entries']) <= MAX_UPSTASH_KEYS, 'upstash_backup_key_limit')
    seen = set()
    business = inquiry = audit = 0
    for item in snapshot['entries']:
        require(isinstance(item, dict) and set(item) == {'key', 'value', 'pttl'}, 'invalid_upstash_record')
        key = item['key']
        require(isinstance(key, str) and key not in seen and key.startswith((PMP_PREFIX, INQUIRY_PREFIX, AUDIT_PREFIX)), 'invalid_upstash_key')
        seen.add(key)
        require(isinstance(item['value'], str) and len(item['value'].encode()) <= 8 * 1024 * 1024
                and isinstance(item['pttl'], int) and item['pttl'] >= -1, 'invalid_upstash_value')
        value = json.loads(item['value'])
        if key.startswith(PMP_PREFIX):
            business += 1
            require(isinstance(value, dict) and isinstance(value.get('revision'), int)
                    and value['revision'] >= 0 and isinstance(value.get('events'), list), 'invalid_pmp_schema')
            if key == PMP_PREFIX + 'directory':
                require(all(isinstance(value.get(field), dict) for field in ['companies', 'managerAssignments', 'memberGrants']), 'invalid_pmp_directory')
            else:
                require(key.startswith(PMP_PREFIX + 'company:') and isinstance(value.get('companyId'), str)
                        and all(isinstance(value.get(field), dict) for field in ['projects', 'records', 'documents']), 'invalid_pmp_company')
        elif key.startswith(AUDIT_PREFIX):
            audit += 1
            require(isinstance(value, dict) and set(value) <= {'id', 'actorId', 'action', 'at', 'status', 'companyId'}
                    and all(field in value for field in ['id', 'actorId', 'action', 'at', 'status']), 'invalid_audit_schema')
            require(isinstance(value['id'], str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._:-]{0,127}', value['id'])
                    and isinstance(value['at'], int) and 0 <= value['at'] < 10**16
                    and key == AUDIT_PREFIX + str(value['at']) + ':' + value['id'], 'invalid_audit_identity')
            require(isinstance(value['actorId'], str) and (value['actorId'] == 'anonymous' or re.fullmatch(r'[a-f0-9]{64}', value['actorId']))
                    and isinstance(value['action'], str) and re.fullmatch(r'access\.[A-Za-z][A-Za-z0-9]{0,79}', value['action'])
                    and isinstance(value['status'], int) and 100 <= value['status'] <= 599, 'invalid_audit_event')
            if 'companyId' in value:
                require(isinstance(value['companyId'], str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._:-]{0,127}', value['companyId']), 'invalid_audit_company')
        else:
            inquiry += 1
            if key.startswith(INQUIRY_PREFIX + 'limit:'):
                require(isinstance(value, int) and value >= 0, 'invalid_inquiry_limit')
            else:
                require(key.startswith(INQUIRY_PREFIX + 'submission:') and isinstance(value, dict)
                        and value.get('phase') in ['crm-pending', 'hubspot-ready', 'hubspot-sending', 'uncertain', 'complete']
                        and isinstance(value.get('envelope'), str), 'invalid_inquiry_schema')
    return {'business_keys': business, 'inquiry_keys': inquiry, 'audit_keys': audit}


def snapshot_upstash():
    config = upstash_config()
    # Immutable audit events after this watermark belong to the next backup.
    # Live traffic must not cause the captured namespace to change on every scan.
    watermark = int(datetime.now(timezone.utc).timestamp() * 1000) - 1000
    for _ in range(3):
        keys = scan_upstash(config, watermark)
        entries = []
        for offset in range(0, len(keys), 100):
            batch = keys[offset:offset + 100]
            commands = [['MGET', *batch]] + [['PTTL', key] for key in batch]
            result = upstash_command(config, commands, '/multi-exec')
            require(len(result) == len(batch) + 1 and isinstance(result[0], list)
                    and len(result[0]) == len(batch), 'invalid_upstash_mget')
            for index, key in enumerate(batch):
                if result[0][index] is None or result[index + 1] == -2:
                    continue
                entries.append({'key': key, 'value': result[0][index], 'pttl': result[index + 1]})
        if keys != scan_upstash(config, watermark):
            continue
        snapshot = {'version': 1, 'captured_at': datetime.now(timezone.utc).isoformat(),
                    'audit_watermark_ms': watermark,
                    'entries': entries, 'excludes_authentication_state': True}
        validate_upstash(snapshot)
        return snapshot
    raise RuntimeError('upstash_namespace_changed_during_snapshot')


class EncryptWriter:
    def __init__(self, output, key):
        self.output = output
        self.offset = 0
        self.header = MAGIC + secrets.token_bytes(12)
        self.output.write(self.header)
        self.encryptor = Cipher(algorithms.AES(key), modes.GCM(self.header[8:])).encryptor()
        self.encryptor.authenticate_additional_data(self.header)

    def write(self, data):
        self.output.write(self.encryptor.update(data))
        self.offset += len(data)
        return len(data)

    def tell(self):
        return self.offset

    def seek(self, *args):
        raise io.UnsupportedOperation('Encrypted stream is not seekable')

    def flush(self):
        self.output.flush()

    def finish(self):
        self.output.write(self.encryptor.finalize())
        self.output.write(self.encryptor.tag)
        self.output.flush()
        os.fsync(self.output.fileno())


class HashWriter:
    def __init__(self, output):
        self.output = output
        self.hash = hashlib.sha256()
        self.size = 0

    def write(self, data):
        self.hash.update(data)
        self.size += len(data)
        return self.output.write(data)

    def flush(self):
        self.output.flush()

    def summary(self):
        return {'size': self.size, 'sha256': self.hash.hexdigest()}


def write_member(archive, name, source):
    with archive.open(name, 'w', force_zip64=True) as target:
        writer = HashWriter(target)
        while True:
            chunk = source.read(CHUNK)
            if not chunk:
                break
            writer.write(chunk)
        return writer.summary()


def write_dump(archive, container):
    proc = subprocess.Popen(['docker', 'exec', container, 'pg_dump', '-U', 'cnps',
                             '-d', 'cnps', '-Fc', '--no-owner', '--no-privileges'],
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        summary = write_member(archive, 'database.dump', proc.stdout)
        require(proc.wait(timeout=1200) == 0 and summary['size'] > 0, 'database_dump_failed')
        return summary
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()


def volume_path(name):
    result = subprocess.run(['docker', 'volume', 'inspect', '--format', '{{.Mountpoint}}', name],
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=60)
    if result.returncode != 0:
        return None
    directory = Path(result.stdout.decode().strip())
    require(directory.is_absolute() and directory.is_dir() and not directory.is_symlink(), 'unsafe_volume_path')
    return directory


def write_volume(archive, name, directory):
    with archive.open(name, 'w', force_zip64=True) as member:
        writer = HashWriter(member)
        with tarfile.open(fileobj=writer, mode='w|', dereference=False) as tar:
            tar.add(directory, arcname='.')
        return writer.summary()


def create_backup(key):
    private_dir(BACKUP_DIR)
    require(shutil.disk_usage(BACKUP_DIR).free > RESERVE_BYTES, 'insufficient_private_backup_space')
    container = db_container()
    stats = db_stats(container)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    destination = BACKUP_DIR / ('cnps-crm-' + stamp + '-' + secrets.token_hex(3) + '.enc')
    pending = Path(str(destination) + '.part')
    manifest = {'version': 1, 'created_at': datetime.now(timezone.utc).isoformat(),
                'database': 'cnps', 'database_stats': stats, 'entries': {}, 'missing_volumes': []}
    try:
        fd = os.open(pending, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'wb') as output:
            encrypted = EncryptWriter(output, key)
            with zipfile.ZipFile(encrypted, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
                # DB snapshot precedes immutable document files, so referenced objects are already present.
                manifest['entries']['database.dump'] = write_dump(archive, container)
                snapshot = json.dumps(snapshot_upstash(), separators=(',', ':')).encode()
                manifest['entries'][UPSTASH_MEMBER] = write_member(archive, UPSTASH_MEMBER, io.BytesIO(snapshot))
                for volume in VOLUMES:
                    directory = volume_path(volume)
                    if directory is None:
                        manifest['missing_volumes'].append(volume)
                        continue
                    name = 'volumes/' + volume + '.tar'
                    manifest['entries'][name] = write_volume(archive, name, directory)
                for relative in CONFIG_FILES:
                    filename = APP_DIR / relative
                    if not filename.exists():
                        continue
                    info = filename.lstat()
                    require(stat.S_ISREG(info.st_mode) and not filename.is_symlink()
                            and info.st_size <= 1024 * 1024, 'unsafe_config_file')
                    with filename.open('rb') as source:
                        manifest['entries']['config/' + relative] = write_member(archive, 'config/' + relative, source)
                archive.writestr('manifest.json', json.dumps(manifest, sort_keys=True).encode())
            encrypted.finish()
        # Never overwrite an existing backup; publish only the complete authenticated ciphertext.
        os.link(pending, destination)
        pending.unlink()
        return destination
    finally:
        if pending.exists():
            pending.unlink()


def decrypt_to_ram(filename, key):
    info = filename.lstat()
    require(stat.S_ISREG(info.st_mode) and not filename.is_symlink()
            and info.st_mode & 0o077 == 0 and info.st_size > 36, 'unsafe_backup_file')
    available = shutil.disk_usage('/dev/shm').free
    require(info.st_size < available * 0.75, 'insufficient_ram_for_restore_validation')
    plaintext = tempfile.TemporaryFile(mode='w+b', dir='/dev/shm')
    os.fchmod(plaintext.fileno(), 0o600)
    try:
        with filename.open('rb') as source:
            header = source.read(20)
            require(header[:8] == MAGIC, 'invalid_backup_header')
            source.seek(-16, os.SEEK_END)
            tag = source.read(16)
            decryptor = Cipher(algorithms.AES(key), modes.GCM(header[8:], tag)).decryptor()
            decryptor.authenticate_additional_data(header)
            source.seek(20)
            remaining = info.st_size - 36
            while remaining:
                chunk = source.read(min(CHUNK, remaining))
                require(bool(chunk), 'truncated_backup')
                remaining -= len(chunk)
                plaintext.write(decryptor.update(chunk))
            plaintext.write(decryptor.finalize())
        plaintext.seek(0)
        return plaintext
    except Exception:
        plaintext.close()
        raise


def verify_entries(archive, manifest):
    require(manifest.get('version') == 1 and 'database.dump' in manifest.get('entries', {}), 'invalid_backup_manifest')
    require(set(archive.namelist()) == set(manifest['entries']) | {'manifest.json'}, 'invalid_backup_entries')
    for name, expected in manifest['entries'].items():
        require(name == 'database.dump' or name == UPSTASH_MEMBER or name.startswith('volumes/') or name.startswith('config/'), 'invalid_backup_entry')
        require(not any(part == '..' for part in Path(name).parts), 'unsafe_backup_entry')
        with archive.open(name) as source:
            digest = hashlib.sha256()
            size = 0
            while True:
                chunk = source.read(CHUNK)
                if not chunk:
                    break
                digest.update(chunk)
                size += len(chunk)
        require(size == expected['size'] and digest.hexdigest() == expected['sha256'], 'backup_entry_integrity_failed')


def verify_backup(filename, key):
    container = db_container()
    temporary_database = 'cnps_restorecheck_' + secrets.token_hex(8)
    created = False
    with decrypt_to_ram(filename, key) as decrypted:
        with zipfile.ZipFile(decrypted, 'r') as archive:
            require(archive.getinfo('manifest.json').file_size < 65536, 'invalid_backup_manifest')
            manifest = json.loads(archive.read('manifest.json'))
            verify_entries(archive, manifest)
            require(archive.getinfo(UPSTASH_MEMBER).file_size <= 64 * 1024 * 1024, 'upstash_snapshot_too_large')
            upstash_stats = validate_upstash(json.loads(archive.read(UPSTASH_MEMBER)))
            try:
                run(['docker', 'exec', container, 'createdb', '-U', 'cnps', '--owner=cnps', temporary_database])
                created = True
                proc = subprocess.Popen(['docker', 'exec', '-i', container, 'pg_restore', '-U', 'cnps',
                                         '-d', temporary_database, '--no-owner', '--no-privileges', '--exit-on-error'],
                                        stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                try:
                    with archive.open('database.dump') as source:
                        shutil.copyfileobj(source, proc.stdin, CHUNK)
                    proc.stdin.close()
                    require(proc.wait(timeout=1200) == 0, 'database_restore_failed')
                finally:
                    if proc.poll() is None:
                        proc.kill()
                        proc.wait()
                restored = db_stats(container, temporary_database)
                require(restored == manifest['database_stats'] and restored['table_count'] > 0,
                        'database_restore_validation_mismatch')
                return {'status': 'verified', 'database_stats': restored,
                        'archive_entries': len(manifest['entries']),
                        'upstash_schema': 'validated', 'upstash_counts': upstash_stats,
                        'document_volume_included': 'volumes/cnps-crm_document-data.tar' in manifest['entries'],
                        'missing_volumes': manifest['missing_volumes']}
            finally:
                if created:
                    run(['docker', 'exec', container, 'dropdb', '-U', 'cnps', '--force', temporary_database])


def restore_upstash_isolated(filename, key, namespace):
    # There is intentionally no production namespace option in this utility.
    require(isinstance(namespace, str) and re.fullmatch(r'cnps:crm:restorecheck:[A-Za-z0-9_-]{1,48}:', namespace),
            'isolated_restore_namespace_required')
    config = upstash_config()
    created = []
    try:
        with decrypt_to_ram(filename, key) as decrypted:
            with zipfile.ZipFile(decrypted, 'r') as archive:
                manifest = json.loads(archive.read('manifest.json'))
                verify_entries(archive, manifest)
                snapshot = json.loads(archive.read(UPSTASH_MEMBER))
                validate_upstash(snapshot)
                for item in snapshot['entries']:
                    target = namespace + item['key']
                    require(target.startswith('cnps:crm:restorecheck:'), 'unsafe_restore_target')
                    # Isolated copies automatically expire; no live ACL/outbox record is changed.
                    require(upstash_command(config, ['SET', target, item['value'], 'NX', 'EX', 7 * 86400]) == 'OK',
                            'isolated_namespace_already_used')
                    created.append(target)
                for offset in range(0, len(snapshot['entries']), 100):
                    batch = snapshot['entries'][offset:offset + 100]
                    restored = upstash_command(config, ['MGET', *[namespace + item['key'] for item in batch]])
                    require(restored == [item['value'] for item in batch], 'isolated_restore_readback_mismatch')
        return {'status': 'restored_in_isolated_namespace', 'namespace': namespace, 'keys': len(created),
                'ttl_days': 7, 'readback_verified': True, 'upstash_counts': validate_upstash(snapshot)}
    except Exception:
        if created:
            upstash_command(config, ['DEL', *created])
        raise


def rotate():
    successful = sorted(BACKUP_DIR.glob('cnps-crm-*.verified.json'))
    for marker in successful[:-KEEP]:
        archive = Path(str(marker).removesuffix('.verified.json'))
        require(archive.parent == BACKUP_DIR and archive.suffix == '.enc', 'unsafe_rotation_path')
        archive.unlink(missing_ok=True)
        marker.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['backup', 'verify', 'restore-upstash'])
    parser.add_argument('file', nargs='?')
    parser.add_argument('--namespace')
    args = parser.parse_args()
    require(os.geteuid() == 0, 'root_required_for_private_backup')
    os.umask(0o077)
    private_dir(STATE_DIR)
    lock = os.open(STATE_DIR / 'backup.lock', os.O_WRONLY | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    with os.fdopen(lock, 'w') as held:
        fcntl.flock(held, fcntl.LOCK_EX | fcntl.LOCK_NB)
        key = read_key()
        filename = create_backup(key) if args.action == 'backup' else Path(args.file or '').resolve()
        require(filename.parent == BACKUP_DIR, 'backup_must_be_in_private_directory')
        result = (restore_upstash_isolated(filename, key, args.namespace)
                  if args.action == 'restore-upstash' else verify_backup(filename, key))
        if args.action == 'backup':
            marker = Path(str(filename) + '.verified.json')
            marker.write_text(json.dumps(result, sort_keys=True) + '\n')
            marker.chmod(0o600)
            rotate()
        # Only operational counts/status are printed; archive/config/keys/customer values never are.
        print(json.dumps({'backup_file': filename.name, **result}, sort_keys=True))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid leaking subprocess output, customer data or secrets through exception traces.
        safe = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        print(json.dumps({'status': 'failed', 'reason': safe}), flush=True)
        raise SystemExit(1)
