"""Record actual, sequential report revisions as replayable patches and hashes."""
import argparse
import difflib
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'docs/strategy/cnps-ai-global-expansion.md'
AUDIT = ROOT / 'docs/strategy/iterations'
STATE = Path('/tmp/cnps-global-strategy-previous.md')

def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()

parser = argparse.ArgumentParser()
parser.add_argument('--baseline', action='store_true')
parser.add_argument('--round', type=int)
parser.add_argument('--focus', default='')
parser.add_argument('--finding', default='')
parser.add_argument('--change', default='')
parser.add_argument('--verification', default='')
args = parser.parse_args()
AUDIT.mkdir(parents=True, exist_ok=True)
current = REPORT.read_text()
manifest_path = AUDIT / 'manifest.json'
if args.baseline:
    if manifest_path.exists():
        raise SystemExit('Baseline already recorded')
    (AUDIT / 'baseline.md').write_text(current)
    manifest = {'baseline_sha256': sha(current), 'rounds': []}
else:
    manifest = json.loads(manifest_path.read_text())
    previous = STATE.read_text()
    assert args.round == len(manifest['rounds']) + 1, 'Non-sequential round'
    assert previous != current, 'No substantive document change'
    assert all([args.focus,args.finding,args.change,args.verification])
    diff = ''.join(difflib.unified_diff(previous.splitlines(True), current.splitlines(True), fromfile=f'v{args.round-1}', tofile=f'v{args.round}'))
    (AUDIT / f'{args.round:02d}.patch').write_text(diff)
    manifest['rounds'].append({'round': args.round, 'utc': datetime.now(timezone.utc).isoformat(), 'focus': args.focus, 'finding': args.finding, 'change': args.change, 'verification': args.verification, 'before_sha256': sha(previous), 'after_sha256': sha(current), 'added_lines': sum(x.startswith('+') and not x.startswith('+++') for x in diff.splitlines()), 'removed_lines': sum(x.startswith('-') and not x.startswith('---') for x in diff.splitlines())})
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
STATE.write_text(current)
print(json.dumps({'round':len(manifest['rounds']), 'sha256':sha(current), 'characters':len(current)},ensure_ascii=False))
