# Agent & Contributor Guidelines (`SandboxWorkflow`)

Keep this repository clean, modular, and 100% self-contained.

## 1. Source vs. Generated Build Artifacts

1. **Edit `src/sandbox_workflow/{template.html,styles.css,app.js}` ONLY.**
2. **NEVER hand-edit `dist/SandboxWorkflow_v1.8.0.html` or `dist/index.html`.** They are generated single-file outputs built deterministically by `scripts/bundle.py`.
3. After any edit in `src/sandbox_workflow/`, rebuild the bundle:
   ```bash
   python scripts/bundle.py
   ```
4. Check source-to-dist parity without overwriting files (`--check` fails if stale):
   ```bash
   python scripts/bundle.py --check
   ```
5. Run the full verification suite before completing any task:
   ```bash
   python -m unittest discover -s tests -p "test_*.py" -v
   ```

## 2. UI, Layout & Graph Invariants

- **Flex-Column App Shell**: Preserve `body { display: flex; flex-direction: column; overflow: hidden }`, the wrapping `header.topbar` (`flex: 0 0 auto; height: auto; flex-wrap: wrap` with compact `<=44px` rows), and `min-height: 0` on `.main-layout` / `.workspace` so toolbars never overlap the canvas on narrower windows.
- **No Giant Hero Banners**: Never add `hero-banner` or `giant-header` blocks that push the workspace below the fold.
- **Non-Destructive `+ New Blank`**: `createNewBlankWorkflow()` and `loadPresetTemplate('blank')` must always open an unlocked `"Untitled Workflow"` canvas without mutating existing presets or `localStorage` entries.
- **Editable Node Ports**: Newly spawned generic nodes must stay editable (never locked output-only) with live `+In`/`-In`/`+Out`/`-Out` buttons and automatic wire remapping on port rename or deletion.
- **Black-Box Container Bulkheads**: Cross-boundary wires attach to container edge ports (`inPorts` / `outPorts`); collapsing a container (`[–]`) hides internal nodes while keeping external edges intact.

## 3. Code Quality & Offline Security Gates

- **Zero Duplicate JS Functions**: Never declare two top-level `function <name>(` definitions with the same name in `src/sandbox_workflow/app.js`.
- **Syntax Parity**: Both `src/sandbox_workflow/app.js` and every `<script>` block in `dist/SandboxWorkflow_v1.8.0.html` must pass `node --check`.
- **Balanced HTML Structure**: Keep exactly one `<body>`, one `</body>`, one `offline-transport-stub` script block, and balanced `<div>` elements in `src/sandbox_workflow/template.html`.
- **Strict Offline Hygiene**: Never introduce external network URLs, `eval(`, `new Function(`, raw `base64` / `data:` inline blobs, or machine-specific local filesystem paths in `src/`, `dist/`, or `examples/`.
- **Public Example Workflows**: Keep `examples/` and `dist/workflows/` generic, self-contained `.workflow.json` files listed cleanly in `dist/workflows/manifest.json` (`"version": "1.8.0"`).

## 4. Repository Layout Quick Reference

- `src/sandbox_workflow/template.html` — Topbar, sidebars, canvas viewport, and modal markup
- `src/sandbox_workflow/styles.css` — Flex-column layout, node/container themes, and wire styles
- `src/sandbox_workflow/app.js` — State management, orthogonal A* wire router, and offline I/O
- `scripts/bundle.py` — Single-file HTML bundler, duplicate-function gate, and `node --check` runner
- `dist/workflows/manifest.json` — Static workflow manifest auto-loaded over HTTP (`python -m http.server`)
- `examples/` — Reference `.workflow.json` blueprints kept in sync with `dist/workflows/`
- `tests/test_sandbox_workflow.py` — Bundle parity, manifest, and Node VM behavioral test suite
