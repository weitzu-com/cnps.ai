#!/usr/bin/env python3
"""Fictional-data crypto/schema tests; never read production configuration."""
import io
import json
from pathlib import Path
import secrets
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import backup


class BackupTest(unittest.TestCase):
    def test_encryption_roundtrip_and_tamper(self):
        key = secrets.token_bytes(32)
        original = b'fictional-private-document-data'
        with tempfile.TemporaryDirectory(dir='/dev/shm') as directory:
            target = Path(directory) / 'test.enc'
            with target.open('wb') as output:
                target.chmod(0o600)
                writer = backup.EncryptWriter(output, key)
                with zipfile.ZipFile(writer, 'w') as archive:
                    archive.writestr('test.txt', original)
                writer.finish()
            self.assertNotIn(original, target.read_bytes())
            with backup.decrypt_to_ram(target, key) as decrypted:
                with zipfile.ZipFile(decrypted) as archive:
                    self.assertEqual(archive.read('test.txt'), original)
            altered = bytearray(target.read_bytes())
            altered[-20] ^= 1
            target.write_bytes(altered)
            with self.assertRaises(Exception):
                backup.decrypt_to_ram(target, key)

    def test_valid_namespaces_and_schema(self):
        snapshot = {'version': 1, 'entries': [
            {'key': backup.PMP_PREFIX + 'directory', 'pttl': -1,
             'value': json.dumps({'revision': 0, 'companies': {}, 'managerAssignments': {}, 'memberGrants': {}, 'events': []})},
            {'key': backup.INQUIRY_PREFIX + 'limit:sample', 'pttl': 30000, 'value': '1'},
        ]}
        self.assertEqual(backup.validate_upstash(snapshot), {'business_keys': 1, 'inquiry_keys': 1, 'audit_keys': 0})
        snapshot['entries'][0]['key'] = 'cnps:crm:auth:session:fictional'
        with self.assertRaises(RuntimeError):
            backup.validate_upstash(snapshot)

    def test_audit_events_are_backed_up_but_private_fields_are_rejected(self):
        event = {'id': 'fictional-event', 'actorId': 'a' * 64, 'action': 'access.download',
                 'at': 1234567, 'status': 200, 'companyId': 'company-A'}
        snapshot = {'version': 1, 'entries': [{'key': backup.AUDIT_PREFIX + '1234567:fictional-event',
                    'pttl': -1, 'value': json.dumps(event)}]}
        self.assertEqual(backup.validate_upstash(snapshot)['audit_keys'], 1)
        for field in ['body', 'phone', 'cookie', 'code']:
            snapshot['entries'][0]['value'] = json.dumps({**event, field: 'must-not-be-logged'})
            with self.assertRaisesRegex(RuntimeError, 'invalid_audit_schema'):
                backup.validate_upstash(snapshot)
        snapshot['entries'][0]['value'] = json.dumps({**event, 'at': 7654321})
        with self.assertRaisesRegex(RuntimeError, 'invalid_audit_identity'):
            backup.validate_upstash(snapshot)

    def test_snapshot_batches_large_audit_namespaces_with_a_fixed_watermark(self):
        events = {}
        for i in range(250):
            event = {'id': 'event-' + str(i), 'actorId': 'anonymous', 'action': 'access.denied', 'at': i, 'status': 404}
            events[backup.AUDIT_PREFIX + str(i) + ':' + event['id']] = json.dumps(event)
        watermarks = []
        def scan(config, watermark):
            watermarks.append(watermark)
            return sorted(events)
        def command(config, commands, endpoint):
            self.assertEqual(endpoint, '/multi-exec')
            batch = commands[0][1:]
            self.assertLessEqual(len(batch), 100)
            return [[events[k] for k in batch]] + [-1] * len(batch)
        with patch.object(backup, 'upstash_config', return_value={}), patch.object(backup, 'scan_upstash', side_effect=scan), patch.object(backup, 'upstash_command', side_effect=command):
            snapshot = backup.snapshot_upstash()
        self.assertEqual(len(snapshot['entries']), 250)
        self.assertEqual(len(set(watermarks)), 1)
        self.assertEqual(backup.validate_upstash(snapshot)['audit_keys'], 250)

    def test_bad_business_shape_is_rejected(self):
        with self.assertRaises(RuntimeError):
            backup.validate_upstash({'version': 1, 'entries': [{
                'key': backup.PMP_PREFIX + 'directory', 'value': '{}', 'pttl': -1,
            }]})

    def test_production_restore_prefix_is_rejected_before_any_network_or_file_access(self):
        with self.assertRaisesRegex(RuntimeError, 'isolated_restore_namespace_required'):
            backup.restore_upstash_isolated(Path('/not-accessed'), b'0' * 32, backup.PMP_PREFIX)

    def test_rotation_keeps_seven_verified_copies_and_all_unverified_copies(self):
        original = backup.BACKUP_DIR
        with tempfile.TemporaryDirectory(dir='/dev/shm') as directory:
            backup.BACKUP_DIR = Path(directory)
            try:
                for index in range(10):
                    filename = backup.BACKUP_DIR / f'cnps-crm-{index:03d}.enc'
                    filename.write_bytes(b'fictional')
                    Path(str(filename) + '.verified.json').write_text('{}')
                unverified = backup.BACKUP_DIR / 'cnps-crm-unverified.enc'
                unverified.write_bytes(b'fictional')
                backup.rotate()
                self.assertEqual(len(list(backup.BACKUP_DIR.glob('*.verified.json'))), 7)
                self.assertTrue(unverified.exists())
            finally:
                backup.BACKUP_DIR = original


if __name__ == '__main__':
    unittest.main()
