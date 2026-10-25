# Keeping Try it first runnable

The `Try it first` jobs in the adapter example workflow read the `sh` fences directly
from README.md, under `## Try it first` up to the next level-two heading. Every
level-three step must have a non-empty shell block. A new step or block is included
automatically; unsupported fences fail with their step and source line. Commands run
in one Bash shell with `-eu -o pipefail`, from an empty consumer and isolated download
caches. The literal clone, unversioned install and CPU joint detector run too.

The final server fence has `<!-- try-it-ci: server -->` immediately above it. The
runner supervises that command and opens the two addresses from its step in Chromium.
It checks the actual WebGL backend, non-empty visible canvas pixels, changing stage
screenshots, animation movement, tracks, pause/resume and breeze,
then stops its server. Human visual and seam assessment is not run by this job.
Other persistent commands hit the named walkthrough timeout rather than silently pass.

A fence requiring human interaction must have an adjacent marker such as
`<!-- try-it-ci: not-run reason="requires a person at a licensed desktop" -->`.
It appears as **NOT RUN**, with its reason and source line, in logs, the receipt and
the Actions summary. The walkthrough is incomplete and cannot publish a record.
No such exception is currently needed in the guide.

Daily polling compares all four npm `latest` versions and the README digest with
the automated Tested with record. A difference runs the walkthrough. Weekly and
manual `try_it=force` runs execute regardless. Polling detects the latest release
eventually; several releases between polls can be coalesced. PRs and main pushes
also verify the guide. Only latest Bun is selected; older runtimes are not tested.
The receipt records installed versions and registry snapshots before/after execution;
a release during execution or an install mismatch fails the version gate.

The literal clone fetches the public guide's default branch, including its helpers.
It is not replaced with the workflow checkout. Both README digests and the cloned
commit are recorded; a difference is stated in provenance. Changes to unpublished
helper scripts therefore require a later published-guide run to validate that path.

On complete green, the proposal changes only the delimited automated block in
docs/REFERENCE.md. Original Linux receipts and Mac timings retain their dates and
versions. Unchanged package versions and README digest produce identical bytes,
including the previous date, even after a weekly forced run.

Only a trusted main-branch scheduled/manual publication job receives write scopes:
`contents: write`, `pull-requests: write`, `actions: write`. `GITHUB_TOKEN` pushes a
single `automation/try-it-tested` branch and opens a PR. In this repository, each
bot-created PR's ordinary workflow waits for a maintainer's workflow approval
(`action_required`). The publisher also explicitly dispatches this same workflow
on that branch for verification; that separate dispatch does not approve the waiting
PR workflow. A maintainer approves the run and reviews the record PR. The automation
does not approve or merge it. PR verification has read-only permissions and cannot
publish. Enable
**Allow GitHub Actions to create and approve pull requests** in repository Actions
settings; an organization policy may also need to allow it. Permission refusal is
a named failed publication step. No PAT or cross-repository release dispatch is used.
The bot PR references item 1 of issue #1 and closes nothing.

Workflow concurrency serializes writers. A current record returns before any git,
PR or dispatch call. Failed and incomplete runs upload their receipt/logs without
modifying the record. Logs and generated consumer files live in ignored `.try-it/`;
the large consumer and model caches are removed after execution. TMPDIR is a fresh
directory outside the repository: under RUNNER_TEMP in Actions, or an explicitly
supplied TRY_IT_TEMP_ROOT in a session scratchpad / shared-pool job directory. A
repository-internal path is refused so package discovery cannot find an ancestor's
node_modules and invalidate refusal controls.

For a targeted check: `bun test scripts/try-it.test.ts`.
For the real manual scheduled path, dispatch `adapters.yml` with `try_it=force` on
the branch to test (publication remains main-only). `try_it=poll` exercises the
daily decision; a normal dispatch leaves the existing adapter job available.
