# Test files

Binary fixtures for upload tests (profile photo, attachments, contracts, data import).

| File | Purpose |
|---|---|
| photo-valid.png | 200x200 PNG, well under 1 MB: accepted as a profile photo |
| photo-alt.png | 120x120 solid-colour PNG: second valid photo, used to replace an existing one |
| photo-large.png | 640x600 PNG with random pixels, ~1.15 MB: rejected with the size message |
| not-an-image.pdf | Text file with a PDF header: rejected as a disallowed photo type |
| attachment-small.txt | Small text attachment |
| attachment-large.bin | ~1.1 MB random bytes: rejected as too large |

Generated once with a Python snippet (see git history / the automate-module run); keep them under 2 MB in total.
