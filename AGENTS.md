# Contributor instructions

## README scope

The README is for deciding whether to use the project and getting a first result:
what it is, install, a first run with its output shown, one line per command with
links, and links onward. Put detailed evidence in `docs/REFERENCE.md`.

Do not add flag lists, refusal catalogues, dated or machine-specific figures,
version history, or licence text beyond a pointer. A feature adds at most one
line to the README. Keep existing executable walkthrough steps intact when moving
evidence; do not rewrite retained sections as part of a mechanical split.

When moving content, repoint every content pin without dropping it. Preserve
inbound heading anchors as one-sentence link stubs. Check this repository's
readers, the site's `src/external-links.test.ts`, and other rig-c documentation.
Use absolute GitHub `blob/main` links to documents not included in package files;
this guide has no package manifest or published `files` list.

Run `bun scripts/check-readme.ts` and `bun test scripts/check-readme.test.ts`
after README changes. The check caps all whitespace-delimited words at 2,700,
allows only the existing `##` headings, and refuses dated measurement phrases
and dates in table cells. The cap comes from issue #48's post-cut 2,451 words
plus 10%, rounded up to 50; an earlier lower cap takes precedence.
