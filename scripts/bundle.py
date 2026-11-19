#!/usr/bin/env python3
"""
Standalone bundler & verification gate for SandboxWorkflow v1.8.1.

Reads modular sources from `src/sandbox_workflow/{styles.css,template.html,app.js}`,
assembles the single-file offline distribution `dist/SandboxWorkflow_v1.8.0.html`
(and `dist/index.html`), and enforces:
  - Structure & Top-Bar Layout Gate (balanced wrappers, zero hero-banner)
  - Duplicate JS Function Check
  - `node --check` Syntax Check across `app.js` and every HTML `<script>` block
  - Offline Security & Zero-Leak Check
  - Optional `dist/workflows/manifest.json` integrity validation
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src" / "sandbox_workflow"
DIST_DIR = REPO_ROOT / "dist"
OUTPUT_FILENAME = "SandboxWorkflow_v1.9.1.html"
INDEX_FILENAME = "index.html"
PAGE_TITLE = "Sandbox workflow tool — v1.9.1"

FORBIDDEN_SCAN_TOKENS: Tuple[str, ...] = (
    "http://",
    "https://",
    "eval(",
    "new function(",
    "base64",
    "data:",
)

LOCAL_PATH_PATTERNS: Tuple[Tuple[str, str, int], ...] = (
    ("Windows user path", r"[A-Za-z]:[\\/]Users[\\/]", re.IGNORECASE),
    ("UNC share path", r"\\\\[A-Za-z0-9_.-]+\\[A-Za-z0-9_.-]+", 0),
    ("Unreplaced script placeholder", r"<!--APP_SCRIPT_PLACEHOLDER-->", 0),
    ("Internal ticket token", r"\b(?:TICKET|TKT|INV|ADR)-\d+", re.IGNORECASE),
    ("Public repo publication/internal token", r"\b(?:MIL-HDBK|MIL-STD|516D|881F|MR-114|ASD-STE100|Syntopicon|ChiefOfStaff|surface11|taila16d38|Slack)\b|\bDoD\s+RIO\b|\bRAND\b", re.IGNORECASE),
)

TOP_LEVEL_JS_FN_RE = re.compile(
    r"^[ \t]{0,4}(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(",
    re.MULTILINE,
)


def scan_js_duplicate_functions(text: str, label: str = "<script>") -> List[str]:
    """Return error strings for any duplicate top-level `function <name>(` declarations."""
    issues: List[str] = []
    is_html = label.lower().endswith(".html") or "<script" in text.lower()
    blocks: List[Tuple[int, str]] = []
    if is_html:
        for match in re.finditer(r"<script\b[^>]*>(.*?)</script>", text, re.IGNORECASE | re.DOTALL):
            base_line = text[: match.start(1)].count("\n") + 1
            blocks.append((base_line, match.group(1)))
    else:
        blocks.append((1, text))

    for base_line, block in blocks:
        seen: Dict[str, int] = {}
        for match in TOP_LEVEL_JS_FN_RE.finditer(block):
            fn_name = match.group(1)
            lineno = base_line + block[: match.start()].count("\n")
            if fn_name in seen:
                issues.append(
                    f"{label}:{lineno}: Duplicate top-level JS function '{fn_name}' "
                    f"(first defined at line {seen[fn_name]})"
                )
            else:
                seen[fn_name] = lineno
    return issues


def scan_security_and_leaks(text: str, label: str, *, check_scan_tokens: bool = True) -> List[str]:
    """Verify text has zero forbidden inline/network tokens or local filesystem leaks."""
    issues: List[str] = []
    if check_scan_tokens:
        lower = text.lower()
        for tok in FORBIDDEN_SCAN_TOKENS:
            if tok in lower:
                issues.append(f"{label}: Forbidden security token '{tok}' detected")
    for pat_label, pattern, flags in LOCAL_PATH_PATTERNS:
        if re.search(pattern, text, flags):
            issues.append(f"{label}: Forbidden {pat_label} pattern detected")
    return issues


def scan_ui_layout_gate(text: str, label: str) -> List[str]:
    """Verify UI keeps compact wrapped topbar without giant hero-banner classes."""
    lower = text.lower()
    issues: List[str] = []
    if 'class="hero-banner"' in lower or 'class="giant-header"' in lower:
        issues.append(f"{label}: Giant hero-banner / giant-header class is forbidden")
    return issues


def run_node_syntax_checks(html_doc: str, app_js: str) -> None:
    """Run `node --check` on `app.js` and every `<script>` block inside `html_doc`."""
    node_bin = shutil.which("node")
    if not node_bin:
        raise RuntimeError("`node` binary is required in PATH to syntax-check bundled JS.")

    scripts = re.findall(r"<script\b[^>]*>(.*?)</script>", html_doc, flags=re.IGNORECASE | re.DOTALL)
    if len(scripts) < 2:
        raise ValueError(f"Expected >= 2 <script> blocks in bundled HTML, found {len(scripts)}")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        src_js_tmp = tmp_path / "app.js"
        src_js_tmp.write_text(app_js, encoding="utf-8")
        proc_src = subprocess.run(
            [node_bin, "--check", str(src_js_tmp)],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
        if proc_src.returncode != 0:
            raise SyntaxError(f"node --check failed on src/sandbox_workflow/app.js:\n{proc_src.stderr}")

        for idx, body in enumerate(scripts):
            script_tmp = tmp_path / f"bundle_script_{idx}.js"
            script_tmp.write_text(body, encoding="utf-8")
            proc = subprocess.run(
                [node_bin, "--check", str(script_tmp)],
                capture_output=True,
                text=True,
                timeout=20,
                check=False,
            )
            if proc.returncode != 0:
                raise SyntaxError(f"node --check failed on HTML <script> #{idx}:\n{proc.stderr}")


def assemble_html(styles_css: str, template_html: str, app_js: str) -> str:
    """Assemble the standalone single-file HTML bundle from modular source files."""
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<meta name="color-scheme" content="dark">\n'
        f"<title>{PAGE_TITLE}</title>\n"
        "<style>\n"
        f"{styles_css.rstrip()}\n"
        "</style>\n"
        "</head>\n"
        f"{template_html.rstrip()}\n"
        "<script>\n"
        f"{app_js.rstrip()}\n"
        "</script>\n"
        '<script id="offline-transport-stub">\n'
        "function postJsonViaXhr(url, payload, onDone) { onDone(false, ''); }\n"
        "</script>\n"
        "</body>\n"
        "</html>\n"
    )


def verify_manifest_if_present(dist_dir: Path) -> List[str]:
    """Validate `dist/workflows/manifest.json` and all referenced workflow files when present."""
    manifest_path = dist_dir / "workflows" / "manifest.json"
    if not manifest_path.is_file():
        return []
    raw = manifest_path.read_text(encoding="utf-8")
    errors = scan_security_and_leaks(raw, "dist/workflows/manifest.json", check_scan_tokens=True)
    data = json.loads(raw)
    if data.get("version") not in ("1.8.0", "1.8.1", "1.9.1"):
        errors.append(f"dist/workflows/manifest.json: expected version '1.8.0' or '1.8.1', got {data.get('version')!r}")
    workflows = data.get("workflows")
    if not isinstance(workflows, list) or not workflows:
        errors.append("dist/workflows/manifest.json: 'workflows' must be a non-empty list")
        return errors
    for entry in workflows:
        wf_id = entry.get("id")
        wf_url = str(entry.get("url") or "")
        if not wf_id or not entry.get("title"):
            errors.append(f"dist/workflows/manifest.json: invalid entry {entry!r}")
        if wf_url:
            rel_target = wf_url[2:] if wf_url.startswith("./") else wf_url.lstrip("/")
            wf_path = dist_dir / rel_target
            if not wf_path.is_file():
                errors.append(f"dist/workflows/manifest.json: missing referenced workflow file {wf_path}")
            else:
                wf_raw = wf_path.read_text(encoding="utf-8")
                errors.extend(scan_security_and_leaks(wf_raw, f"dist/{rel_target}", check_scan_tokens=True))
                wf_data = json.loads(wf_raw)
                wf_state = wf_data.get("state") if isinstance(wf_data.get("state"), dict) else wf_data
                if not isinstance(wf_state.get("nodes"), list) or not isinstance(wf_state.get("wires"), list):
                    errors.append(f"dist/{rel_target}: missing 'nodes' or 'wires' arrays")
    return errors


def verify_bundle(
    html_doc: str,
    styles_css: str,
    template_html: str,
    app_js: str,
    dist_dir: Path = DIST_DIR,
) -> None:
    """Run all structural, duplicate-symbol, syntax, and zero-leak gates."""
    errors: List[str] = []

    if f"<title>{PAGE_TITLE}</title>" not in html_doc:
        errors.append(f"Missing expected title '<title>{PAGE_TITLE}</title>'")
    if html_doc.count("<body>") != 1:
        errors.append(f"Expected exactly 1 <body> tag, found {html_doc.count('<body>')}")
    if html_doc.count("</body>") != 1:
        errors.append(f"Expected exactly 1 </body> tag, found {html_doc.count('</body>')}")
    stub_marker = 'id="offline-transport-stub"'
    stub_cnt = html_doc.count(stub_marker)
    if stub_cnt != 1:
        errors.append(
            f"Expected exactly 1 offline-transport-stub script, found {stub_cnt}"
        )

    errors.extend(scan_js_duplicate_functions(app_js, "src/sandbox_workflow/app.js"))
    errors.extend(scan_js_duplicate_functions(html_doc, f"dist/{OUTPUT_FILENAME}"))
    errors.extend(scan_ui_layout_gate(styles_css, "src/sandbox_workflow/styles.css"))
    errors.extend(scan_ui_layout_gate(template_html, "src/sandbox_workflow/template.html"))
    errors.extend(scan_ui_layout_gate(html_doc, f"dist/{OUTPUT_FILENAME}"))

    errors.extend(scan_security_and_leaks(styles_css, "src/sandbox_workflow/styles.css", check_scan_tokens=True))
    errors.extend(scan_security_and_leaks(template_html, "src/sandbox_workflow/template.html", check_scan_tokens=True))
    errors.extend(scan_security_and_leaks(app_js, "src/sandbox_workflow/app.js", check_scan_tokens=True))
    errors.extend(scan_security_and_leaks(html_doc, f"dist/{OUTPUT_FILENAME}", check_scan_tokens=True))
    errors.extend(verify_manifest_if_present(dist_dir))

    if errors:
        raise ValueError("Bundle verification failed:\n  - " + "\n  - ".join(errors))

    run_node_syntax_checks(html_doc, app_js)


def build_bundle(*, write: bool = True, repo_root: Path = REPO_ROOT) -> Tuple[str, Path]:
    """Assemble, verify, and optionally write `dist/SandboxWorkflow_v1.8.0.html` & `dist/index.html`."""
    src_dir = repo_root / "src" / "sandbox_workflow"
    dist_dir = repo_root / "dist"

    styles_css = (src_dir / "styles.css").read_text(encoding="utf-8")
    template_html = (src_dir / "template.html").read_text(encoding="utf-8")
    app_js = (src_dir / "app.js").read_text(encoding="utf-8")

    html_doc = assemble_html(styles_css, template_html, app_js)
    verify_bundle(html_doc, styles_css, template_html, app_js, dist_dir=dist_dir)

    out_path = dist_dir / OUTPUT_FILENAME
    index_path = dist_dir / INDEX_FILENAME
    if write:
        dist_dir.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html_doc, encoding="utf-8", newline="\n")
        index_path.write_text(html_doc, encoding="utf-8", newline="\n")
        byte_len = len(html_doc.encode("utf-8"))
        line_cnt = len(html_doc.splitlines())
        print(f"[bundle] Built {out_path} ({byte_len:,} bytes, {line_cnt:,} lines)")
        print(f"[bundle] Updated {index_path}")
    return html_doc, out_path


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Bundle and verify SandboxWorkflow v1.8.1.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify sources and existing dist HTML without overwriting files.",
    )
    args = parser.parse_args(argv)

    html_doc, out_path = build_bundle(write=not args.check)
    if args.check:
        if not out_path.is_file():
            raise FileNotFoundError(f"Missing built bundle: {out_path}. Run `python scripts/bundle.py` first.")
        existing = out_path.read_text(encoding="utf-8")
        if existing != html_doc:
            raise ValueError(
                f"{out_path} is out of date with src/sandbox_workflow/. Run `python scripts/bundle.py`."
            )
        print(f"[bundle] Verified {out_path} matches src/sandbox_workflow/ cleanly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
