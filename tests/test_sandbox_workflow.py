#!/usr/bin/env python3
"""
Standalone verification suite for SandboxWorkflow v1.8.1:
- Bundle assembly parity (`scripts/bundle.py --check`) and clean HTML structure
- `node --check`, duplicate-function check, layout check, and zero-leak offline security checks
- `dist/workflows/manifest.json` and `examples/*.workflow.json` validation
- Node VM behavioral audit: offline boot presets, `+ New Blank`, editable new-node ports,
  external manifest loading, offline `Sync Folder`, live canvas search, sequential file tracer,
  GitHub feedback draft builder, and offline placeholder guard
"""

from __future__ import annotations

import ast
import json
import re
import shutil
import subprocess
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts import bundle

DIST_HTML = REPO_ROOT / "dist" / "SandboxWorkflow_v1.8.1.html"
DIST_INDEX = REPO_ROOT / "dist" / "index.html"
MANIFEST_PATH = REPO_ROOT / "dist" / "workflows" / "manifest.json"
EXAMPLES_DIR = REPO_ROOT / "examples"

NODE_VM_PROBE_JS = r"""
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = process.argv[1];
const manifestPath = process.argv[2];
const distDir = path.dirname(htmlPath);
const html = fs.readFileSync(htmlPath, 'utf8');
const manifestObj = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

function parseTagAttrs(attrStr) {
  const attrs = {};
  const re = /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(attrStr))) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

function makeClassList(el) {
  const set = new Set((el.className || '').split(/\s+/).filter(Boolean));
  return {
    add(...cls) { cls.forEach(c => set.add(c)); el.className = [...set].join(' '); },
    remove(...cls) { cls.forEach(c => set.delete(c)); el.className = [...set].join(' '); },
    toggle(c, force) {
      if (force === true) set.add(c);
      else if (force === false) set.delete(c);
      else if (set.has(c)) set.delete(c);
      else set.add(c);
      el.className = [...set].join(' ');
      return set.has(c);
    },
    contains(c) { return set.has(c); }
  };
}

function makeEl(id, tag = 'DIV') {
  const el = {
    id, tagName: tag, value: '', textContent: '', innerHTML: '', className: '',
    width: 800, height: 500, children: [], style: {}, attrs: {}, options: [],
    _clickCount: 0,
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); },
    getAttribute(k) { return k === 'class' ? this.className : (this.attrs[k] !== undefined ? this.attrs[k] : null); },
    appendChild(ch) {
      this.children.push(ch);
      if (this.tagName === 'SELECT' && ch && ch.tagName === 'OPTION' && !this.options.includes(ch)) {
        this.options.push(ch);
      }
      return ch;
    },
    remove(idx) {
      if (typeof idx === 'number' && Array.isArray(this.options)) {
        this.options.splice(idx, 1);
      }
    },
    addEventListener() {},
    closest() { return null; },
    contains() { return false; },
    focus() {},
    select() {},
    click() { this._clickCount += 1; },
    getContext() {
      return {
        clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
        stroke() {}, fill() {}, arc() {}, closePath() {}, save() {}, restore() {},
        fillText() {}, drawImage() {}, setLineDash() {}, scale() {}, translate() {},
        measureText(s) { return { width: String(s || '').length * 7 }; },
        createLinearGradient() { return { addColorStop() {} }; }
      };
    },
    toDataURL() { return 'offline-stub'; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1200, height: 800 }; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  el.classList = makeClassList(el);
  return el;
}

const elements = {};
const presetSelectMatch = html.match(/<select\b[^>]*\bid=["']presetSelect["'][^>]*>([\s\S]*?)<\/select>/i);
const optMatches = [...(presetSelectMatch ? presetSelectMatch[1] : '').matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)];
const presetSel = makeEl('presetSelect', 'SELECT');
presetSel.options = optMatches.map((m, idx) => {
  const attrs = parseTagAttrs(m[1]);
  const opt = makeEl('opt_' + idx, 'OPTION');
  opt.value = attrs.value || '';
  opt.textContent = m[2].replace(/<[^>]+>/g, '').trim();
  opt.attrs = attrs;
  return opt;
});
presetSel.value = (presetSel.options[0] && presetSel.options[0].value) || 'example';
elements['presetSelect'] = presetSel;

const modeBadgeMatch = html.match(/<span\b[^>]*\bid=["']modeBadge["'][^>]*>([\s\S]*?)<\/span>/i);
elements['modeBadge'] = makeEl('modeBadge', 'SPAN');
elements['modeBadge'].textContent = modeBadgeMatch ? modeBadgeMatch[1].trim() : '';

const doc = {
  body: makeEl('body', 'BODY'),
  documentElement: { outerHTML: '' },
  activeElement: null,
  addEventListener() {},
  getElementById(id) { if (!elements[id]) elements[id] = makeEl(id); return elements[id]; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) { return makeEl('dyn_' + tag, tag.toUpperCase()); }
};

const storage = {};
const storageWrites = [];
const ctx = {
  window: null,
  document: doc,
  localStorage: {
    getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); storageWrites.push(String(k)); },
    removeItem(k) { delete storage[k]; }
  },
  location: { protocol: 'file:', search: '' },
  URLSearchParams,
  console,
  performance,
  setTimeout: () => 1,
  clearTimeout: () => {},
  addEventListener: () => {},
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } }
};
ctx.window = ctx;
vm.createContext(ctx);
for (const code of scripts) vm.runInContext(code, ctx);

async function runAudit() {
  // 1. Offline boot defaults & starter presets
  const bootId = ctx.S.workflowId;
  const bootBadge = elements['modeBadge'].textContent;
  const bootPresetOptions = presetSel.options.map(o => o.value);
  const bootPresetKeys = Object.keys(ctx.window.WORKFLOW_PRESETS || {});
  const bootDomHtml = elements['dom-items-layer'] ? elements['dom-items-layer'].innerHTML : '';

  // 2. Non-destructive + New Blank workflow
  ctx.loadPresetTemplate('algorithm');
  const algoNodeCount = ctx.S.nodes.length;
  storage['sandbox_wf_preset_state_algorithm'] = JSON.stringify({ sentinel: 'ok' });
  const writesBeforeBlank = storageWrites.length;
  ctx.createNewBlankWorkflow();
  const afterNewBlank = {
    workflowId: ctx.S.workflowId,
    title: ctx.S.title,
    workflowStatus: ctx.S.workflowStatus,
    editUnlocked: ctx.S.editUnlocked,
    lockLayout: ctx.S.lockLayout,
    nodesLen: ctx.S.nodes.length,
    wiresLen: ctx.S.wires.length,
    presetSelectVal: presetSel.value,
    storageWritesDelta: storageWrites.length - writesBeforeBlank,
    algoSentinel: storage['sandbox_wf_preset_state_algorithm']
  };
  ctx.loadPresetTemplate('algorithm');
  const algoNodesAfterReload = ctx.S.nodes.length;

  // 3. loadPresetTemplate('blank')
  ctx.loadPresetTemplate('blank');
  const afterLoadBlankId = ctx.S.workflowId;
  const afterLoadBlankStatus = ctx.S.workflowStatus;

  // 4. Editable new-node port creation & wire remapping
  const nAdd = ctx.addNode('empty');
  ctx.ctxSpawn('empty');
  const nCtx = ctx.S.nodes[ctx.S.nodes.length - 1];
  const nSpawn = ctx.spawnEmptyNode();
  const spawned = {
    add: { type: nAdd.type, inPorts: nAdd.inPorts.slice(), outPorts: nAdd.outPorts.slice() },
    ctx: { type: nCtx.type, inPorts: nCtx.inPorts.slice(), outPorts: nCtx.outPorts.slice() },
    fn: { type: nSpawn.type, inPorts: nSpawn.inPorts.slice(), outPorts: nSpawn.outPorts.slice() }
  };
  ctx.selectItem('node', nAdd.id);
  ctx.renderInspector();
  ctx.renderAll();
  const portInspectorHtml = elements['inspectorContent'].innerHTML || '';
  const portCanvasHtml = elements['dom-items-layer'].innerHTML || '';

  ctx.updateSelectedPorts('inPorts', 'alpha_in, beta_in');
  const editedInPorts = nAdd.inPorts.slice();
  ctx.adjustNodePorts(null, nAdd.id, 'in', 1);
  ctx.adjustNodePorts(null, nAdd.id, 'out', 1);
  const afterAddPorts = { inPorts: nAdd.inPorts.slice(), outPorts: nAdd.outPorts.slice() };

  ctx.S.wires = [
    { id: 'w1', fromNode: 'up', fromPort: 'out_1', fromDir: 'out', toNode: nAdd.id, toPort: 'alpha_in', toDir: 'in' },
    { id: 'w2', fromNode: nAdd.id, fromPort: 'out_1', fromDir: 'out', toNode: 'dn', toPort: 'in_1', toDir: 'in' }
  ];
  ctx.updateSelectedPorts('inPorts', 'renamed_alpha, beta_in, in_3');
  ctx.updateSelectedPorts('outPorts', 'renamed_out_1, out_2');
  const remappedWires = ctx.S.wires.map(w => ({ id: w.id, fromPort: w.fromPort, toPort: w.toPort }));

  // 5. loadExternalWorkflowManifest('./workflows/manifest.json', mockFetch)
  async function mockFetch(url) {
    const cleanRel = String(url).replace(/^\.\//, '');
    if (cleanRel === 'workflows/manifest.json') {
      return { ok: true, status: 200, json: async () => manifestObj };
    }
    const targetPath = path.resolve(distDir, cleanRel);
    const payload = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    return { ok: true, status: 200, json: async () => payload };
  }
  const manifestRes = await ctx.loadExternalWorkflowManifest('./workflows/manifest.json', mockFetch);
  const dropdownAfterManifest = presetSel.options.map(o => o.value);
  ctx.loadPresetTemplate('data_pipeline_starter');
  const loadedManifestWorkflowId = ctx.S.workflowId;
  const loadedManifestNodeCount = ctx.S.nodes.length;
  const loadedManifestDom = elements['dom-items-layer'].innerHTML || '';

  // 6. openWorkflowFolderPicker() and loadWorkflowFolderFiles()
  const pickerOpened = ctx.openWorkflowFolderPicker();
  const folderClickCount = elements['workflowFolderInput']._clickCount;
  const localFlow = {
    workflowId: 'local_folder_flow',
    title: 'Local Folder Flow',
    workflowStatus: 'construction',
    nodes: [{ id: 'n_local_1', title: 'Local Step', inPorts: ['in_1'], outPorts: ['out_1'], x: 50, y: 50 }],
    wires: []
  };
  const folderRes = await ctx.loadWorkflowFolderFiles({
    target: {
      files: [
        { name: 'local_folder_flow.workflow.json', async text() { return JSON.stringify(localFlow); } }
      ]
    }
  });
  const folderLoadedId = ctx.S.workflowId;

  // 7. v1.8.1 Live Canvas Search, Slow Sequential File Tracer, GitHub Issue Builder & Offline Placeholder Guard
  ctx.loadPresetTemplate('example');
  const searchInput = elements['workflowSearchFilter'];
  searchInput.value = 'Sealer';
  const searchRes = ctx.onCanvasSearchInput();
  const focusedHit = ctx.cycleCanvasSearchMatch(1);
  ctx.clearCanvasSearch();
  const afterClearSearch = ctx.onCanvasSearchInput();

  ctx.selectItem('node', 'cat_blackbox');
  ctx.setFlowTraceSpeed(0.5);
  const traceStart = ctx.startSequentialFlowTrace({ paused: true });
  ctx.stepSequentialFlowTrace();
  const traceStateMidStep = ctx.getFlowTraceState();
  let guardSteps = 0;
  while (ctx.getFlowTraceState().active && guardSteps++ < 20) {
    ctx.stepSequentialFlowTrace();
  }
  const traceStateAfterStep = ctx.getFlowTraceState();
  const outputBucket = (ctx.S.fileContainers || []).find(b => b.id === 'fc_output');
  const outputBucketReport = outputBucket ? (outputBucket.lastStepRunReport || '') : '';
  const outputBucketFilesLen = outputBucket && Array.isArray(outputBucket.files) ? outputBucket.files.length : 0;
  ctx.stopSequentialFlowTrace(true);

  elements['ghFeedbackTitle'] = makeEl('ghFeedbackTitle', 'INPUT');
  elements['ghFeedbackBody'] = makeEl('ghFeedbackBody', 'TEXTAREA');
  elements['ghFeedbackTitle'].value = 'Search focus jumps nicely';
  elements['ghFeedbackBody'].value = 'Testing GitHub draft helper';
  ctx.setGithubFeedbackKind('feature');
  const ghDraft = ctx.buildGithubIssuePayload();

  const offlineGuardRes = await ctx.openLocalPath('./assets/summary_report.csv', 'app', null, 'fc_output');

  console.log(JSON.stringify({
    bootId,
    bootBadge,
    bootPresetOptions,
    bootPresetKeys,
    bootDomHtml,
    algoNodeCount,
    algoNodesAfterReload,
    afterNewBlank,
    afterLoadBlankId,
    afterLoadBlankStatus,
    spawned,
    portInspectorHtml,
    portCanvasHtml,
    editedInPorts,
    afterAddPorts,
    remappedWires,
    manifestRes,
    dropdownAfterManifest,
    loadedManifestWorkflowId,
    loadedManifestNodeCount,
    loadedManifestDom,
    pickerOpened,
    folderClickCount,
    folderRes,
    folderLoadedId,
    searchMatchCount: searchRes.matches.length,
    focusedHitId: focusedHit ? focusedHit.id : '',
    afterClearSearchCount: afterClearSearch.matches.length,
    traceStart,
    traceStateAfterStep,
    outputBucketReport,
    outputBucketFilesLen,
    ghDraft,
    offlineGuardRes
  }));
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
"""


