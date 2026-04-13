# EPUB fixtures

Place a real EPUB here named `three-chapters.epub` containing **exactly 3
chapters** for deterministic parser tests. Any Project Gutenberg public-domain
EPUB works — recommended: "The Adventures of Sherlock Holmes" trimmed to 3
chapters.

Tests assert:
- parser yields 3 `Chapter` objects
- chapter titles and word counts match `three-chapters.manifest.json`
- invalid/non-EPUB buffers throw `InvalidEpubError`

The binary is intentionally not committed; CI must provide it or tests skip
with a clear message.
