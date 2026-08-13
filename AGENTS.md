<!-- BEGIN:nextjs-agent-rules -->
# Next.js in this project

This project uses the **App Router** (`app/`) with standard conventions and no
canary or experimental APIs. Treat the ordinary Next 14 App Router rules as
correct rather than hunting for version-specific deviations.

There is no bundled documentation to read: `node_modules/next/dist/docs/` does
not exist in this install (nor does any `docs` directory under `node_modules/next`).
For anything version-specific, use <https://nextjs.org/docs> and check the
version selector, or read the actual source in `node_modules/next/dist/`.

Pin behaviour to what the installed version does, not to what a newer or older
major does — check `node_modules/next/package.json` if the version matters to
the change you are making.
<!-- END:nextjs-agent-rules -->
