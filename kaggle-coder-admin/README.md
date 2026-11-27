# Parent and maintainer files

**New coders: you don't need this folder.** Start at [../kaggle-coder/README.md](../kaggle-coder/README.md).

Kept here for Corey: background, safety notes, version pins, tests, GitHub check templates and the
other helper routes (Aider, `loop`, VSCodium, Continue). Nothing here is proven to work yet.

`../kaggle-coder/server.py` now does one thing: the 30B coding model for Cline over a quick
tunnel. The earlier full version (named tunnel, notebook mode, Kaggle Secret, 14B model) is
`server-full/server.py`. If streaming fails over the quick tunnel, the named tunnel in
`docs/TEST-CLINE.md` needs that full version, run by hand on the Kaggle web page; it does not
have the newer automatic-stop protections.

Moved from `kaggle-coder/`, so some older guides are out of date:

- The server script is now `../kaggle-coder/server.py`. Older text may call it `server.py` or
  `kaggle/server.py`.
- Links to "README, Part 1" mean the earlier README, which is in Git history.
- For a command line push, `kaggle/kernel-metadata.json` expects `server.py` beside it: copy it
  there first, and don't commit the copy.
