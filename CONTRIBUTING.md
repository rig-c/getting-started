# Contributing

`rig-c/getting-started` is the step-by-step guide that takes a newcomer from one character painting to a rigged character breathing, blinking, and waving in the browser, together with the scripts that test every step of the walkthrough.

## Getting the code running

You need [Bun](https://bun.sh) 1.4+ (and [uv](https://docs.astral.sh/uv/) if you run the Python keypoint script in step 6). The *Try it first* walkthrough in [README.md](README.md#try-it-first--no-gpu-about-3-minutes) runs in a separate working directory outside this repository using pre-built example inputs and requires no GPU. Only the optional painting and See-through layer-extraction steps of *Make your own character* use a GPU or the See-through web demo.

## Before you open a pull request

Run the fast offline README, link-reader, and walkthrough-extractor checks (from `.github/workflows/adapters.yml` and [AGENTS.md](AGENTS.md)):

```sh
bun scripts/check-readme.ts
bun test scripts/check-readme.test.ts
bun test scripts/link-reader.test.ts
bun test scripts/try-it.test.ts
```

When a change touches walkthrough commands, helper scripts, or adapter snippets, also run the end-to-end browser and walkthrough checks (long runs that install published packages from npm, download inputs, and launch headless browsers; `try-it.ts` requires `TRY_IT_TEMP_ROOT` set to a directory outside the checkout):

```sh
bun scripts/check-adapters.ts
TRY_IT_TEMP_ROOT=<temp-dir-outside-repo> bun scripts/try-it.ts --mode force --out <out-dir>
```

In CI, `.github/workflows/adapters.yml` runs `bun scripts/check-adapters.ts --install-system-deps` and `bun scripts/try-it.ts --mode "$TRY_IT_MODE"`.

## Reporting a change

- **Issue first.** Open an issue before changing the guide or its scripts, naming the step, the command you ran, its verbatim output, and what you expected.
- **One issue per pull request.** Keep each pull request focused on a single issue.
- **Conventional Commits.** Write commit messages and documentation in English using [Conventional Commits](https://www.conventionalcommits.org/) with a scope (`fix(guide):`, `test(try-it):`, `docs(readme):`). Keep all tracked files free of private names and local paths.

## Where further rules live

- [AGENTS.md](AGENTS.md) — README scope, word-count cap, heading allowlist, and link rules.
- [docs/REFERENCE.md](docs/REFERENCE.md) — tested package records, environment details, and detailed measurements.
- [README.md](README.md) and [LICENSE](LICENSE) — the walkthrough and MIT licence terms.
