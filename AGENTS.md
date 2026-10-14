# Agent rules for weitzu-com/cnps.ai

## Deploys (Vercel project `cnps-ai`, team `aipy`)

- **Production ships only from `main`.** The Vercel Git integration (production branch = `main`) deploys automatically on merge. Do not deploy production yourself.
- **Never run `vercel --prod`, `vercel deploy --prod`, `vercel build --prod` or `vercel promote` from a feature branch** (`codex/*`, `cursor/*`, etc.). Open a PR and merge it; the merge to `main` deploys.
- Do not run a manual `vercel --prod` after a merge either — the Git deploy already does it (duplicates waste build minutes).
- Need a preview? Push the branch / open a PR; Vercel builds a preview. No CLI deploy needed.
- **Batch your pushes.** Commit locally and push once when the change is ready; every push to a PR branch queues a build on the shared `aipy` team.
- `vercel.json` `ignoreCommand` (`scripts/vercel-ignore-build.mjs`) skips non-main builds whose changes are only `docs/**` or root `*.md`. `content/**` always builds; `main` always builds.
- Emergency rollback only with explicit owner approval.
