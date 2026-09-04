"""Record real, ordered report revisions with before/after snapshots and diffs."""
from pathlib import Path
import sys, hashlib, json, difflib, datetime, re
ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'content/reports/fastgpt-cnps-global-growth.md'
AUDIT = ROOT / 'research/iterations'
def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def checkpoint(label, finding, change, validation):
    AUDIT.mkdir(parents=True, exist_ok=True)
    rows = json.loads((AUDIT/'ledger.json').read_text()) if (AUDIT/'ledger.json').exists() else []
    n = len(rows)
    current = REPORT.read_text()
    previous = (AUDIT/f'v{n-1:02d}.md').read_text() if n else ''
    assert current != previous, 'A revision must change the actual report.'
    assert len(re.findall(r'^## 第\d+章', current, re.M)) >= 25
    snapshot = AUDIT/f'v{n:02d}.md'
    snapshot.write_text(current)
    diff = ''.join(difflib.unified_diff(previous.splitlines(True), current.splitlines(True), fromfile=f'v{n-1:02d}', tofile=f'v{n:02d}'))
    (AUDIT/f'v{n:02d}.diff').write_text(diff)
    rows.append(dict(round=n, label=label, finding=finding, change=change, validation=validation,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        before_sha256=sha(previous), after_sha256=sha(current), characters=len(current),
        added_lines=sum(1 for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++')),
        removed_lines=sum(1 for l in diff.splitlines() if l.startswith('-') and not l.startswith('---'))))
    (AUDIT/'ledger.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
    print(f'Round {n:02d}: {label}; {len(current)} characters; SHA256 {sha(current)[:16]}')
if __name__ == '__main__': checkpoint(*sys.argv[1:5])