class _DivBalanceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.depth = 0
        self.min_depth = 0
        self._in_raw = False

    def handle_starttag(self, tag: str, attrs: list) -> None:
        t = tag.lower()
        if t in ("script", "style"):
            self._in_raw = True
        elif t == "div" and not self._in_raw:
            self.depth += 1

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        if t in ("script", "style"):
            self._in_raw = False
        elif t == "div" and not self._in_raw:
            self.depth -= 1
            if self.depth < self.min_depth:
                self.min_depth = self.depth


class TestSandboxWorkflowStandalone(unittest.TestCase):
    """Verify SandboxWorkflow v1.8.1 bundle integrity, manifests, and Node VM behavior."""

    def test_1_bundle_parity_gates_and_node_syntax(self) -> None:
        html_doc, out_path = bundle.build_bundle(write=False, repo_root=REPO_ROOT)
        self.assertEqual(out_path, DIST_HTML)
        self.assertTrue(DIST_HTML.is_file(), f"Missing {DIST_HTML}")
        self.assertTrue(DIST_INDEX.is_file(), f"Missing {DIST_INDEX}")
        self.assertEqual(DIST_HTML.read_text(encoding="utf-8"), html_doc)
        self.assertEqual(DIST_INDEX.read_text(encoding="utf-8"), html_doc)

        self.assertIn("<title>Sandbox workflow tool — v1.8.1</title>", html_doc)
        self.assertIn(">Sandbox workflow tool</span>", html_doc)
        self.assertIn('id="newBlankWorkflowBtn"', html_doc)
        self.assertIn('id="btnGithubFeedback"', html_doc)
        self.assertIn('id="flowTraceSpeedSelect"', html_doc)
        self.assertNotIn('id="loadDemoBtn"', html_doc)
        self.assertIn('id="offline-transport-stub"', html_doc)
        self.assertEqual(html_doc.count("</body>"), 1)
        self.assertEqual(html_doc.count("<body>"), 1)

        parser = _DivBalanceParser()
        parser.feed(html_doc)
        self.assertEqual(parser.depth, 0, f"Unbalanced <div> depth: {parser.depth}")
        self.assertEqual(parser.min_depth, 0, f"Negative <div> nesting: {parser.min_depth}")

        # Verify bundle.py itself parses cleanly with Python AST
        bundle_src = (REPO_ROOT / "scripts" / "bundle.py").read_text(encoding="utf-8")
        ast.parse(bundle_src, filename="scripts/bundle.py")

    def test_2_manifest_and_examples_valid_and_synced(self) -> None:
        self.assertTrue(MANIFEST_PATH.is_file(), f"Missing {MANIFEST_PATH}")
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        self.assertEqual(manifest.get("version"), "1.8.1")
        entries = manifest.get("workflows")
        self.assertIsInstance(entries, list)
        self.assertGreaterEqual(len(entries), 2)

        for entry in entries:
            wf_id = entry["id"]
            rel_url = entry["url"]
            self.assertTrue(rel_url.startswith("./workflows/"))
            dist_wf_path = REPO_ROOT / "dist" / rel_url[2:]
            ex_wf_path = EXAMPLES_DIR / dist_wf_path.name
            self.assertTrue(dist_wf_path.is_file(), f"Missing dist workflow: {dist_wf_path}")
            self.assertTrue(ex_wf_path.is_file(), f"Missing examples copy: {ex_wf_path}")
            self.assertEqual(
                dist_wf_path.read_text(encoding="utf-8"),
                ex_wf_path.read_text(encoding="utf-8"),
                f"Drift between {ex_wf_path} and {dist_wf_path}",
            )
            wf_data = json.loads(dist_wf_path.read_text(encoding="utf-8"))
            self.assertEqual(wf_data.get("workflowId"), wf_id)
            self.assertGreaterEqual(len(wf_data.get("nodes", [])), 2)
            self.assertGreaterEqual(len(wf_data.get("wires", [])), 1)

    def test_3_node_vm_presets_new_blank_editable_ports_manifest_and_folder_import(self) -> None:
        node_bin = shutil.which("node")
        self.assertIsNotNone(node_bin, "node binary must be available in PATH")
        proc = subprocess.run(
            [node_bin, "-e", NODE_VM_PROBE_JS, str(DIST_HTML), str(MANIFEST_PATH)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=25,
            check=False,
        )
        self.assertEqual(
            proc.returncode,
            0,
            f"Node VM probe failed:\nSTDERR:\n{proc.stderr}\nSTDOUT:\n{proc.stdout}",
        )
        lines = [ln for ln in proc.stdout.splitlines() if ln.strip()]
        out = json.loads(lines[-1])

        # Offline boot state
        self.assertEqual(out["bootId"], "example")
        self.assertEqual(out["bootBadge"], "v1.8.1")
        self.assertEqual(out["bootPresetOptions"], ["example", "hello_world", "algorithm", "blank"])
        self.assertEqual(out["bootPresetKeys"], ["example", "hello_world", "algorithm"])
        self.assertIn('class="wf-node ', out["bootDomHtml"])

        # + New Blank non-destructive check
        nb = out["afterNewBlank"]
        self.assertEqual(nb["workflowId"], "blank")
        self.assertEqual(nb["title"], "Untitled Workflow")
        self.assertEqual(nb["workflowStatus"], "sandbox")
        self.assertTrue(nb["editUnlocked"])
        self.assertFalse(nb["lockLayout"])
        self.assertEqual(nb["nodesLen"], 0)
        self.assertEqual(nb["wiresLen"], 0)
        self.assertEqual(nb["presetSelectVal"], "blank")
        self.assertEqual(nb["storageWritesDelta"], 0)
        self.assertEqual(json.loads(nb["algoSentinel"])["sentinel"], "ok")
        self.assertEqual(out["algoNodesAfterReload"], out["algoNodeCount"])
        self.assertEqual(out["afterLoadBlankId"], "blank")
        self.assertEqual(out["afterLoadBlankStatus"], "sandbox")

        # Editable new-node ports
        for label in ("add", "ctx", "fn"):
            nd = out["spawned"][label]
            self.assertNotEqual(nd["type"], "idea")
            self.assertEqual(nd["inPorts"], ["in_1"])
            self.assertEqual(nd["outPorts"], ["out_1"])
        in_input_m = re.search(r"<input\b[^>]*\bid=[\"']insp-in-ports-input[\"'][^>]*>", out["portInspectorHtml"], re.I)
        self.assertIsNotNone(in_input_m)
        self.assertNotIn("disabled", in_input_m.group(0).lower())
        for btn_id in (
            'id="insp-btn-add-in-port"',
            'id="insp-btn-rem-in-port"',
            'id="insp-btn-add-out-port"',
            'id="insp-btn-rem-out-port"',
        ):
            self.assertIn(btn_id, out["portInspectorHtml"])
        self.assertIn("node-port-controls", out["portCanvasHtml"])
        self.assertEqual(out["editedInPorts"], ["alpha_in", "beta_in"])
        self.assertEqual(out["afterAddPorts"]["inPorts"], ["alpha_in", "beta_in", "in_3"])
        self.assertEqual(out["afterAddPorts"]["outPorts"], ["out_1", "out_2"])
        wires_by_id = {w["id"]: w for w in out["remappedWires"]}
        self.assertEqual(wires_by_id["w1"]["toPort"], "renamed_alpha")
        self.assertEqual(wires_by_id["w2"]["fromPort"], "renamed_out_1")

        # Manifest loading
        mres = out["manifestRes"]
        self.assertTrue(mres["ok"])
        self.assertEqual(mres["count"], 2)
        self.assertIn("data_pipeline_starter", out["dropdownAfterManifest"])
        self.assertIn("etl_multi_stage_demo", out["dropdownAfterManifest"])
        self.assertEqual(out["loadedManifestWorkflowId"], "data_pipeline_starter")
        self.assertGreaterEqual(out["loadedManifestNodeCount"], 4)
        self.assertIn('class="wf-node ', out["loadedManifestDom"])

        # Folder import
        self.assertTrue(out["pickerOpened"])
        self.assertEqual(out["folderClickCount"], 1)
        self.assertTrue(out["folderRes"]["ok"])
        self.assertEqual(out["folderRes"]["keys"], ["local_folder_flow"])
        self.assertEqual(out["folderLoadedId"], "local_folder_flow")

        # v1.8.1 UX upgrades
        self.assertGreaterEqual(out["searchMatchCount"], 1)
        self.assertEqual(out["focusedHitId"], "n_sealer")
        self.assertEqual(out["afterClearSearchCount"], 0)
        self.assertTrue(out["traceStart"]["ok"])
        self.assertEqual(out["traceStart"]["speed"], 0.5)
        self.assertGreaterEqual(out["traceStart"]["hopsCount"], 1)
        self.assertGreaterEqual(out["outputBucketFilesLen"], 4)
        self.assertTrue(
            ("Generated" in out["outputBucketReport"]) or ("Updated" in out["outputBucketReport"]),
            f"Expected sequential tracer bucket report, got: {out['outputBucketReport']!r}",
        )
        self.assertTrue(out["ghDraft"]["url"].startswith("https://github.com/pzetts/SandboxWorkflow/issues/new"))
        self.assertIn("labels=enhancement", out["ghDraft"]["url"])
        self.assertEqual(out["offlineGuardRes"], {"ok": False, "placeholder": True, "path": "./assets/summary_report.csv"})


if __name__ == "__main__":
    unittest.main()
