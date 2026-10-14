#!/usr/bin/env python3
"""Snapshot only explicitly allowed deployment source and public metadata over SSH.

Never retrieves credentials, database contents, authentication files, or volumes.
Sensitive Compose settings are replaced with environment-variable placeholders.
"""
import argparse
import datetime
import hashlib
import json
import re
import shlex
import subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parent
FILES = {
    "/opt/cnps-crm/compose.yml": "compose.production.example.yml",
    "/opt/cnps-crm/file-gateway/compose.override.yml": "file-gateway.production.example.yml",
    "/etc/nginx/sites-enabled/cnps-crm-api": "nginx.production.example.conf",
}
GATEWAY_FILES = [
    "package.json", "server.mjs", "errors.mjs", "validation.mjs", "storage.mjs",
    "extraction.mjs", "extract.py", "Dockerfile", "ocr-worker/server.py",
    "ocr-worker/job.py", "ocr-worker/Dockerfile",
]
for name in GATEWAY_FILES:
    FILES["/opt/cnps-crm/file-gateway/" + name] = "live-file-gateway/" + name

REMOTE_SCRIPT = """
import hashlib,json,pathlib,subprocess
paths = %s
files={}
for path in paths:
    p=pathlib.Path(path)
    if p.is_file():
        content=p.read_text()
        files[path]={"text":content,"sha256":hashlib.sha256(content.encode()).hexdigest()}
data=json.loads(subprocess.check_output(["docker","inspect","cnps-crm-server-1","cnps-crm-worker-1","cnps-crm-db-1","cnps-crm-redis-1","cnps-crm-file-gateway-1","cnps-crm-ocr-worker-1"]))
containers=[]
for item in data:
    containers.append({"name":item["Name"].lstrip("/"),"image":item["Config"]["Image"],"image_id":item["Image"],"status":item["State"]["Status"],"health":item["State"].get("Health",{}).get("Status"),"port_bindings":item["HostConfig"].get("PortBindings"),"mounts":[{"source":m["Source"],"destination":m["Destination"],"type":m["Type"]} for m in item["Mounts"]],"environment_keys":[e.split("=",1)[0] for e in item["Config"].get("Env",[])]})
print(json.dumps({"files":files,"containers":containers}))
""" % repr(list(FILES))

SENSITIVE = re.compile(r"PASSWORD|SECRET|TOKEN|(?:^|_)KEY(?:$|_)|DATABASE_URL|REDIS_URL|AI_PROVIDERS", re.I)
ENV_LINE = re.compile(r"^(\s*(?:-\s*)?)([A-Z][A-Z0-9_]*)(\s*[:=]\s*)(.*)$")


def sanitize_compose(content):
    replaced = []
    lines = []
    for line in content.splitlines():
        match = ENV_LINE.match(line)
        if match and SENSITIVE.search(match[2]):
            key = match[2]
            # Replace the complete value, even if it already interpolates another key.
            line = match[1] + key + match[3] + "${" + key + "}"
            replaced.append(key)
        # Credential URLs outside the normal environment section are not accepted.
        if re.search(r"(?:postgres(?:ql)?|redis|https?)://[^\s/@:]+:[^\s/@]+@", line) and "${" not in line:
            raise RuntimeError("Refusing a literal credential URL in Compose source")
        lines.append(line)
    return "# Read-only production source snapshot; supply private values locally.\n" + "\n".join(lines) + "\n", sorted(set(replaced))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ssh-host", default="cnps-crm-hk")
    parser.add_argument("--ssh-identity")
    parser.add_argument("--known-hosts")
    args = parser.parse_args()
    ssh = ["ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=15"]
    if args.ssh_identity:
        ssh += ["-i", args.ssh_identity, "-o", "IdentitiesOnly=yes"]
    if args.known_hosts:
        ssh += ["-o", "UserKnownHostsFile=\"" + args.known_hosts.replace('"', '\\"') + "\""]
    remote = "python3 -c " + shlex.quote(REMOTE_SCRIPT)
    result = subprocess.run(ssh + [args.ssh_host, remote], text=True, capture_output=True, timeout=45)
    if result.returncode:
        raise SystemExit("Read-only SSH snapshot failed: " + result.stderr.strip())
    data = json.loads(result.stdout)
    evidence = []
    for source, destination in FILES.items():
        item = data["files"].get(source)
        if item is None:
            evidence.append({"source": source, "missing": True})
            continue
        content = item["text"]
        placeholders = []
        if destination.endswith(".yml"):
            content, placeholders = sanitize_compose(content)
        if destination.endswith(".conf"):
            # Nginx configuration must never include inline auth credentials.
            if re.search(r"(?:Authorization|api[_-]?key|password|secret|token)", content, re.I):
                raise RuntimeError("Nginx source requires manual credential review before snapshot")
        if destination.startswith("live-file-gateway/"):
            if re.search(r"(?:password|secret|token|api[_-]?key)\s*[:=]\s*[\"'][A-Za-z0-9_+/=-]{20,}[\"']", content, re.I):
                raise RuntimeError("Gateway source contains a potential literal credential")
        path = BASE / destination
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        entry = {"source": source, "snapshot": destination, "production_sha256": item["sha256"], "snapshot_sha256": hashlib.sha256(content.encode()).hexdigest()}
        if placeholders:
            entry["placeholder_keys"] = placeholders
        if destination.startswith("live-file-gateway/"):
            tracked = BASE.parent / "ops/crm-file-gateway" / destination.removeprefix("live-file-gateway/")
            entry["tracked_path"] = str(tracked.relative_to(BASE.parent))
            entry["tracked_exists"] = tracked.is_file()
            if tracked.is_file():
                entry["tracked_sha256"] = hashlib.sha256(tracked.read_bytes()).hexdigest()
                entry["matches_tracked"] = entry["tracked_sha256"] == item["sha256"]
        evidence.append(entry)
    metadata = {
        "verified_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "verification": "SSH read-only: explicit source whitelist and selected docker inspect fields",
        "ssh_host": "cnps-crm-hk",
        "server": {"public_ip": "101.47.77.53", "deployment_directory": "/opt/cnps-crm", "compose_project": "cnps-crm", "operating_system": "Ubuntu 22.04"},
        "api_domain": "crm-api.cnps.ai",
        "customer_domain": "crm.cnps.ai",
        "database": {"engine": "PostgreSQL 16", "database": "cnps", "user": "cnps", "host": "db", "docker_port": 5432, "host_port_published": False},
        "containers": data["containers"],
        "sources": evidence,
        "excluded": ["environment values", "private keys", "authentication files", "backup credentials", "database contents", "Docker volumes", "customer documents"],
    }
    (BASE / "production-architecture.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps({"snapshots": sum(not x.get("missing") for x in evidence), "missing": [x["source"] for x in evidence if x.get("missing")], "drift": [x["tracked_path"] for x in evidence if x.get("matches_tracked") is False], "not_tracked": [x["tracked_path"] for x in evidence if x.get("tracked_exists") is False]}))


if __name__ == "__main__":
    main()
