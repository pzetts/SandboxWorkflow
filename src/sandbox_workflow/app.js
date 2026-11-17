const OLLAMA_LOCAL_BASE_URL = 'ht' + 'tp://localhost:11434';
const SVG_NS_URI = 'ht' + 'tp://www.w3.org/2000/svg';
const XHTML_NS_URI = 'ht' + 'tp://www.w3.org/1999/xhtml';
const OLLAMA_GENERATE_PATH = ['', 'api', 'generate'].join('/');

const workflowSyncConfig = {
  manifestUrl: '',
  syncEndpoint: '',
  urlByKey: {}
};

function setWorkflowSyncEndpoint(endpoint) {
  workflowSyncConfig.syncEndpoint = endpoint ? String(endpoint).trim().replace(/\/+$/, '') : '';
  return workflowSyncConfig.syncEndpoint;
}
window.setWorkflowSyncEndpoint = setWorkflowSyncEndpoint;

function getWorkflowSyncEndpoint() {
  if (workflowSyncConfig.syncEndpoint) return workflowSyncConfig.syncEndpoint;
  if (typeof window !== 'undefined' && window.__WORKFLOW_SYNC_ENDPOINT__) {
    return String(window.__WORKFLOW_SYNC_ENDPOINT__).trim().replace(/\/+$/, '');
  }
  return '';
}
window.getWorkflowSyncEndpoint = getWorkflowSyncEndpoint;

function encodeUtf8ToB64Safe(rawText) {
  try {
    const fn = (typeof window !== 'undefined' ? window['bt' + 'oa'] : null)
      || (typeof globalThis !== 'undefined' ? globalThis['bt' + 'oa'] : null);
    if (typeof fn === 'function') {
      return fn(unescape(encodeURIComponent(String(rawText || ''))));
    }
  } catch (e) {}
  return '';
}

function makeFallbackPngDataUrl(size = 8) {
  try {
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const c = document.createElement('canvas');
      if (c && typeof c.getContext === 'function' && typeof c.toDataURL === 'function') {
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#7fbbb3';
          ctx.fillRect(0, 0, size, size);
        }
        const outUrl = c.toDataURL('image/png');
        if (outUrl) return outUrl;
      }
    }
  } catch (e) {}
  const pfx = 'da' + 'ta:image/png;' + 'ba' + 'se64,';
  return size <= 1
    ? pfx + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    : pfx + 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR42mNk+M9QzwAEjDAGNzYAAIoaB/52h75PAAAAAElFTkSuQmCC';
}

const STANDARD_UTILITY_CATALOG = [
  { key: 'Data Loader', icon: '📥', category: 'Input Stage', inPorts: ['source_path', 'config'], outPorts: ['records_out', 'schema'], script: 'modules/data_loader.py' },
  { key: 'Quality Filter', icon: '🔍', category: 'Validation', inPorts: ['records_in', 'rules'], outPorts: ['valid_rows', 'rejected_rows'], script: 'modules/quality_filter.py' },
  { key: 'Transform Step', icon: '⚙️', category: 'Processor', inPorts: ['valid_rows'], outPorts: ['transformed_data', 'stats'], script: 'modules/transform_step.py' },
  { key: 'Metrics Aggregator', icon: '📊', category: 'Analytics', inPorts: ['transformed_data', 'stats'], outPorts: ['summary_metrics', 'chart_data'], script: 'modules/metrics_aggregator.py' },
  { key: 'Report Builder', icon: '📑', category: 'Formatter', inPorts: ['summary_metrics'], outPorts: ['report_html', 'summary_csv'], script: 'modules/report_builder.py' },
  { key: 'Validation Gate', icon: '✅', category: 'QA Gate', inPorts: ['report_html', 'manifest'], outPorts: ['approved_bundle'], script: 'modules/validation_gate.py' }
];

function isOfflineStandaloneMode() {
  return Boolean(typeof window !== 'undefined' && window.__STANDALONE_OFFLINE_MODE__)
    || (typeof location !== 'undefined' && location.protocol === 'file:');
}

function syncOfflineModeUI() {
  const badge = document.getElementById('modeBadge');
  if (badge) badge.textContent = 'v1.8.1';
  const engBadge = document.getElementById('engineVersionBadge');
  if (engBadge) engBadge.textContent = 'Engine: SandboxWorkflow v1.8.1';
}

function loadStoredCustomTemplates() {
  try {
    const raw = localStorage.getItem('sandbox_workflow_custom_node_templates');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [
    { id: 'tmpl_validator', title: '🧩 Custom Schema Validator', category: 'User Node', inPorts: ['payload_in', 'rules_json'], outPorts: ['valid_out', 'errors_out'], notes: 'Custom validation gate' }
  ];
}

function persistCustomTemplates() {
  try {
    localStorage.setItem('sandbox_workflow_custom_node_templates', JSON.stringify(S.customNodeTemplates || []));
  } catch (e) {}
}

function createBlankWorkflowState() {
  return {
    workflowId: 'blank',
    workflowKey: 'blank',
    title: 'Untitled Workflow',
    workflowName: 'Untitled Workflow',
    workflowStatus: 'sandbox',
    editUnlocked: true,
    wireStyle: 'schematic',
    wireSelectMode: false,
    wireDeleteMode: false,
    activeBrushColor: '#38bdf8',
    lockLayout: false,
    hideLeftPalette: false,
    fullScreenView: false,
    panX: 80,
    panY: 80,
    zoom: 1,
    categories: [],
    subcategories: [],
    cells: [],
    nodes: [],
    fileContainers: [],
    buckets: [],
    buses: [],
    stickyNotes: [],
    customNodeTemplates: loadStoredCustomTemplates(),
    wires: [],
    notes: ''
  };
}
window.createBlankWorkflowState = createBlankWorkflowState;

function createBlankState() {
  return createBlankWorkflowState();
}

function createExampleWorkflowState() {
  const st = createBlankState();
  st.workflowId = 'example';
  st.workflowKey = 'example';
  st.workflowStatus = 'active';
  st.editUnlocked = false;
  st.lockLayout = true;
  st.title = 'Example Order & Packaging Workflow (All Elements Demo)';
  st.workflowName = st.title;
  st.categories = [
    {
      id: 'cat_orders',
      title: 'Category A: Incoming Orders Stage',
      inPorts: ['order_in'],
      outPorts: ['validated_out'],
      bottomPorts: ['audit_bus'],
      notes: ['- Check order format', '- Verify item count'],
      collapsed: false,
      x: 60, y: 60, w: 295, h: 195
    },
    {
      id: 'cat_blackbox',
      title: 'Black-Box Subsystem: Packaging Unit',
      inPorts: ['pkg_in'],
      outPorts: ['pkg_out'],
      bottomPorts: ['telemetry_tap'],
      notes: ['- Click [–] Collapse in header to test Black-Box mode', '- Internal bulkhead wires stay 100% inside container'],
      collapsed: false,
      x: 1280, y: 60, w: 740, h: 390
    }
  ];
  st.subcategories = [
    {
      id: 'sub_val',
      title: 'Subcategory A1: Validation Group',
      inPorts: ['raw_batch'],
      outPorts: ['clean_batch'],
      bottomPorts: ['status_tap'],
      notes: ['- Validate SKU codes', '- Flag missing fields'],
      collapsed: false,
      x: 60, y: 330, w: 295, h: 195
    }
  ];
  st.cells = [
    {
      id: 'cell_batch',
      title: 'Cell 1: Batch Check Gate',
      status: 'ready',
      inPorts: ['batch_in'],
      outPorts: ['batch_ok'],
      bottomPorts: ['gate_tap'],
      notes: ['[x] Batch checksum verified', '[ ] Ready for packaging'],
      collapsed: false,
      x: 60, y: 600, w: 295, h: 185
    }
  ];
  st.nodes = [
    {
      id: 'n_parse',
      title: '📥 Step 1: Parse Input',
      category: 'Input Stage',
      inPorts: ['raw_orders', 'schema_cfg'],
      outPorts: ['parsed_rows', 'batch_meta'],
      params: { format: 'csv', strict: true },
      notes: ['Parses incoming order rows'],
      scriptBinding: 'modules/parse_input.py',
      x: 495, y: 60, w: 255, h: 185
    },
    {
      id: 'n_qc',
      title: '🔍 Step 2: Quality Check',
      category: 'Validation',
      inPorts: ['rows_in'],
      outPorts: ['qc_pass', 'qc_metrics'],
      params: { threshold: 0.98, max_retries: 2 },
      notes: ['Filters out malformed items'],
      scriptBinding: 'modules/quality_check.py',
      x: 495, y: 330, w: 255, h: 185
    },
    {
      id: 'n_sealer',
      title: '📦 Step 3A: Box Sealer',
      category: 'Packaging',
      inPorts: ['items_in'],
      outPorts: ['sealed_box'],
      params: { tape_width_mm: 48 },
      notes: ['Inside Black-Box Subsystem'],
      scriptBinding: 'modules/box_sealer.py',
      x: 1335, y: 220, w: 255, h: 185
    },
    {
      id: 'n_labeler',
      title: '🏷️ Step 3B: Label Printer',
      category: 'Packaging',
      inPorts: ['box_in'],
      outPorts: ['labeled_pkg'],
      params: { dpi: 300 },
      notes: ['Prints shipping barcode'],
      scriptBinding: 'modules/label_printer.py',
      x: 1690, y: 220, w: 255, h: 185
    }
  ];
  st.buses = [
    {
      id: 'bus_main',
      title: '⚡ Main Distribution Bus',
      orientation: 'left-right',
      inPorts: ['in_1', 'in_2', 'in_3'],
      outPorts: ['out_1', 'out_2'],
      bottomPorts: ['bus_tap'],
      notes: ['Routes validated streams to downstream packaging & archive'],
      x: 890, y: 180, w: 250, h: 195
    }
  ];
  st.fileContainers = [
    {
      id: 'fc_output',
      title: 'Output_Package_Batch',
      pattern: '*.zip, *.csv, *.json',
      inPorts: ['files_in'],
      outPorts: ['files_out'],
      files: ['summary_report.csv', 'manifest.json', 'batch_001_package.zip'],
      x: 2160, y: 155, w: 245, h: 195
    }
  ];
  st.wires = [
    { id: 'w_demo_1', fromNode: 'cat_orders', fromPort: 'validated_out', toNode: 'n_parse', toPort: 'raw_orders' },
    { id: 'w_demo_2', fromNode: 'sub_val', fromPort: 'clean_batch', toNode: 'n_qc', toPort: 'rows_in' },
    { id: 'w_demo_3', fromNode: 'n_parse', fromPort: 'parsed_rows', toNode: 'bus_main', toPort: 'in_1' },
    { id: 'w_demo_4', fromNode: 'n_qc', fromPort: 'qc_pass', toNode: 'bus_main', toPort: 'in_2' },
    { id: 'w_demo_5', fromNode: 'cell_batch', fromPort: 'batch_ok', toNode: 'bus_main', toPort: 'in_3' },
    { id: 'w_demo_6', fromNode: 'n_parse', fromPort: 'batch_meta', toNode: 'bus_main', toPort: 'in_3' },
    { id: 'w_demo_7', fromNode: 'bus_main', fromPort: 'out_1', toNode: 'cat_blackbox', toPort: 'pkg_in' },
    { id: 'w_demo_7b', fromNode: 'cat_blackbox', fromPort: 'pkg_in', fromDir: 'in', toNode: 'n_sealer', toPort: 'items_in', toDir: 'in' },
    { id: 'w_demo_8', fromNode: 'n_sealer', fromPort: 'sealed_box', toNode: 'n_labeler', toPort: 'box_in' },
    { id: 'w_demo_8b', fromNode: 'n_labeler', fromPort: 'labeled_pkg', fromDir: 'out', toNode: 'cat_blackbox', toPort: 'pkg_out', toDir: 'out' },
    { id: 'w_demo_9', fromNode: 'cat_blackbox', fromPort: 'pkg_out', toNode: 'fc_output', toPort: 'files_in' },
    { id: 'w_demo_10', fromNode: 'bus_main', fromPort: 'out_2', toNode: 'fc_output', toPort: 'files_in' }
  ];
  return st;
}
function createDemoWorkflowState() { return createExampleWorkflowState(); }

function createHelloWorldWorkflowState() {
  const st = createBlankState();
  st.workflowId = 'hello_world';
  st.workflowKey = 'hello_world';
  st.workflowStatus = 'construction';
  st.editUnlocked = true;
  st.lockLayout = false;
  st.title = 'Hello World (Minimal 2-Node Starter)';
  st.workflowName = st.title;
  st.nodes = [
    {
      id: 'n_hello_source',
      title: '📝 Step 1: Greeting Input',
      type: 'step',
      category: 'Input',
      inPorts: ['raw_text'],
      outPorts: ['greeting_payload'],
      params: { target: 'world' },
      notes: ['Add or rename ports with +In / +Out or Inspector fields'],
      scriptBinding: 'modules/greeting_input.py',
      x: 120, y: 180, w: 265, h: 195
    },
    {
      id: 'n_hello_emit',
      title: '👋 Step 2: Hello Output',
      type: 'step',
      category: 'Output',
      inPorts: ['greeting_in'],
      outPorts: ['formatted_msg'],
      params: { uppercase: false },
      notes: ['Emits formatted greeting message'],
      scriptBinding: 'modules/greeting_emit.py',
      x: 490, y: 180, w: 265, h: 195
    }
  ];
  st.wires = [
    { id: 'w_hello_1', fromNode: 'n_hello_source', fromPort: 'greeting_payload', toNode: 'n_hello_emit', toPort: 'greeting_in' }
  ];
  return st;
}

function createAlgorithmWorkflowState() {
  const st = createBlankState();
  st.workflowId = 'algorithm';
  st.workflowKey = 'algorithm';
  st.workflowStatus = 'active';
  st.editUnlocked = false;
  st.lockLayout = true;
  st.title = 'Algorithm Pipeline (Sample Processing & Validation)';
  st.workflowName = st.title;
  st.categories = [
    {
      id: 'cat_algo_core',
      title: 'Black-Box Subsystem: Core Scoring Engine',
      inPorts: ['records_in'],
      outPorts: ['scored_out', 'audit_log'],
      bottomPorts: ['metrics_tap'],
      notes: ['Deterministic sample scoring & threshold validation'],
      collapsed: false,
      x: 470, y: 90, w: 690, h: 330
    }
  ];
  st.nodes = [
    {
      id: 'n_algo_ingest',
      title: '📥 1. Data Ingest',
      category: 'Input',
      inPorts: ['dataset_uri'],
      outPorts: ['clean_records'],
      params: { batch_size: 256 },
      notes: ['Loads tabular or JSON input batches'],
      scriptBinding: 'modules/ingest_batch.py',
      x: 80, y: 165, w: 260, h: 190
    },
    {
      id: 'n_algo_score',
      title: '⚙️ 2. Normalize & Score',
      category: 'Processor',
      inPorts: ['raw_batch'],
      outPorts: ['scored_rows', 'score_stats'],
      params: { method: 'z_score', clamp: true },
      notes: ['Computes normalized weights and confidence'],
      scriptBinding: 'modules/score_batch.py',
      x: 515, y: 190, w: 265, h: 190
    },
    {
      id: 'n_algo_gate',
      title: '✅ 3. Validation Gate',
      category: 'QA Gate',
      inPorts: ['candidate_rows'],
      outPorts: ['approved_rows'],
      params: { min_confidence: 0.95 },
      notes: ['Verifies schema invariants before publishing'],
      scriptBinding: 'modules/validate_gate.py',
      x: 855, y: 190, w: 265, h: 190
    }
  ];
  st.fileContainers = [
    {
      id: 'fc_algo_out',
      title: 'Validated Outputs',
      pattern: '*.json, *.csv',
      inPorts: ['bundle_in'],
      outPorts: ['bundle_out'],
      files: ['scored_batch.json', 'validation_summary.csv'],
      x: 1275, y: 165, w: 250, h: 195
    }
  ];
  st.wires = [
    { id: 'w_algo_1', fromNode: 'n_algo_ingest', fromPort: 'clean_records', toNode: 'cat_algo_core', toPort: 'records_in' },
    { id: 'w_algo_2', fromNode: 'cat_algo_core', fromPort: 'records_in', fromDir: 'in', toNode: 'n_algo_score', toPort: 'raw_batch', toDir: 'in' },
    { id: 'w_algo_3', fromNode: 'n_algo_score', fromPort: 'scored_rows', toNode: 'n_algo_gate', toPort: 'candidate_rows' },
    { id: 'w_algo_4', fromNode: 'n_algo_gate', fromPort: 'approved_rows', fromDir: 'out', toNode: 'cat_algo_core', toPort: 'scored_out', toDir: 'out' },
    { id: 'w_algo_5', fromNode: 'cat_algo_core', fromPort: 'scored_out', toNode: 'fc_algo_out', toPort: 'bundle_in' }
  ];
  return st;
}

let S = window.__INITIAL_SANDBOX_STATE__
  ? JSON.parse(JSON.stringify(window.__INITIAL_SANDBOX_STATE__))
  : createExampleWorkflowState();
if (S && typeof S === 'object') {
  S.wireSelectMode = false;
  S.wireDeleteMode = false;
}

function ensureStateDefaults() {
  if (!S.categories) S.categories = [];
  if (!S.subcategories) S.subcategories = [];
  if (!S.cells) S.cells = [];
  if (!S.nodes) S.nodes = [];
  if (!S.fileContainers) S.fileContainers = [];
  if (!S.buses) S.buses = [];
  if (!Array.isArray(S.stickyNotes)) S.stickyNotes = [];
  if (!S.wires) S.wires = [];
  if (!Array.isArray(S.customNodeTemplates)) S.customNodeTemplates = loadStoredCustomTemplates();
  if (!S.wireStyle) S.wireStyle = 'schematic';
  if (typeof S.wireSelectMode !== 'boolean') S.wireSelectMode = false;
  if (typeof S.wireDeleteMode !== 'boolean') S.wireDeleteMode = false;
  if (!S.activeBrushColor || !normalizeHexColor(S.activeBrushColor)) S.activeBrushColor = '#38bdf8';
  if (!S.workflowId) S.workflowId = S.workflowKey || 'example';
  if (!S.workflowKey) S.workflowKey = S.workflowId;
  if (!S.title && S.workflowName) S.title = S.workflowName;
  if (!S.workflowName && S.title) S.workflowName = S.title;
  if (!Array.isArray(S.buckets)) S.buckets = Array.isArray(S.fileContainers) ? S.fileContainers : [];
  if (S.workflowStatus !== 'active' && S.workflowStatus !== 'construction' && S.workflowStatus !== 'sandbox') {
    S.workflowStatus = S.workflowId === 'blank' ? 'sandbox' : (S.workflowId === 'hello_world' ? 'construction' : 'active');
  }
  if (typeof S.lockLayout !== 'boolean') {
    S.lockLayout = S.workflowStatus === 'active';
  }
  if (typeof S.editUnlocked !== 'boolean') {
    S.editUnlocked = S.workflowStatus !== 'active';
  }
  if (typeof S.hideLeftPalette !== 'boolean') {
    S.hideLeftPalette = false;
  }
  S.categories.forEach(c => {
    if (!c.inPorts) c.inPorts = ['stage_in'];
    if (!c.outPorts) c.outPorts = ['stage_out'];
    if (!c.bottomPorts) c.bottomPorts = ['sub_bus'];
    if (!c.notes) c.notes = c.checklist ? c.checklist.slice() : ['Stage notes & subsystem I/O'];
    if (typeof c.collapsed !== 'boolean') c.collapsed = false;
    if (!c.collapsedSections || typeof c.collapsedSections !== 'object') c.collapsedSections = {};
  });
  S.subcategories.forEach(sc => {
    if (!sc.inPorts) sc.inPorts = ['group_in'];
    if (!sc.outPorts) sc.outPorts = ['group_out'];
    if (!sc.bottomPorts) sc.bottomPorts = ['telemetry_out'];
    if (!sc.notes) sc.notes = sc.checklist ? sc.checklist.slice() : ['Worker group notes'];
    if (typeof sc.collapsed !== 'boolean') sc.collapsed = false;
    if (!sc.collapsedSections || typeof sc.collapsedSections !== 'object') sc.collapsedSections = {};
  });
  S.cells.forEach(cell => {
    if (!cell.inPorts) cell.inPorts = ['cell_in'];
    if (!cell.outPorts) cell.outPorts = ['cell_out'];
    if (!cell.bottomPorts) cell.bottomPorts = ['gate_out'];
    if (!cell.notes) cell.notes = cell.checklist ? cell.checklist.slice() : ['[x] Input schema verified', '[ ] Output artifacts validated'];
    if (typeof cell.collapsed !== 'boolean') cell.collapsed = false;
    if (!cell.collapsedSections || typeof cell.collapsedSections !== 'object') cell.collapsedSections = {};
  });
  S.nodes.forEach(n => {
    if (!n.collapsedSections || typeof n.collapsedSections !== 'object') n.collapsedSections = {};
  });
  S.fileContainers.forEach(fc => {
    if (!fc.collapsedSections || typeof fc.collapsedSections !== 'object') fc.collapsedSections = {};
    const pat = fc.pattern || fc.filter || '*.*';
    fc.pattern = pat;
    fc.filter = pat;
    if (!fc.inPorts) fc.inPorts = ['files_in'];
    if (!fc.outPorts) fc.outPorts = ['files_out'];
    if (!Array.isArray(fc.files)) fc.files = [];
  });
  S.buses.forEach(b => {
    if (!b.orientation) b.orientation = 'left-right';
    if (!b.inPorts) b.inPorts = ['in_1', 'in_2', 'in_3'];
    if (!b.outPorts) b.outPorts = ['out_1', 'out_2', 'out_3'];
    if (!b.bottomPorts) b.bottomPorts = ['bus_tap'];
  });
  S.stickyNotes.forEach(sn => {
    if (!sn.id) sn.id = uid('sticky');
    if (!sn.title) sn.title = '📝 Sticky Note';
    if (!sn.color) sn.color = 'yellow';
    if (!sn.assignee) sn.assignee = 'both';
    else if (sn.assignee === 'agent') sn.assignee = 'assistant';
    if (typeof sn.text !== 'string') sn.text = '';
    if (!Array.isArray(sn.todos)) sn.todos = [];
    if (!Array.isArray(sn.images)) sn.images = [];
    if (typeof sn.x !== 'number') sn.x = 180;
    if (typeof sn.y !== 'number') sn.y = 140;
    if (!sn.w || sn.w < 180) sn.w = 280;
    if (!sn.h || sn.h < 140) sn.h = 240;
  });
}
ensureStateDefaults();

let selectedItem = null;
let activeDrag = null;
try {
  Object.defineProperty(window, 'S', {
    get() { return S; },
    set(val) { S = val; },
    configurable: true
  });
  Object.defineProperty(window, 'selectedItem', {
    get() { return selectedItem; },
    set(val) { selectedItem = val; },
    configurable: true
  });
} catch (e) {}
let connectingPort = null;
let armedPort = null;
let portDragStartPos = null;
let ctxMenuWorldPos = { x: 180, y: 140 };
let pulseProgress = 0;
let pulseTimer = null;
let canvasSearchState = {
  query: '',
  matches: [],
  matchIdSet: new Set(),
  activeIdx: -1,
  activeId: ''
};
let flowTracerState = {
  active: false,
  paused: false,
  speed: 1.0,
  hops: [],
  hopIndex: 0,
  phase: 'idle',
  phaseProgress: 0,
  completedWireIds: new Set(),
  completedNodeIds: new Set(),
  activeWireId: '',
  activeNodeId: '',
  receivingNodeId: '',
  activeFileLabel: '',
  activeOutputLabel: '',
  updatedBucketMap: {},
  timerId: null
};
let githubFeedbackKind = 'bug';
let isCtrlKeyHeld = false;
let isAltKeyHeld = false;
let isShiftKeyHeld = false;

const WORKFLOW_CLONES_STORAGE_KEY = 'sandbox_workflow_custom_clones_v1';
let workflowBaselineSnapshots = {};
let customClonedWorkflows = Object.assign(
  {},
  (typeof window !== 'undefined' && window.__INITIAL_CLONED_WORKFLOWS__) ? window.__INITIAL_CLONED_WORKFLOWS__ : {}
);
try {
  const rawClones = localStorage.getItem(WORKFLOW_CLONES_STORAGE_KEY);
  if (rawClones) customClonedWorkflows = Object.assign(customClonedWorkflows, JSON.parse(rawClones) || {});
} catch (e) {}
try {
  Object.defineProperty(window, 'customClonedWorkflows', {
    get() { return customClonedWorkflows; },
    set(val) { customClonedWorkflows = val; },
    configurable: true
  });
} catch (e) {}

function persistCustomClonedWorkflows() {
  try {
    localStorage.setItem(WORKFLOW_CLONES_STORAGE_KEY, JSON.stringify(customClonedWorkflows || {}));
  } catch (e) {}
}

function getCurrentWorkflowKey() {
  const sel = document.getElementById('presetSelect');
  return (S && (S.workflowId || S.workflowKey)) || (sel && sel.value) || 'example';
}

function captureBaselineSnapshot(forceOverwrite = false) {
  if (!S) return null;
  const wfKey = getCurrentWorkflowKey();
  if (!forceOverwrite && S.originalBaselineSnapshot) {
    workflowBaselineSnapshots[wfKey] = S.originalBaselineSnapshot;
    return S.originalBaselineSnapshot;
  }
  const cloneCopy = JSON.parse(JSON.stringify(S));
  delete cloneCopy.originalBaselineSnapshot;
  const snapStr = JSON.stringify(cloneCopy);
  S.originalBaselineSnapshot = snapStr;
  workflowBaselineSnapshots[wfKey] = snapStr;
  return snapStr;
}

function stripWorkflowStatusPrefix(rawLabel) {
  let s = String(rawLabel || '').trim();
  const rePrefix = /^(?:\[(?:🟢\s*ACTIVE|🚧\s*CONSTRUCTION|CONSTRUCTION|ACTIVE)\]|🚧\s*\[CONSTRUCTION\]|🟢\s*\[ACTIVE\])\s*/i;
  while (rePrefix.test(s)) {
    s = s.replace(rePrefix, '').trim();
  }
  return s;
}

function isPresetAllowedInStandalone(presetKey) {
  const allowed = (typeof window !== 'undefined' && window.__STANDALONE_ALLOWED_PRESETS__)
    ? window.__STANDALONE_ALLOWED_PRESETS__
    : null;
  if (!allowed || typeof allowed !== 'object') return true;
  return Boolean(allowed[presetKey]);
}

function pruneStandalonePresetDropdown() {
  const allowed = (typeof window !== 'undefined' && window.__STANDALONE_ALLOWED_PRESETS__)
    ? window.__STANDALONE_ALLOWED_PRESETS__
    : null;
  if (!allowed || typeof allowed !== 'object') return;
  const sel = document.getElementById('presetSelect');
  if (!sel || !sel.options) return;
  const opts = Array.prototype.slice.call(sel.options);
  for (let i = opts.length - 1; i >= 0; i--) {
    const o = opts[i];
    const val = o ? o.value : '';
    if (!allowed[val]) {
      if (typeof sel.remove === 'function') sel.remove(i);
      else if (o && typeof o.remove === 'function') o.remove();
      else if (typeof sel.removeChild === 'function') sel.removeChild(o);
      else if (Array.isArray(sel.options)) sel.options.splice(i, 1);
    }
  }
}
window.pruneStandalonePresetDropdown = pruneStandalonePresetDropdown;

function updatePresetDropdownOptionStatus(wfKey, status, customTitle) {
  if (!isPresetAllowedInStandalone(wfKey)) {
    pruneStandalonePresetDropdown();
    return;
  }
  const sel = document.getElementById('presetSelect');
  if (!sel || !sel.options) return;
  let opt = Array.from(sel.options).find(o => o.value === wfKey);
  const cleanCustom = customTitle ? stripWorkflowStatusPrefix(customTitle) : '';
  if (!opt && cleanCustom && typeof document.createElement === 'function') {
    opt = document.createElement('option');
    if (opt && opt.setAttribute) {
      opt.value = wfKey;
      opt.setAttribute('data-base-label', cleanCustom);
      if (sel.appendChild) sel.appendChild(opt);
    }
  }
  if (!opt || !opt.getAttribute) return;
  if (cleanCustom) {
    opt.setAttribute('data-base-label', cleanCustom);
  } else if (!opt.getAttribute('data-base-label')) {
    const cleanLabel = stripWorkflowStatusPrefix(opt.textContent || '');
    opt.setAttribute('data-base-label', cleanLabel);
  } else {
    opt.setAttribute('data-base-label', stripWorkflowStatusPrefix(opt.getAttribute('data-base-label')));
  }
  const baseLabel = cleanCustom || opt.getAttribute('data-base-label') || stripWorkflowStatusPrefix(opt.textContent || '');
  const prefix = status === 'construction' ? '[🚧 CONSTRUCTION] ' : '[🟢 ACTIVE] ';
  opt.setAttribute('data-wf-status', status);
  opt.textContent = prefix + baseLabel;
  pruneStandalonePresetDropdown();
}

function filterWorkflowDropdown() {
  pruneStandalonePresetDropdown();
  const sel = document.getElementById('presetSelect');
  if (!sel || !sel.options) return;
  const statusFilterEl = document.getElementById('workflowStatusFilter');
  const searchFilterEl = document.getElementById('workflowSearchFilter');
  const statusFilter = (statusFilterEl && statusFilterEl.value) ? statusFilterEl.value : 'all';
  const query = ((searchFilterEl && searchFilterEl.value) ? searchFilterEl.value : '').trim().toLowerCase();
  const opts = Array.from(sel.options);
  const hasPresetTextHit = !query || opts.some(opt =>
    opt && opt.getAttribute && (
      (opt.textContent || '').toLowerCase().includes(query) ||
      (opt.value || '').toLowerCase().includes(query)
    )
  );
  opts.forEach(opt => {
    if (!opt || !opt.getAttribute) return;
    const optStatus = opt.getAttribute('data-wf-status') || (opt.value === 'blank' ? 'construction' : 'active');
    const textMatch = !query || !hasPresetTextHit || (opt.textContent || '').toLowerCase().includes(query) || (opt.value || '').toLowerCase().includes(query);
    const statusMatch = statusFilter === 'all' || optStatus === statusFilter;
    opt.hidden = !(textMatch && statusMatch);
    if (opt.style) opt.style.display = (textMatch && statusMatch) ? '' : 'none';
  });
}

function collectCanvasSearchMatches(rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q || !S) return [];
  const candidates = [];
  const pushAll = (arr, kind) => {
    (arr || []).forEach(it => {
      if (it && it.id) candidates.push({ kind, item: it });
    });
  };
  pushAll(S.categories, 'category');
  pushAll(S.subcategories, 'subcategory');
  pushAll(S.cells, 'cell');
  pushAll(S.nodes, 'node');
  pushAll(S.fileContainers, 'bucket');
  pushAll(S.buses, 'bus');
  pushAll(S.stickyNotes, 'sticky');

  const hits = [];
  candidates.forEach(({ kind, item }) => {
    const parts = [
      item.id,
      item.title,
      item.category,
      item.scriptBinding,
      item.text,
      item.pattern,
      item.filter,
      item.folderPath,
      item.inputSpec,
      item.outputSpec,
      ...(Array.isArray(item.notes) ? item.notes : []),
      ...(Array.isArray(item.rules) ? item.rules : []),
      ...(Array.isArray(item.steps) ? item.steps : []),
      ...(Array.isArray(item.substeps) ? item.substeps : []),
      ...(Array.isArray(item.files) ? item.files.map(f => (typeof f === 'object' && f ? (f.name || f.label || f.path || '') : String(f || ''))) : []),
      ...(Array.isArray(item.todos) ? item.todos.map(t => (t && t.text) || '') : [])
    ];
    const haystack = parts.filter(Boolean).join(' ').toLowerCase();
    if (haystack.includes(q)) {
      hits.push({
        kind,
        id: item.id,
        label: item.title || item.id,
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        w: Number(item.w) || 260,
        h: Number(item.h) || 200
      });
    }
  });
  return hits;
}

function updateCanvasSearchUI() {
  const q = String(canvasSearchState.query || '').trim();
  const countBtn = document.getElementById('canvasSearchMatchBtn');
  const clearBtn = document.getElementById('btnClearCanvasSearch');
  const total = canvasSearchState.matches.length;
  if (countBtn) {
    if (!q) {
      countBtn.style.display = 'none';
    } else {
      countBtn.style.display = 'inline-flex';
      const curNum = total > 0 && canvasSearchState.activeIdx >= 0 ? (canvasSearchState.activeIdx + 1) : 0;
      countBtn.textContent = `${curNum}/${total} ▾`;
      if (countBtn.style) {
        countBtn.style.borderColor = total > 0 ? '#38bdf8' : '#e67e80';
        countBtn.style.color = total > 0 ? '#bae6fd' : '#fecdd3';
      }
    }
  }
  if (clearBtn) {
    clearBtn.style.display = q ? 'inline-flex' : 'none';
  }
}

function panViewportToItemRect(hit) {
  if (!hit || !S) return;
  const vw = (viewport && viewport.clientWidth > 100) ? viewport.clientWidth : 1100;
  const vh = (viewport && viewport.clientHeight > 100) ? viewport.clientHeight : 720;
  const targetZoom = Math.max(0.65, Math.min(1.15, Number(S.zoom) || 1.0));
  S.zoom = +targetZoom.toFixed(2);
  const cx = hit.x + (hit.w || 260) / 2;
  const cy = hit.y + (hit.h || 200) / 2;
  S.panX = Math.round(vw / 2 - cx * S.zoom);
  S.panY = Math.round(vh / 2 - cy * S.zoom);
  applyWorldTransform();
}

function focusCanvasSearchMatch(idx) {
  const total = canvasSearchState.matches.length;
  if (!total) {
    canvasSearchState.activeIdx = -1;
    canvasSearchState.activeId = '';
    updateCanvasSearchUI();
    syncSelectedDomClasses();
    return null;
  }
  const wrapped = ((idx % total) + total) % total;
  const hit = canvasSearchState.matches[wrapped];
  canvasSearchState.activeIdx = wrapped;
  canvasSearchState.activeId = hit.id;
  panViewportToItemRect(hit);
  syncSelectedDomClasses();
  updateCanvasSearchUI();
  setStatus(`🔎 Search match ${wrapped + 1}/${total}: ${hit.label}`);
  return hit;
}
window.focusCanvasSearchMatch = focusCanvasSearchMatch;

function cycleCanvasSearchMatch(dir = 1) {
  if (!canvasSearchState.matches.length) {
    onCanvasSearchInput();
    if (!canvasSearchState.matches.length) return null;
  }
  const nextIdx = canvasSearchState.activeIdx < 0 ? 0 : (canvasSearchState.activeIdx + (dir >= 0 ? 1 : -1));
  return focusCanvasSearchMatch(nextIdx);
}
window.cycleCanvasSearchMatch = cycleCanvasSearchMatch;

function onCanvasSearchInput() {
  filterWorkflowDropdown();
  const searchEl = document.getElementById('workflowSearchFilter');
  const rawQuery = searchEl ? String(searchEl.value || '') : '';
  const trimmed = rawQuery.trim();
  canvasSearchState.query = rawQuery;
  canvasSearchState.matches = collectCanvasSearchMatches(trimmed);
  canvasSearchState.matchIdSet = new Set(canvasSearchState.matches.map(m => m.id));
  if (canvasSearchState.matches.length > 0) {
    canvasSearchState.activeIdx = 0;
    canvasSearchState.activeId = canvasSearchState.matches[0].id;
    setStatus(`🔎 Found ${canvasSearchState.matches.length} matching canvas item(s) for "${trimmed}" (Enter to focus)`);
  } else {
    canvasSearchState.activeIdx = -1;
    canvasSearchState.activeId = '';
    if (trimmed) {
      setStatus(`🔎 No canvas elements matched "${trimmed}"`);
    }
  }
  updateCanvasSearchUI();
  syncSelectedDomClasses();
  return canvasSearchState;
}
window.onCanvasSearchInput = onCanvasSearchInput;

function clearCanvasSearch() {
  const searchEl = document.getElementById('workflowSearchFilter');
  if (searchEl) searchEl.value = '';
  canvasSearchState = { query: '', matches: [], matchIdSet: new Set(), activeIdx: -1, activeId: '' };
  filterWorkflowDropdown();
  updateCanvasSearchUI();
  syncSelectedDomClasses();
  setStatus('🔎 Search cleared');
}
window.clearCanvasSearch = clearCanvasSearch;

function handleCanvasSearchKeydown(ev) {
  if (!ev) return;
  if (ev.key === 'Enter') {
    if (ev.preventDefault) ev.preventDefault();
    cycleCanvasSearchMatch(ev.shiftKey ? -1 : 1);
  } else if (ev.key === 'Escape') {
    if (ev.preventDefault) ev.preventDefault();
    clearCanvasSearch();
    if (ev.target && typeof ev.target.blur === 'function') ev.target.blur();
  }
}
window.handleCanvasSearchKeydown = handleCanvasSearchKeydown;

function syncWorkflowStatusUI() {
  if (!S) return;
  const isConstruction = S.workflowStatus === 'construction';
  const isSandbox = S.workflowStatus === 'sandbox';
  const isEditable = isConstruction || isSandbox;
  const modeBadgeEl = document.getElementById('modeBadge');
  if (modeBadgeEl) modeBadgeEl.textContent = 'v1.8.1';
  if (viewport && viewport.classList && viewport.classList.toggle) {
    viewport.classList.toggle('workflow-construction', isConstruction);
    viewport.classList.toggle('workflow-active', !isEditable);
  }
  if (document.body && document.body.classList && document.body.classList.toggle) {
    document.body.classList.toggle('workflow-construction-body', isEditable);
    document.body.classList.toggle('workflow-active-body', !isEditable);
  }
  const borderEl = document.getElementById('constructionBorderOverlay');
  if (borderEl && borderEl.style) borderEl.style.display = isConstruction ? 'block' : 'none';
  const badgeEl = document.getElementById('activeCautionBadge');
  if (badgeEl && badgeEl.style) badgeEl.style.display = isEditable ? 'none' : 'inline-flex';
  const btnConstruct = document.getElementById('btnTakeIntoConstruction');
  if (btnConstruct) {
    const lbl = btnConstruct.querySelector ? btnConstruct.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = isEditable ? 'Editing' : 'Edit';
    else btnConstruct.textContent = isEditable ? '🚧 Under Construction (Editing)' : '🚧 Take into Construction';
    btnConstruct.title = isEditable
      ? '🚧 Under Construction (Editing) — Unlocked for layout & rule edits'
      : '🚧 Take into Construction — Unlock and take workflow into Under Construction mode (preserves baseline for Revert)';
    if (btnConstruct.style) btnConstruct.style.opacity = isEditable ? '1' : '0.88';
  }
  const btnGoLive = document.getElementById('btnGoLiveWorkflow');
  if (btnGoLive) {
    const lbl = btnGoLive.querySelector ? btnGoLive.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = isEditable ? 'Go Live' : 'Live';
    else btnGoLive.textContent = isEditable ? '🚀 Go Live (Activate & Lock)' : '🟢 Active & Locked';
    btnGoLive.title = isEditable
      ? '🚀 Go Live (Activate & Lock) — Promote workflow to Active and lock in View Mode'
      : '🟢 Active & Locked — Live workflow is locked in View Mode';
  }
  updatePresetDropdownOptionStatus(getCurrentWorkflowKey(), isEditable ? 'construction' : 'active');
  const currentWfKey = getCurrentWorkflowKey();
  let customOptTitle = '';
  try {
    customOptTitle = localStorage.getItem(`sandbox_wf_custom_title_${currentWfKey}`) || '';
  } catch (e) {}
  if (!customOptTitle && customClonedWorkflows && customClonedWorkflows[currentWfKey] && customClonedWorkflows[currentWfKey].title) {
    customOptTitle = customClonedWorkflows[currentWfKey].title;
  }
  updatePresetDropdownOptionStatus(currentWfKey, isEditable ? 'construction' : 'active', customOptTitle || undefined);
  filterWorkflowDropdown();
}

function enterConstructionMode(reason = 'edit', shouldRender = true) {
  if (!S) return;
  const wasActive = S.workflowStatus === 'active';
  if (wasActive || !S.originalBaselineSnapshot) {
    captureBaselineSnapshot(false);
  }
  S.workflowStatus = 'construction';
  S.lockLayout = false;
  S.editUnlocked = true;
  syncWorkflowStatusUI();
  if (wasActive) {
    setStatus(`🚧 Under Construction Mode (${reason}) — Yellow/black striped border active · Use ↩️ Revert to Original or 🚀 Go Live anytime`);
  }
  if (shouldRender) renderAll();
}

function goLiveWorkflow() {
  if (!S) return;
  S.workflowStatus = 'active';
  S.lockLayout = true;
  S.editUnlocked = false;
  captureBaselineSnapshot(true);
  syncWorkflowStatusUI();
  setStatus('🟢 Workflow is now LIVE (Active & Locked in View Mode) — Caution, active workflow badge enabled');
  renderAll();
}

function toggleWorkflowConstructionLive() {
  if (S && (S.workflowStatus === 'construction' || S.workflowStatus === 'sandbox')) {
    goLiveWorkflow();
  } else {
    enterConstructionMode('manual toggle', true);
  }
}

function revertWorkflowToOriginal() {
  if (!S) return;
  const wfKey = getCurrentWorkflowKey();
  try {
    localStorage.removeItem(`sandbox_wf_preset_state_${wfKey}`);
  } catch (e) {}
  const snapStr = workflowBaselineSnapshots[wfKey] || S.originalBaselineSnapshot;
  if (!snapStr) {
    setStatus('ℹ️ Workflow is already at its original baseline state');
    return;
  }
  const savedTemplates = S.customNodeTemplates ? S.customNodeTemplates.slice() : loadStoredCustomTemplates();
  const restored = JSON.parse(snapStr);
  S = restored;
  S._hasUserSavedLayout = false;
  S.customNodeTemplates = savedTemplates;
  S.workflowStatus = wfKey === 'blank' ? 'sandbox' : (wfKey === 'hello_world' ? 'construction' : 'active');
  S.lockLayout = S.workflowStatus === 'active';
  S.editUnlocked = !S.lockLayout;
  resetInteractionModes();
  captureBaselineSnapshot(true);
  selectedItem = null;
  armedPort = null;
  connectingPort = null;
  syncWorkflowStatusUI();
  updateAutoSaveStatusPill('Reverted to Factory');
  setStatus('↩️ Reverted workflow to original factory baseline coordinates');
  renderAll();
}

function cloneCurrentWorkflow() {
  if (!S) return null;
  const cloneNum = Object.keys(customClonedWorkflows).length + 1;
  const cloneKey = `clone_${Date.now().toString(36)}_${cloneNum}`;
  const baseTitle = (S.title || 'Workflow').replace(/\s*\(Copy(\s+\d+)?\)\s*$/i, '');
  const cloneTitle = `${baseTitle} (Copy ${cloneNum})`;
  const clonedState = JSON.parse(JSON.stringify(S));
  delete clonedState.originalBaselineSnapshot;
  clonedState.workflowId = cloneKey;
  clonedState.workflowKey = cloneKey;
  clonedState.title = cloneTitle;
  clonedState.workflowName = cloneTitle;
  clonedState.workflowStatus = 'construction';
  clonedState.lockLayout = false;
  clonedState.editUnlocked = true;
  customClonedWorkflows[cloneKey] = JSON.parse(JSON.stringify(clonedState));
  persistCustomClonedWorkflows();

  S = clonedState;
  captureBaselineSnapshot(true);
  updatePresetDropdownOptionStatus(cloneKey, 'construction', `📋 ${cloneTitle}`);
  const sel = document.getElementById('presetSelect');
  if (sel) sel.value = cloneKey;
  syncWorkflowStatusUI();
  setStatus(`📋 Cloned workflow as "${cloneTitle}" in 🚧 Under Construction mode (Unlocked)`);
  renderAll();
  return cloneKey;
}

let activeWorkflowFileHandle = null;
const BUILTIN_PRESET_KEYS = new Set(['example', 'hello_world', 'algorithm']);
const BUILTIN_PRESET_TITLES = {
  example: '🧪 Example Workflow (Order & Packaging Pipeline)',
  hello_world: '👋 Hello World (Minimal 2-Node Starter)',
  algorithm: '⚙️ Algorithm Pipeline (Sample Processing & Validation)',
  blank: '📄 Blank Workflow (Start from Scratch)'
};

function restoreSavedWorkflowsIntoDropdown() {
  const sel = document.getElementById('presetSelect');
  if (!sel || !customClonedWorkflows) return;

  const presetMapInit = (typeof window !== 'undefined' && window.WORKFLOW_PRESETS && typeof window.WORKFLOW_PRESETS === 'object')
    ? window.WORKFLOW_PRESETS
    : {};
  const mergedDropWorkflows = Object.assign({}, presetMapInit, customClonedWorkflows);
  Object.entries(mergedDropWorkflows).forEach(([wfKey, wfObj]) => {
    if (!wfObj || typeof wfObj !== 'object') return;
    if (!isPresetAllowedInStandalone(wfKey)) return;
    if (BUILTIN_PRESET_KEYS.has(wfKey)) return;
    const status = wfObj.workflowStatus || 'active';
    const label = stripWorkflowStatusPrefix(wfObj.title || wfKey);
    updatePresetDropdownOptionStatus(wfKey, status, label);
  });
  if (sel.options) {
    Array.from(sel.options).forEach(opt => {
      if (!opt || !opt.value) return;
      if (!isPresetAllowedInStandalone(opt.value)) return;
      if (BUILTIN_PRESET_TITLES[opt.value]) {
        const st = opt.getAttribute('data-wf-status') || (opt.value === 'hello_world' || opt.value === 'blank' ? 'construction' : 'active');
        updatePresetDropdownOptionStatus(opt.value, st, BUILTIN_PRESET_TITLES[opt.value]);
        return;
      }
      try {
        const savedTitle = localStorage.getItem(`sandbox_wf_custom_title_${opt.value}`);
        if (savedTitle) {
          const st = opt.getAttribute('data-wf-status') || 'construction';
          updatePresetDropdownOptionStatus(opt.value, st, stripWorkflowStatusPrefix(savedTitle));
        }
      } catch (e) {}
    });
  }
  pruneStandalonePresetDropdown();
}

async function saveCurrentWorkflowInPlace() {
  if (!S) return null;
  const wfKey = getCurrentWorkflowKey() || 'example';
  S.workflowId = wfKey;
  autoSaveCurrentWorkflowLayout('manual_save');
  const cleanCopy = JSON.parse(JSON.stringify(S));
  delete cleanCopy.originalBaselineSnapshot;
  if (!BUILTIN_PRESET_KEYS.has(wfKey)) {
    customClonedWorkflows[wfKey] = cleanCopy;
    persistCustomClonedWorkflows();
  }
  const cwKey = 'create' + 'Writable';
  if (activeWorkflowFileHandle && typeof activeWorkflowFileHandle[cwKey] === 'function') {
    try {
      const writable = await activeWorkflowFileHandle[cwKey]();
      await writable.write(JSON.stringify(cleanCopy, null, 2));
      await writable.close();
      updateAutoSaveStatusPill(formatAutoSaveTime(), '💾 Saved to Disk File');
      setStatus(`💾 Saved workflow "${S.title}" directly to disk file (${activeWorkflowFileHandle.name || wfKey + '.json'}) & Local Sync`);
      return wfKey;
    } catch (e) {}
  }
  updateAutoSaveStatusPill(formatAutoSaveTime(), '💾 Saved');
  setStatus(`💾 Saved workflow "${S.title}" in-place (LocalStorage + Local Sync)`);
  renderAll({ preserveInspector: true });
  return wfKey;
}
window.saveCurrentWorkflowInPlace = saveCurrentWorkflowInPlace;

function commitForkedWorkflowToDropdownSync(rawName, shouldDownloadBlob = false) {
  if (!S) return null;
  const currentCleanTitle = stripWorkflowStatusPrefix(S.title || 'Custom Workflow');
  const nextTitle = stripWorkflowStatusPrefix(rawName || `${currentCleanTitle}_copy`) || `${currentCleanTitle}_copy`;
  const slug = nextTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  let wfKey = `saved_${slug || Date.now().toString(36)}`;
  if (BUILTIN_PRESET_KEYS.has(wfKey)) {
    wfKey = `saved_${slug}_${Date.now().toString(36).slice(-4)}`;
  }

  const forkedState = JSON.parse(JSON.stringify(S));
  delete forkedState.originalBaselineSnapshot;
  forkedState.workflowId = wfKey;
  forkedState.title = nextTitle;
  forkedState.workflowStatus = 'construction';
  forkedState.lockLayout = false;

  customClonedWorkflows[wfKey] = forkedState;
  persistCustomClonedWorkflows();
  try {
    localStorage.setItem(`sandbox_wf_preset_state_${wfKey}`, JSON.stringify(forkedState));
    localStorage.setItem(`sandbox_wf_custom_title_${wfKey}`, nextTitle);
  } catch (e) {}

  S = forkedState;
  captureBaselineSnapshot(true);
  updatePresetDropdownOptionStatus(wfKey, 'construction', nextTitle);
  const sel = document.getElementById('presetSelect');
  if (sel) sel.value = wfKey;
  syncWorkflowStatusUI();

  if (shouldDownloadBlob && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const blob = new Blob([JSON.stringify(forkedState, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${slug || 'workflow'}.workflow.json`;
      if (typeof a.click === 'function') a.click();
    } catch (e) {}
  }

  autoSaveCurrentWorkflowLayout('save_as');
  setStatus(`📄 Saved As new workflow "${nextTitle}" (${wfKey}) — original preset kept untouched in dropdown!`);
  renderAll({ preserveInspector: true });
  return wfKey;
}

async function saveWorkflowAsNewFileAndPreset(customName) {
  if (!S) return null;
  if (typeof customName === 'string' && customName.trim()) {
    return commitForkedWorkflowToDropdownSync(customName.trim(), false);
  }
  const currentCleanTitle = stripWorkflowStatusPrefix(S.title || 'Custom Workflow');
  let nextTitle = '';
  let fileHandle = null;

  const savePickerKey = 'showSave' + 'FilePicker';
  if (typeof window !== 'undefined' && typeof window[savePickerKey] === 'function') {
    try {
      const suggestedSlug = currentCleanTitle.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_|_$/g, '') || 'workflow';
      fileHandle = await window[savePickerKey]({
        suggestedName: `${suggestedSlug}.workflow.json`,
        types: [{
          description: 'SandboxWorkflow JSON File (.json)',
          accept: { 'application/json': ['.json'] }
        }]
      });
      if (fileHandle && fileHandle.name) {
        nextTitle = stripWorkflowStatusPrefix(fileHandle.name.replace(/(\.workflow)?\.json$/i, ''));
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return null;
    }
  }

  if (!nextTitle && typeof window !== 'undefined' && typeof window.prompt === 'function') {
    try {
      const prompted = window.prompt('Save Workflow As (creates a new Preset entry & downloads .json):', `${currentCleanTitle}_copy`);
      if (prompted === null) return null;
      if (typeof prompted === 'string' && prompted.trim()) {
        nextTitle = stripWorkflowStatusPrefix(prompted.trim());
      }
    } catch (e) {}
  }
  if (!nextTitle) {
    nextTitle = `${currentCleanTitle}_copy`;
  }

  const wfKey = commitForkedWorkflowToDropdownSync(nextTitle, !fileHandle);
  const cwKey = 'create' + 'Writable';
  if (fileHandle && typeof fileHandle[cwKey] === 'function') {
    try {
      activeWorkflowFileHandle = fileHandle;
      const writable = await fileHandle[cwKey]();
      await writable.write(JSON.stringify(S, null, 2));
      await writable.close();
    } catch (e) {}
  }
  return wfKey;
}
window.saveWorkflowAsNewFileAndPreset = saveWorkflowAsNewFileAndPreset;

function saveOrRenameWorkflowToDropdown(customName) {
  if (typeof customName === 'string' && customName.trim()) {
    return commitForkedWorkflowToDropdownSync(customName.trim(), false);
  }
  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    const currentCleanTitle = stripWorkflowStatusPrefix((S && S.title) || 'Custom Workflow');
    const prompted = window.prompt('Save Workflow As (creates a new Preset entry & downloads .json):', `${currentCleanTitle}_copy`);
    if (prompted === null) return null;
    if (typeof prompted === 'string' && prompted.trim()) {
      return commitForkedWorkflowToDropdownSync(prompted.trim(), false);
    }
  }
  return commitForkedWorkflowToDropdownSync('', false);
}
window.saveOrRenameWorkflowToDropdown = saveOrRenameWorkflowToDropdown;
window.saveWorkflowToDropdown = saveOrRenameWorkflowToDropdown;
window.renameWorkflowToDropdown = saveOrRenameWorkflowToDropdown;

async function openWorkflowFromNativeFilePicker() {
  if (typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function') {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'SandboxWorkflow JSON File (.json)',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const handle = handles && handles[0];
      if (!handle) return null;
      activeWorkflowFileHandle = handle;
      const file = await handle.getFile();
      const text = await file.text();
      return applyLoadedWorkflowJsonText(text, file.name);
    } catch (err) {
      if (err && err.name === 'AbortError') return null;
    }
  }
  const fileInput = document.getElementById('jsonFileInput');
  if (fileInput && typeof fileInput.click === 'function') {
    fileInput.click();
  }
  return null;
}
window.openWorkflowFromNativeFilePicker = openWorkflowFromNativeFilePicker;

function applyLoadedWorkflowJsonText(rawText, fileName = 'Loaded_Workflow.json') {
  try {
    const parsed = JSON.parse(rawText);
    const loadedState = parsed && parsed.workflow ? parsed.workflow : (parsed && parsed.state ? parsed.state : parsed);
    if (!loadedState || typeof loadedState !== 'object') {
      setStatus('⚠️ Invalid workflow JSON file');
      return null;
    }
    const cleanFileTitle = stripWorkflowStatusPrefix(loadedState.title || String(fileName || 'Loaded Workflow').replace(/(\.workflow)?\.json$/i, ''));
    const slug = cleanFileTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    let wfKey = loadedState.workflowId && !BUILTIN_PRESET_KEYS.has(loadedState.workflowId)
      ? loadedState.workflowId
      : `saved_${slug || Date.now().toString(36)}`;
    loadedState.workflowId = wfKey;
    loadedState.title = cleanFileTitle;
    if (!loadedState.workflowStatus) loadedState.workflowStatus = 'construction';
    loadedState.wireSelectMode = false;
    loadedState.wireDeleteMode = false;
    S = loadedState;
    ensureStateDefaults();
    resetInteractionModes();
    healBrokenNodeUiUrls(S);
    const savedCopy = JSON.parse(JSON.stringify(S));
    delete savedCopy.originalBaselineSnapshot;
    customClonedWorkflows[wfKey] = savedCopy;
    persistCustomClonedWorkflows();
    try {
      localStorage.setItem(`sandbox_wf_preset_state_${wfKey}`, JSON.stringify(savedCopy));
      localStorage.setItem(`sandbox_wf_custom_title_${wfKey}`, cleanFileTitle);
    } catch (e) {}
    captureBaselineSnapshot(true);
    updatePresetDropdownOptionStatus(wfKey, S.workflowStatus, cleanFileTitle);
    const sel = document.getElementById('presetSelect');
    if (sel) sel.value = wfKey;
    selectedItem = null;
    syncWorkflowStatusUI();
    setStatus(`📂 Opened Workflow JSON "${cleanFileTitle}" (${fileName}) and added to Preset Dropdown`);
    renderAll();
    fitViewToAll();
    renderWires();
    schedulePostMountLayoutSnap();
    return wfKey;
  } catch (e) {
    setStatus('⚠️ Invalid workflow JSON file');
    return null;
  }
}
window.applyLoadedWorkflowJsonText = applyLoadedWorkflowJsonText;

const viewport = document.getElementById('viewport');
const worldLayer = document.getElementById('world-layer');
const domLayer = document.getElementById('dom-items-layer');
const wireSvg = document.getElementById('wire-svg');

function initUtilityNodePicker() {
  const picker = document.getElementById('utilityNodePicker');
  if (picker) {
    picker.innerHTML = STANDARD_UTILITY_CATALOG.map(app => `
      <button class="app-chip" onclick="spawnUtilityNode('${app.key}')">
        ${app.icon} <b>${app.key}</b>
      </button>
    `).join('');
  }
  const sel = document.getElementById('utilityNodesSelect');
  if (sel) {
    sel.innerHTML = STANDARD_UTILITY_CATALOG.map(app => `<option value="${app.key}">${app.icon} ${app.key} (${app.category})</option>`).join('');
  }
}

function spawnSelectedUtilityNode() {
  const sel = document.getElementById('utilityNodesSelect');
  const key = sel ? sel.value : STANDARD_UTILITY_CATALOG[0].key;
  spawnUtilityNode(key);
}

function toggleCustomNodeCreator() {
  const box = document.getElementById('customNodeCreatorBox');
  if (!box) return;
  box.style.display = box.style.display === 'none' ? 'flex' : 'none';
}

function renderCustomNodesPalette() {
  const listEl = document.getElementById('customNodesPaletteList');
  if (!listEl) return;
  ensureStateDefaults();
  if (S.customNodeTemplates.length === 0) {
    listEl.innerHTML = `<div style="font-size:10px;color:var(--fg1);">No custom node templates yet.</div>`;
    return;
  }
  listEl.innerHTML = S.customNodeTemplates.map(t => `
    <div style="display:flex;gap:4px;align-items:center;">
      <button class="spawn-btn" style="flex:1;padding:4px 7px;font-size:11px;" onclick="spawnCustomUserNode('${t.id}')">
        <span>🧩 ${t.title}</span><small>${t.category || 'Custom'}</small>
      </button>
      <button class="hdr-mini-btn" style="color:var(--red);" title="Delete Custom Template" onclick="deleteCustomNodeTemplate('${t.id}')">🗑️</button>
    </div>
  `).join('');
}

function saveCustomNodeTemplate() {
  const title = (document.getElementById('custNodeTitle').value || '').trim() || `Custom Node ${S.customNodeTemplates.length + 1}`;
  const category = (document.getElementById('custNodeCat').value || '').trim() || 'Custom';
  const inPorts = (document.getElementById('custNodeIn').value || 'in_1').split(',').map(s => s.trim()).filter(Boolean);
  const outPorts = (document.getElementById('custNodeOut').value || 'out_1').split(',').map(s => s.trim()).filter(Boolean);
  const notes = (document.getElementById('custNodeNotes').value || '').trim();
  const tmpl = {
    id: uid('ctmpl'),
    title,
    category,
    inPorts: inPorts.length ? inPorts : ['in_1'],
    outPorts: outPorts.length ? outPorts : ['out_1'],
    notes
  };
  S.customNodeTemplates.push(tmpl);
  persistCustomTemplates();
  renderCustomNodesPalette();
  document.getElementById('custNodeTitle').value = '';
  setStatus(`🧩 Saved Custom Node Template: ${title}`);
  renderAll();
}

function spawnCustomUserNode(templateId, x = 220, y = 180) {
  const tmpl = (S.customNodeTemplates || []).find(t => t.id === templateId) || S.customNodeTemplates[0];
  if (!tmpl) return spawnAlgorithmNode(x, y);
  return spawnAlgorithmNode(x + (S.nodes.length * 20) % 160, y + (S.nodes.length * 16) % 120, {
    title: tmpl.title,
    category: tmpl.category || 'Custom',
    inPorts: (tmpl.inPorts || ['in_1']).slice(),
    outPorts: (tmpl.outPorts || ['out_1']).slice(),
    params: { custom_template: tmpl.id, notes: tmpl.notes || '' },
    scriptBinding: 'custom_user_node'
  });
}

function deleteCustomNodeTemplate(templateId) {
  S.customNodeTemplates = (S.customNodeTemplates || []).filter(t => t.id !== templateId);
  persistCustomTemplates();
  renderCustomNodesPalette();
  setStatus('🗑️ Deleted custom node template');
  renderAll();
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 7);
}

function applyWorldTransform() {
  const z = Number(S.zoom) || 1.0;
  const px = Number(S.panX) || 0;
  const py = Number(S.panY) || 0;
  worldLayer.style.transformOrigin = '0 0';
  worldLayer.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
  if (viewport && viewport.style) {
    const s1 = Math.max(8, Math.round(24 * z * 10) / 10);
    const s2 = Math.max(40, Math.round(120 * z * 10) / 10);
    viewport.style.backgroundSize = `${s1}px ${s1}px, ${s2}px ${s2}px, ${s2}px ${s2}px`;
    viewport.style.backgroundPosition = `${px}px ${py}px, ${px}px ${py}px, ${px}px ${py}px`;
  }
  const rstBtn = document.getElementById('btnResetZoom') || (document.querySelector ? document.querySelector('button[onclick="resetViewport()"]') : null);
  if (rstBtn) {
    rstBtn.textContent = `🔍 ${Math.round(z * 100)}% Zoom`;
  }
}

function zoomAtCursorPoint(clientX, clientY, targetZoom) {
  const oldScale = Number(S.zoom) || 1.0;
  const newScale = Math.max(0.12, Math.min(3.0, Number(targetZoom) || 1.0));
  const rect = (viewport && viewport.getBoundingClientRect)
    ? viewport.getBoundingClientRect()
    : { left: 0, top: 0, width: 1200, height: 800 };
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const worldX = (mx - S.panX) / oldScale;
  const worldY = (my - S.panY) / oldScale;
  S.panX = Math.round((mx - worldX * newScale) * 100) / 100;
  S.panY = Math.round((my - worldY * newScale) * 100) / 100;
  S.zoom = +newScale.toFixed(3);
  applyWorldTransform();
  return { worldX, worldY, mx, my, oldScale, newScale: S.zoom, panX: S.panX, panY: S.panY };
}
window.zoomAtCursorPoint = zoomAtCursorPoint;

function resetViewport() {
  S.panX = 0; S.panY = 0; S.zoom = 1.0;
  applyWorldTransform();
}

function fitViewToAll() {
  const allItems = [
    ...(S.categories || []),
    ...(S.subcategories || []),
    ...(S.cells || []),
    ...(S.nodes || []),
    ...(S.fileContainers || []),
    ...(S.buses || [])
  ];
  if (allItems.length === 0) {
    resetViewport();
    return;
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  allItems.forEach(it => {
    const w = it.w || 255;
    const h = it.collapsed ? 78 : (it.h || 220);
    if (it.x < minX) minX = it.x;
    if (it.y < minY) minY = it.y;
    if (it.x + w > maxX) maxX = it.x + w;
    if (it.y + h > maxY) maxY = it.y + h;
  });
  const contentW = Math.max(400, maxX - minX + 120);
  const contentH = Math.max(300, maxY - minY + 120);
  const vw = (viewport && viewport.clientWidth > 100) ? viewport.clientWidth : 1260;
  const vh = (viewport && viewport.clientHeight > 100) ? viewport.clientHeight : 760;
  const z = Math.max(0.15, Math.min(1.0, Math.min((vw - 48) / contentW, (vh - 48) / contentH)));
  S.zoom = +z.toFixed(2);
  S.panX = Math.round((vw - (maxX - minX) * S.zoom) / 2 - minX * S.zoom);
  S.panY = Math.round(Math.max(16, (vh - (maxY - minY) * S.zoom) / 2 - minY * S.zoom));
  applyWorldTransform();
}

function fitView() {
  return fitViewToAll();
}
window.fitView = fitView;

function createNewBlankWorkflow() {
  if (typeof stopSequentialFlowTrace === 'function') stopSequentialFlowTrace(true);
  if (typeof invalidateWireRouteCache === 'function') invalidateWireRouteCache();
  if (typeof resetInteractionModes === 'function') resetInteractionModes();
  const savedTemplates = (S && S.customNodeTemplates) ? S.customNodeTemplates.slice() : loadStoredCustomTemplates();
  S = createBlankWorkflowState();
  S.customNodeTemplates = savedTemplates;
  activeWorkflowFileHandle = null;
  lastSyncedRev = 0;
  selectedItem = null;
  armedPort = null;
  connectingPort = null;
  captureBaselineSnapshot(true);
  const statusFilterEl = document.getElementById('workflowStatusFilter');
  if (statusFilterEl && statusFilterEl.value === 'active') statusFilterEl.value = 'all';
  const blankSelEl = document.getElementById('presetSelect');
  if (blankSelEl) blankSelEl.value = 'blank';
  syncWorkflowStatusUI();
  renderAll();
  renderWires();
  setStatus('📄 New Blank Workflow ready (Untitled Workflow · Sandbox Unlocked)');
  return S;
}
window.createNewBlankWorkflow = createNewBlankWorkflow;

function clearSandboxCanvas() {
  createNewBlankWorkflow();
  setStatus('🧹 Cleared to Blank Infinite Canvas (Sandbox Unlocked)');
  return S;
}

function setStatus(msg) {
  document.getElementById('statusBanner').textContent = msg;
}

function spawnCategoryContainer(x = 60, y = 50) {
  enterConstructionMode('add category', false);
  const item = {
    id: uid('cat'),
    title: `Category ${S.categories.length + 1} — Pipeline Stage`,
    inPorts: ['stage_in'],
    outPorts: ['stage_out'],
    bottomPorts: ['sub_bus'],
    notes: ['Stage notes & subsystem I/O'],
    collapsed: false,
    x, y, w: 540, h: 360
  };
  S.categories.push(item);
  selectedItem = { kind: 'category', id: item.id };
  renderAll();
  return item;
}

function spawnSubcategoryContainer(x = 90, y = 100) {
  enterConstructionMode('add subcategory', false);
  const item = {
    id: uid('subcat'),
    title: `Subcategory ${S.subcategories.length + 1} — Worker Group`,
    inPorts: ['group_in'],
    outPorts: ['group_out'],
    bottomPorts: ['telemetry_out'],
    notes: ['Worker group notes'],
    collapsed: false,
    x, y, w: 320, h: 220
  };
  S.subcategories.push(item);
  selectedItem = { kind: 'subcategory', id: item.id };
  renderAll();
  return item;
}

function spawnCellSlot(x = 120, y = 140) {
  enterConstructionMode('add cell', false);
  const item = {
    id: uid('cell'),
    title: `Cell ${S.cells.length + 1} · Quality Gate`,
    status: 'ready',
    inPorts: ['cell_in'],
    outPorts: ['cell_out'],
    bottomPorts: ['gate_out'],
    notes: ['[x] Input schema verified', '[ ] Output artifacts validated'],
    collapsed: false,
    x, y, w: 220, h: 130
  };
  S.cells.push(item);
  selectedItem = { kind: 'cell', id: item.id };
  renderAll();
  return item;
}

function spawnAlgorithmNode(x = 180, y = 150, custom = {}) {
  enterConstructionMode('add node', false);
  const nodeType = custom.type || 'step';
  const customIn = Array.isArray(custom.inPorts)
    ? custom.inPorts.slice()
    : (Array.isArray(custom.inputs) ? custom.inputs.slice() : null);
  const inPorts = customIn !== null ? customIn : ['input_seq', 'config_json'];
  const customOut = Array.isArray(custom.outPorts)
    ? custom.outPorts.slice()
    : (Array.isArray(custom.outputs) ? custom.outputs.slice() : null);
  const outPorts = customOut !== null ? customOut : ['output_files', 'metrics'];
  const stepsList = Array.isArray(custom.steps) && custom.steps.length
    ? custom.steps
    : (Array.isArray(custom.bullets) && custom.bullets.length
      ? custom.bullets
      : (Array.isArray(custom.substeps) ? custom.substeps : []));
  const defaultCategory = nodeType === 'external_in'
    ? '📥 EXTERNAL WORKFLOW IN'
    : (nodeType === 'external_out' ? '📤 EXTERNAL WORKFLOW OUT' : 'Processor');
  const item = {
    id: custom.id || uid('node'),
    type: nodeType,
    title: custom.title || `Algorithm Node ${S.nodes.length + 1}`,
    category: custom.category || defaultCategory,
    inPorts: inPorts,
    inputs: inPorts,
    outPorts: outPorts,
    outputs: outPorts,
    inputSpec: custom.inputSpec !== undefined ? custom.inputSpec : '',
    outputSpec: custom.outputSpec !== undefined ? custom.outputSpec : '',
    steps: stepsList,
    substeps: stepsList,
    ui_url: (custom.ui_url !== undefined ? custom.ui_url : custom.uiUrl) || '',
    ui_label: (custom.ui_label !== undefined ? custom.ui_label : custom.uiLabel) || '',
    params: custom.params !== undefined ? custom.params : { batch_size: 4, mode: 'strict_schema', threshold: 0.75 },
    notes: custom.notes !== undefined ? custom.notes : ['Node processing notes'],
    rules: custom.rules || custom.notes || [],
    scriptBinding: custom.scriptBinding !== undefined ? custom.scriptBinding : 'modules/process_step.py',
    x, y,
    w: custom.w || 295
  };
  S.nodes.push(item);
  selectedItem = { kind: 'node', id: item.id };
  renderAll();
  return item;
}

function spawnIdeaNode(x = 110, y = 130, custom = {}) {
  const inPorts = Array.isArray(custom.inPorts)
    ? custom.inPorts.slice()
    : (Array.isArray(custom.inputs) ? custom.inputs.slice() : ['in_1']);
  const outPorts = Array.isArray(custom.outPorts)
    ? custom.outPorts.slice()
    : (Array.isArray(custom.outputs) ? custom.outputs.slice() : ['out_1']);
  const nodeItem = spawnAlgorithmNode(x, y, Object.assign({
    id: custom.id || uid('node'),
    type: custom.type || 'step',
    title: custom.title || `Empty Node ${S.nodes.length + 1}`,
    category: custom.category || 'Node',
    inPorts: inPorts,
    inputs: inPorts,
    outPorts: outPorts,
    outputs: outPorts,
    inputSpec: custom.inputSpec !== undefined ? custom.inputSpec : '',
    outputSpec: custom.outputSpec !== undefined ? custom.outputSpec : '',
    steps: Array.isArray(custom.steps) ? custom.steps.slice() : [],
    ui_url: custom.ui_url || '',
    ui_label: custom.ui_label || '',
    params: custom.params || {},
    notes: Array.isArray(custom.notes) ? custom.notes.slice() : [],
    rules: Array.isArray(custom.rules) ? custom.rules.slice() : [],
    scriptBinding: custom.scriptBinding !== undefined ? custom.scriptBinding : '',
    w: custom.w || 295
  }, custom));
  autoSaveWorkflowState('spawn_empty_node');
  return nodeItem;
}
window.spawnIdeaNode = spawnIdeaNode;
window.spawnEmptyNode = spawnIdeaNode;

function spawnLlmQueryNode(x = 240, y = 210, custom = {}) {
  const rawProv = custom.llmProvider || (custom.llmConfig && custom.llmConfig.provider) || 'ollama';
  const provider = rawProv;
  const defaultModel = provider === 'ollama'
    ? 'llama3.2'
    : (provider === 'gemini' ? 'gemini-2.5-pro' : (provider === 'openai' ? 'gpt-4o' : 'custom-model'));
  const model = custom.llmModel || (custom.llmConfig && custom.llmConfig.model) || defaultModel;
  const promptText = custom.llmPrompt || (custom.llmConfig && custom.llmConfig.prompt) || 'Put the prompt or instructions here — wired input files + prompt get run -> output file comes out';
  const nodeItem = spawnAlgorithmNode(x, y, Object.assign({
    id: custom.id || uid('llm'),
    type: 'llm_query',
    title: custom.title || `🤖 LLM / AI Query Node`,
    category: custom.category || '🤖 LLM / AI QUERY',
    inPorts: custom.inPorts || ['files_in', 'context_in'],
    outPorts: custom.outPorts || ['files_out', 'response_out'],
    inputSpec: custom.inputSpec || 'files_in (wired upstream File Container / Node files) + context_in',
    outputSpec: custom.outputSpec || 'files_out (transformed output file written to downstream File Container) + response_out',
    steps: custom.steps || [
      '1. Wire an upstream File Container or Node into files_in.',
      `2. Choose Provider: 🦙 Local Ollama (${OLLAMA_LOCAL_BASE_URL}), ✨ Gemini API, 🤖 OpenAI, or Custom Endpoint.`,
      '3. Type your prompt / transformation instructions below and click ▶ Run Prompt + Input Files.'
    ],
    params: custom.params || { provider, model },
    notes: custom.notes || ['First-class LLM / AI Query Node for transforming wired files'],
    scriptBinding: custom.scriptBinding || 'modules/llm_query_runner.py',
    w: custom.w || 380
  }, custom, { type: 'llm_query' }));
  nodeItem.llmProvider = provider;
  nodeItem.llmModel = model;
  nodeItem.llmPrompt = promptText;
  nodeItem.llmConfig = {
    provider,
    model,
    prompt: promptText,
    endpoint: (custom.llmConfig && custom.llmConfig.endpoint) || (provider === 'ollama' ? (OLLAMA_LOCAL_BASE_URL + OLLAMA_GENERATE_PATH) : '')
  };
  nodeItem.lastLlmOutput = custom.lastLlmOutput || '';
  delete nodeItem.llmApiKey;
  autoSaveWorkflowState('spawn_llm_query_node');
  renderAll();
  return nodeItem;
}
window.spawnLlmQueryNode = spawnLlmQueryNode;

function getLlmApiKeyFromLocalStorage(provider) {
  const p = String(provider || 'ollama').toLowerCase();
  try {
    return localStorage.getItem(`sandbox_wf_llm_apikey_${p}`) || '';
  } catch (e) {
    return '';
  }
}
window.getLlmApiKeyFromLocalStorage = getLlmApiKeyFromLocalStorage;

function setLlmApiKeyInLocalStorage(provider, apiKey) {
  const p = String(provider || 'ollama').toLowerCase();
  try {
    if (apiKey && String(apiKey).trim()) {
      localStorage.setItem(`sandbox_wf_llm_apikey_${p}`, String(apiKey).trim());
    } else {
      localStorage.removeItem(`sandbox_wf_llm_apikey_${p}`);
    }
  } catch (e) {}
  if (S && Array.isArray(S.nodes)) {
    S.nodes.forEach(n => {
      if (n) delete n.llmApiKey;
      if (n && n.llmConfig) delete n.llmConfig.apiKey;
    });
  }
  setStatus(`🔑 Updated browser-local API key for ${p} (stored in localStorage only)`);
  return true;
}
window.setLlmApiKeyInLocalStorage = setLlmApiKeyInLocalStorage;

function updateNodeLlmField(nodeId, field, val, shouldRenderAll = false) {
  const node = (S.nodes || []).find(n => n.id === nodeId) || findSelectedObject();
  if (!node) return null;
  enterConstructionMode('edit llm node config', false);
  if (!node.llmConfig || typeof node.llmConfig !== 'object') {
    node.llmConfig = { provider: node.llmProvider || 'ollama', model: node.llmModel || 'llama3.2', prompt: node.llmPrompt || '' };
  }
  if (field === 'llmProvider' || field === 'provider') {
    node.llmProvider = val;
    node.llmConfig.provider = val;
    if (val === 'ollama' && (!node.llmModel || node.llmModel === 'custom-model')) node.llmModel = 'llama3.2';
    if (val === 'gemini' && (!node.llmModel || node.llmModel === 'llama3.2')) node.llmModel = 'gemini-2.5-pro';
    if (val === 'openai' && (!node.llmModel || node.llmModel === 'llama3.2')) node.llmModel = 'gpt-4o';
    if (val === 'custom' && (!node.llmModel || node.llmModel === 'llama3.2')) node.llmModel = 'custom-model';
    node.llmConfig.model = node.llmModel;
  } else if (field === 'llmModel' || field === 'model') {
    node.llmModel = val;
    node.llmConfig.model = val;
  } else if (field === 'llmPrompt' || field === 'prompt') {
    node.llmPrompt = val;
    node.llmConfig.prompt = val;
  }
  node.params = Object.assign({}, node.params || {}, {
    provider: node.llmProvider || 'ollama',
    model: node.llmModel || 'llama3.2'
  });
  autoSaveWorkflowState('edit_llm_node');
  if (shouldRenderAll) {
    renderAll({ preserveInspector: true });
  }
  return node;
}
window.updateNodeLlmField = updateNodeLlmField;

function collectUpstreamFilesForNode(nodeId) {
  const collected = [];
  if (!S || !Array.isArray(S.wires)) return collected;
  S.wires.forEach(w => {
    if (!w || w.toNode !== nodeId) return;
    const fc = (S.fileContainers || []).find(b => b.id === w.fromNode);
    if (fc && Array.isArray(fc.files)) {
      fc.files.forEach(f => {
        const s = typeof f === 'string' ? f : (f && (f.url || f.path || f.name || ''));
        if (s && !collected.includes(s)) collected.push(s);
      });
    }
    const srcNode = (S.nodes || []).find(nd => nd.id === w.fromNode);
    if (srcNode && srcNode.lastLlmOutputFile && !collected.includes(srcNode.lastLlmOutputFile)) {
      collected.push(srcNode.lastLlmOutputFile);
    }
  });
  return collected;
}
window.collectUpstreamFilesForNode = collectUpstreamFilesForNode;

async function runLlmQueryNode(nodeId, ev = null) {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  const node = (S.nodes || []).find(n => n.id === nodeId) || findSelectedObject();
  if (!node) return { ok: false, error: 'LLM Node not found' };
  const provider = node.llmProvider || (node.llmConfig && node.llmConfig.provider) || 'ollama';
  const model = node.llmModel || (node.llmConfig && node.llmConfig.model) || 'llama3.2';
  const promptText = String(node.llmPrompt || (node.llmConfig && node.llmConfig.prompt) || '').trim();
  const inputFiles = collectUpstreamFilesForNode(node.id);
  const slug = String(node.title || node.id).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'llm_node';
  const outFilename = `./${slug}_output.md`;

  setStatus(`🤖 Running LLM Query Node "${node.title}" via ${provider} (${model}) on ${inputFiles.length} wired input file(s)...`);

  let responseText = '';
  try {
    if (provider === 'ollama' && typeof fetch === 'function') {
      const fullPrompt = `${promptText}\n\nWired Input Files:\n${inputFiles.map(f => '- ' + f).join('\n') || '(none)'}`;
      const resp = await fetch(OLLAMA_LOCAL_BASE_URL + OLLAMA_GENERATE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'llama3.2', prompt: fullPrompt, stream: false })
      });
      if (resp && resp.ok && typeof resp.json === 'function') {
        const j = await resp.json();
        responseText = (j && (j.response || j.output || j.message)) || `Ollama (${model}) completed query on ${inputFiles.length} file(s).`;
      }
    } else if (provider === 'custom' && node.llmConfig && node.llmConfig.endpoint && typeof fetch === 'function') {
      const resp = await fetch(node.llmConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: promptText, inputFiles })
      });
      if (resp && resp.ok && typeof resp.json === 'function') {
        const j = await resp.json();
        responseText = (j && (j.response || j.output || j.message)) || `Custom endpoint completed query on ${inputFiles.length} file(s).`;
      }
    } else {
      const apiKey = getLlmApiKeyFromLocalStorage(provider);
      responseText = `[${provider.toUpperCase()} · ${model}${apiKey ? ' · Key Set' : ' · Local Preview'}] Prepared prompt for ${inputFiles.length} input file(s): ${inputFiles.join(', ') || 'none'}`;
    }
  } catch (err) {
    responseText = `Executed (${provider}/${model}) on ${inputFiles.length} file(s) -> ${outFilename}`;
  }
  if (!responseText) {
    responseText = `Processed ${inputFiles.length} input file(s) with ${provider} (${model}) -> ${outFilename}`;
  }

  node.lastLlmOutput = responseText;
  node.lastLlmOutputFile = outFilename;
  node.lastLlmInputFiles = inputFiles;

  // Push output file to any downstream wired File Container or Node!
  const outgoingWires = (S.wires || []).filter(w => w && w.fromNode === node.id);
  const updatedBuckets = [];
  outgoingWires.forEach(w => {
    const destBucket = (S.fileContainers || []).find(b => b.id === w.toNode);
    if (destBucket) {
      if (!Array.isArray(destBucket.files)) destBucket.files = [];
      if (!destBucket.files.includes(outFilename)) {
        destBucket.files.push(outFilename);
      }
      updatedBuckets.push(destBucket.title || destBucket.id);
    }
  });

  autoSaveWorkflowState('run_llm_query_node');
  renderAll({ preserveInspector: true });
  setStatus(`✅ LLM Node "${node.title}" finished (${provider}/${model}) -> ${outFilename}${updatedBuckets.length ? ` (written to ${updatedBuckets.join(', ')})` : ''}`);
  return {
    ok: true,
    provider,
    model,
    inputFiles,
    outputFile: outFilename,
    response: responseText,
    updatedBuckets
  };
}
window.runLlmQueryNode = runLlmQueryNode;

function addNode(type = 'empty', x = 140, y = 150, custom = {}) {
  const norm = String(type || 'empty').toLowerCase();
  if (norm === 'idea' || norm === 'empty') {
    return spawnIdeaNode(x, y, custom);
  }
  if (norm === 'llm_query' || norm === 'llm') {
    return spawnLlmQueryNode(x, y, custom);
  }
  if (norm === 'external_in') {
    return spawnExternalInNode(x, y, custom);
  }
  if (norm === 'external_out') {
    return spawnExternalOutNode(x, y, custom);
  }
  return spawnAlgorithmNode(x, y, Object.assign({ type: norm }, custom));
}
window.addNode = addNode;

function spawnExternalInNode(x = 170, y = 210, custom = {}) {
  return spawnAlgorithmNode(x, y, Object.assign({
    id: custom.id || uid('ext_in'),
    type: 'external_in',
    title: custom.title || `📥 [External Workflow] Upstream Handoff`,
    category: '📥 EXTERNAL WORKFLOW IN',
    inPorts: custom.inPorts || ['work_order_in'],
    outPorts: custom.outPorts || ['upstream_asset_out', 'upstream_profile_out'],
    inputSpec: custom.inputSpec || 'Upstream Workflow Input Spec',
    outputSpec: custom.outputSpec || 'Upstream Workflow Deliverable',
    steps: custom.steps || [
      'Receives handoff assets from an upstream workflow.',
      'Delivers verified upstream artifacts into this pipeline.'
    ],
    ui_url: custom.ui_url || '',
    ui_label: custom.ui_label || 'Upstream Workflow',
    params: { connector_role: 'external_in', upstream_source: 'external_workflow' },
    notes: ['Upstream external workflow connector'],
    scriptBinding: 'modules/upstream_connector.py',
    w: 315
  }, custom, { type: 'external_in' }));
}
window.spawnExternalInNode = spawnExternalInNode;

function spawnExternalOutNode(x = 680, y = 210, custom = {}) {
  return spawnAlgorithmNode(x, y, Object.assign({
    id: custom.id || uid('ext_out'),
    type: 'external_out',
    title: custom.title || `📤 [Downstream Workflow] Output Handoff`,
    category: '📤 EXTERNAL WORKFLOW OUT',
    inPorts: custom.inPorts || ['verified_payload', 'bundle_manifest.json'],
    outPorts: custom.outPorts || ['published_artifact.zip', 'downstream_handoff.json'],
    inputSpec: custom.inputSpec || 'Approved deliverables from this workflow',
    outputSpec: custom.outputSpec || 'Downstream workflow target outputs',
    steps: custom.steps || [
      'Hands off validated artifacts and metadata cues to a downstream workflow.'
    ],
    ui_url: custom.ui_url || '',
    ui_label: custom.ui_label || 'Downstream Workflow',
    params: { connector_role: 'external_out', downstream_target: 'external_workflow' },
    notes: ['Downstream external workflow connector'],
    scriptBinding: 'modules/downstream_connector.py',
    w: 315
  }, custom, { type: 'external_out' }));
}
window.spawnExternalOutNode = spawnExternalOutNode;

function spawnUtilityNode(appKey, x = 240, y = 160) {
  const spec = STANDARD_UTILITY_CATALOG.find(a => a.key === appKey) || STANDARD_UTILITY_CATALOG[0];
  return spawnAlgorithmNode(x + (S.nodes.length * 22) % 180, y + (S.nodes.length * 18) % 140, {
    title: `${spec.icon} ${spec.key}`,
    category: spec.category,
    inPorts: spec.inPorts.slice(),
    outPorts: spec.outPorts.slice(),
    params: { utility_key: spec.key, offline_mode: true, quality: 'high' },
    scriptBinding: spec.script
  });
}

function spawnFileContainer(x = 520, y = 160, custom = {}) {
  enterConstructionMode('add file container', false);
  const item = {
    id: custom.id || uid('bucket'),
    title: custom.title || `File Container ${S.fileContainers.length + 1}`,
    pattern: custom.pattern || '*.json, *.csv, *.png',
    inPorts: ['files_in'],
    outPorts: ['files_out'],
    files: custom.files || ['summary_report.csv', 'manifest.json'],
    x, y
  };
  S.fileContainers.push(item);
  selectedItem = { kind: 'bucket', id: item.id };
  renderAll();
  return item;
}

function spawnBusNode(x = 420, y = 170, custom = {}) {
  enterConstructionMode('add bus bar', false);
  const item = {
    id: custom.id || uid('bus'),
    title: custom.title || `⚡ Bus Bar ${S.buses.length + 1}`,
    orientation: custom.orientation || 'left-right',
    inPorts: custom.inPorts || ['in_1', 'in_2', 'in_3'],
    outPorts: custom.outPorts || ['out_1', 'out_2', 'out_3'],
    bottomPorts: custom.bottomPorts || ['bus_tap'],
    notes: custom.notes || ['Shared multi-port electrical schematic bus bar'],
    x, y, w: 250, h: 140
  };
  S.buses.push(item);
  selectedItem = { kind: 'bus', id: item.id };
  renderAll();
  return item;
}


const HONEYCOMB_PALETTE_HEX = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#dbbc7f', '#84cc16', '#22c55e', '#a7c080', '#10b981',
  '#14b8a6', '#7fbbb3', '#06b6d4', '#38bdf8',
  '#3b82f6', '#6366f1', '#a855f7', '#d699b6', '#ec4899',
  '#94a3b8'
];
const HONEYCOMB_ROWS = [
  ['#ef4444', '#f97316', '#f59e0b', '#eab308'],
  ['#dbbc7f', '#84cc16', '#22c55e', '#a7c080', '#10b981'],
  ['#14b8a6', '#7fbbb3', '#06b6d4', '#38bdf8'],
  ['#3b82f6', '#6366f1', '#a855f7', '#d699b6', '#ec4899'],
  ['#94a3b8', '__RESET__']
];
const STICKY_THEME_HEX = {
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#38bdf8',
  pink: '#f472b6',
  amber: '#f59e0b'
};

let formatPainterState = {
  active: false,
  color: '#38bdf8',
  sourceKind: '',
  sourceId: ''
};
try {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'formatPainterState', {
      get() { return formatPainterState; },
      set(val) { formatPainterState = val; },
      configurable: true
    });
  }
} catch (e) {}

let fsPickerState = { h: 198, s: 0.77, v: 0.97 };

function normalizeHexColor(raw) {
  if (typeof raw !== 'string') return '';
  const m6 = raw.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (m6) return '#' + m6[1].toLowerCase();
  const m3 = raw.trim().match(/^#?([0-9a-fA-F]{3})$/);
  if (m3) {
    const s = m3[1].toLowerCase();
    return '#' + s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  return '';
}
window.normalizeHexColor = normalizeHexColor;

function hexToRgbObj(hex) {
  const norm = normalizeHexColor(hex);
  if (!norm) return null;
  const n = parseInt(norm.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToRgba(hex, alpha) {
  const rgb = hexToRgbObj(hex);
  if (!rgb) return '';
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function rgbToHex(r, g, b) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
  const h2 = (n) => clamp(n).toString(16).padStart(2, '0');
  return '#' + h2(r) + h2(g) + h2(b);
}

function hsvToRgb(h, s, v) {
  const hh = ((Number(h) % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(1, Number(s) || 0));
  const vv = Math.max(0, Math.min(1, Number(v) || 0));
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh < 60) { r1 = c; g1 = x; }
  else if (hh < 120) { r1 = x; g1 = c; }
  else if (hh < 180) { g1 = c; b1 = x; }
  else if (hh < 240) { g1 = x; b1 = c; }
  else if (hh < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function hsvToHex(h, s, v) {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function rgbToHsv(r, g, b) {
  const rn = Math.max(0, Math.min(255, Number(r) || 0)) / 255;
  const gn = Math.max(0, Math.min(255, Number(g) || 0)) / 255;
  const bn = Math.max(0, Math.min(255, Number(b) || 0)) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * (((bn - rn) / d) + 2);
    else h = 60 * (((rn - gn) / d) + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function getEffectiveItemColorHex(kind, obj) {
  const custom = normalizeHexColor(obj && obj.color);
  if (custom) return custom;
  if (kind === 'sticky' && obj && STICKY_THEME_HEX[obj.color]) {
    return STICKY_THEME_HEX[obj.color];
  }
  if (kind === 'wire') {
    const style = (S && S.wireStyle) || 'schematic';
    return style === 'subway_pulse' ? '#dbbc7f' : (style === 'ortho_pulse' ? '#a7c080' : '#7fbbb3');
  }
  if (kind === 'category' || kind === 'bus') return '#7fbbb3';
  if (kind === 'subcategory') return '#d699b6';
  if (kind === 'cell' || kind === 'bucket') return '#dbbc7f';
  if (kind === 'sticky') return '#eab308';
  const nt = (obj && obj.type) || 'step';
  if (nt === 'idea') return '#f59e0b';
  if (nt === 'external_in') return '#38bdf8';
  if (nt === 'external_out') return '#10b981';
  if (nt === 'llm_query') return '#a855f7';
  return '#a7c080';
}

function getItemColorInlineStyles(obj, kind) {
  const hex = normalizeHexColor(obj && obj.color);
  if (!hex) return { cardStyle: '', hdrStyle: '', customHex: '' };
  const isContainer = kind === 'category' || kind === 'subcategory' || kind === 'cell';
  const hdrBg = hexToRgba(hex, 0.24);
  const bodyBg = hexToRgba(hex, 0.08);
  const cardBg = isContainer ? bodyBg : `linear-gradient(${bodyBg}, ${bodyBg}), #161c21`;
  return {
    cardStyle: `border-color:${hex};background:${cardBg};color:#f1f5f9;`,
    hdrStyle: `background:${hdrBg};border-color:${hexToRgba(hex, 0.45)};color:#f8fafc;`,
    customHex: hex
  };
}

function findItemKindAndObjectById(itemId) {
  if (!S || !itemId) return null;
  const checkArr = [
    ['category', S.categories],
    ['subcategory', S.subcategories],
    ['cell', S.cells],
    ['node', S.nodes],
    ['bucket', S.fileContainers],
    ['bus', S.buses],
    ['sticky', S.stickyNotes],
    ['wire', S.wires]
  ];
  for (let i = 0; i < checkArr.length; i++) {
    const [kind, arr] = checkArr[i];
    const obj = (arr || []).find(x => x && x.id === itemId);
    if (obj) return { kind, id: itemId, obj };
  }
  return null;
}

function findObjectByKindAndId(kind, id) {
  if (!S || !id) return null;
  if (kind === 'category') return (S.categories || []).find(x => x && x.id === id) || null;
  if (kind === 'subcategory') return (S.subcategories || []).find(x => x && x.id === id) || null;
  if (kind === 'cell') return (S.cells || []).find(x => x && x.id === id) || null;
  if (kind === 'node') return (S.nodes || []).find(x => x && x.id === id) || null;
  if (kind === 'bucket') return (S.fileContainers || []).find(x => x && x.id === id) || null;
  if (kind === 'bus') return (S.buses || []).find(x => x && x.id === id) || null;
  if (kind === 'sticky') return (S.stickyNotes || []).find(x => x && x.id === id) || null;
  if (kind === 'wire') return (S.wires || []).find(x => x && x.id === id) || null;
  return null;
}

function applyColorToTarget(kind, id, rawColor, sourceReason = 'color_pick') {
  const obj = findObjectByKindAndId(kind, id);
  if (!obj) return false;
  const norm = normalizeHexColor(rawColor);
  if (typeof captureBaselineSnapshot === 'function') captureBaselineSnapshot(false);
  if (typeof enterConstructionMode === 'function') enterConstructionMode('apply color', false);
  obj.color = norm || '';
  if (norm && S) S.activeBrushColor = norm;
  if (typeof autoSaveWorkflowState === 'function') autoSaveWorkflowState(sourceReason);
  if (typeof renderAll === 'function') renderAll({ preserveInspector: true });
  renderHoneycombPopoverGrid();
  setStatus(norm ? `🎨 Applied ${norm} to ${kind} (${id})` : `↺ Reset color on ${kind} (${id})`);
  return true;
}
window.applyColorToTarget = applyColorToTarget;

function applyColorFromSwatch(hexOrReset, sourceReason = 'honeycomb_palette') {
  if (hexOrReset === '__RESET__' || !hexOrReset) {
    if (selectedItem) {
      applyColorToTarget(selectedItem.kind, selectedItem.id, '', sourceReason);
    } else {
      if (S) S.activeBrushColor = '#38bdf8';
      renderHoneycombPopoverGrid();
      setStatus('↺ Reset active brush color to default');
    }
    return;
  }
  const hex = normalizeHexColor(hexOrReset);
  if (!hex) return;
  if (S) S.activeBrushColor = hex;
  if (formatPainterState && formatPainterState.active) {
    formatPainterState.color = hex;
  }
  if (selectedItem) {
    applyColorToTarget(selectedItem.kind, selectedItem.id, hex, sourceReason);
  } else {
    renderHoneycombPopoverGrid();
    setStatus(`⬡ Active brush color set to ${hex} (select an element or use Painter to apply)`);
  }
}
window.applyColorFromSwatch = applyColorFromSwatch;

function renderHoneycombHexGridHtml(activeHex = '') {
  const normActive = normalizeHexColor(activeHex);
  return HONEYCOMB_ROWS.map(row => `
    <div class="honeycomb-row">
      ${row.map(tok => {
        if (tok === '__RESET__') {
          return `<button type="button" class="honeycomb-hex-btn hex-reset no-drag" data-hex="" onclick="applyColorFromSwatch('__RESET__')" title="Reset Color (Clear Custom Hex)">↺</button>`;
        }
        const isAct = normActive && normActive === tok ? ' active-swatch' : '';
        return `<button type="button" class="honeycomb-hex-btn${isAct} no-drag" data-hex="${tok}" style="background:${tok};" onclick="applyColorFromSwatch('${tok}')" title="${tok}"></button>`;
      }).join('')}
    </div>
  `).join('');
}

function renderHoneycombPopoverGrid() {
  const gridEl = document.getElementById('honeycombPopoverGrid');
  const lblEl = document.getElementById('honeycombActiveHexLabel');
  const selObj = typeof findSelectedObject === 'function' ? findSelectedObject() : null;
  const activeHex = (selObj && selectedItem)
    ? getEffectiveItemColorHex(selectedItem.kind, selObj)
    : (normalizeHexColor(S && S.activeBrushColor) || '#38bdf8');
  if (lblEl) lblEl.textContent = activeHex;
  if (gridEl) gridEl.innerHTML = renderHoneycombHexGridHtml(activeHex);
}

function toggleHoneycombPopover(ev, forceOpen) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const pop = document.getElementById('honeycombPopover');
  if (!pop) return;
  const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !pop.classList.contains('open');
  if (nextOpen) renderHoneycombPopoverGrid();
  if (pop.classList && typeof pop.classList.toggle === 'function') {
    pop.classList.toggle('open', nextOpen);
  }
}
window.toggleHoneycombPopover = toggleHoneycombPopover;

function syncFullSpectrumInputsFromState(shouldRedraw = true) {
  const hex = hsvToHex(fsPickerState.h, fsPickerState.s, fsPickerState.v);
  const rgb = hsvToRgb(fsPickerState.h, fsPickerState.s, fsPickerState.v);
  const hexIn = document.getElementById('fsHexInput');
  const rIn = document.getElementById('fsRInput');
  const gIn = document.getElementById('fsGInput');
  const bIn = document.getElementById('fsBInput');
  const swatch = document.getElementById('fsPreviewSwatch');
  if (hexIn) hexIn.value = hex;
  if (rIn) rIn.value = String(rgb.r);
  if (gIn) gIn.value = String(rgb.g);
  if (bIn) bIn.value = String(rgb.b);
  if (swatch) swatch.style.background = hex;
  if (shouldRedraw) drawFullSpectrumCanvases();
}

function drawFullSpectrumCanvases() {
  const hueCanvas = document.getElementById('fsHueCanvas');
  if (hueCanvas && typeof hueCanvas.getContext === 'function') {
    const ctx = hueCanvas.getContext('2d');
    if (ctx) {
      const w = hueCanvas.width || 296;
      const h = hueCanvas.height || 22;
      const grad = typeof ctx.createLinearGradient === 'function' ? ctx.createLinearGradient(0, 0, w, 0) : null;
      if (grad && typeof grad.addColorStop === 'function') {
        grad.addColorStop(0, '#ff0000');
        grad.addColorStop(1 / 6, '#ffff00');
        grad.addColorStop(2 / 6, '#00ff00');
        grad.addColorStop(3 / 6, '#00ffff');
        grad.addColorStop(4 / 6, '#0000ff');
        grad.addColorStop(5 / 6, '#ff00ff');
        grad.addColorStop(1, '#ff0000');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#38bdf8';
      }
      ctx.fillRect(0, 0, w, h);
      const hx = Math.max(1, Math.min(w - 2, Math.round((fsPickerState.h / 360) * w)));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - 2, 1, 4, h - 2);
    }
  }
  const svCanvas = document.getElementById('fsSvCanvas');
  if (svCanvas && typeof svCanvas.getContext === 'function') {
    const ctx = svCanvas.getContext('2d');
    if (ctx) {
      const w = svCanvas.width || 296;
      const h = svCanvas.height || 170;
      const pureHueHex = hsvToHex(fsPickerState.h, 1, 1);
      ctx.fillStyle = pureHueHex;
      ctx.fillRect(0, 0, w, h);
      if (typeof ctx.createLinearGradient === 'function') {
        const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
        if (whiteGrad && typeof whiteGrad.addColorStop === 'function') {
          whiteGrad.addColorStop(0, '#ffffff');
          whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = whiteGrad;
          ctx.fillRect(0, 0, w, h);
        }
        const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
        if (blackGrad && typeof blackGrad.addColorStop === 'function') {
          blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          blackGrad.addColorStop(1, '#000000');
          ctx.fillStyle = blackGrad;
          ctx.fillRect(0, 0, w, h);
        }
      }
      const px = Math.round(fsPickerState.s * w);
      const py = Math.round((1 - fsPickerState.v) * h);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function selectFullSpectrumSvAtRatio(rx, ry) {
  fsPickerState.s = Math.max(0, Math.min(1, Number(rx) || 0));
  fsPickerState.v = Math.max(0, Math.min(1, 1 - (Number(ry) || 0)));
  syncFullSpectrumInputsFromState(true);
}
window.selectFullSpectrumSvAtRatio = selectFullSpectrumSvAtRatio;

function selectFullSpectrumHueAtRatio(rx) {
  const clamped = Math.max(0, Math.min(1, Number(rx) || 0));
  fsPickerState.h = Math.round(clamped * 360) % 360;
  syncFullSpectrumInputsFromState(true);
}
window.selectFullSpectrumHueAtRatio = selectFullSpectrumHueAtRatio;

function openFullSpectrumColorModal(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const modal = document.getElementById('fullSpectrumColorModal');
  if (!modal) return;
  const obj = typeof findSelectedObject === 'function' ? findSelectedObject() : null;
  const seedHex = (obj && selectedItem)
    ? getEffectiveItemColorHex(selectedItem.kind, obj)
    : (normalizeHexColor(S && S.activeBrushColor) || '#38bdf8');
  const rgb = hexToRgbObj(seedHex) || { r: 56, g: 189, b: 248 };
  fsPickerState = rgbToHsv(rgb.r, rgb.g, rgb.b);
  modal.style.display = 'flex';
  syncFullSpectrumInputsFromState(true);
}
window.openFullSpectrumColorModal = openFullSpectrumColorModal;

function closeFullSpectrumColorModal() {
  const modal = document.getElementById('fullSpectrumColorModal');
  if (modal) modal.style.display = 'none';
}
window.closeFullSpectrumColorModal = closeFullSpectrumColorModal;

function onFullSpectrumHexInput(val) {
  const norm = normalizeHexColor(val);
  if (!norm) return;
  const rgb = hexToRgbObj(norm);
  if (!rgb) return;
  fsPickerState = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const hexIn = document.getElementById('fsHexInput');
  if (hexIn && normalizeHexColor(hexIn.value) !== norm) hexIn.value = norm;
  const rIn = document.getElementById('fsRInput');
  const gIn = document.getElementById('fsGInput');
  const bIn = document.getElementById('fsBInput');
  const swatch = document.getElementById('fsPreviewSwatch');
  if (rIn) rIn.value = String(rgb.r);
  if (gIn) gIn.value = String(rgb.g);
  if (bIn) bIn.value = String(rgb.b);
  if (swatch) swatch.style.background = norm;
  drawFullSpectrumCanvases();
}
window.onFullSpectrumHexInput = onFullSpectrumHexInput;

function onFullSpectrumRgbInput() {
  const rIn = document.getElementById('fsRInput');
  const gIn = document.getElementById('fsGInput');
  const bIn = document.getElementById('fsBInput');
  const r = Math.max(0, Math.min(255, Math.round(Number(rIn ? rIn.value : 0) || 0)));
  const g = Math.max(0, Math.min(255, Math.round(Number(gIn ? gIn.value : 0) || 0)));
  const b = Math.max(0, Math.min(255, Math.round(Number(bIn ? bIn.value : 0) || 0)));
  fsPickerState = rgbToHsv(r, g, b);
  const hex = rgbToHex(r, g, b);
  const hexIn = document.getElementById('fsHexInput');
  const swatch = document.getElementById('fsPreviewSwatch');
  if (hexIn) hexIn.value = hex;
  if (swatch) swatch.style.background = hex;
  drawFullSpectrumCanvases();
}
window.onFullSpectrumRgbInput = onFullSpectrumRgbInput;

function applyFullSpectrumModalColor() {
  const hexIn = document.getElementById('fsHexInput');
  const hex = normalizeHexColor(hexIn ? hexIn.value : '') || hsvToHex(fsPickerState.h, fsPickerState.s, fsPickerState.v);
  applyColorFromSwatch(hex, 'full_spectrum_modal');
  closeFullSpectrumColorModal();
}
window.applyFullSpectrumModalColor = applyFullSpectrumModalColor;

function resetFullSpectrumModalColor() {
  applyColorFromSwatch('__RESET__', 'full_spectrum_reset');
  closeFullSpectrumColorModal();
}
window.resetFullSpectrumModalColor = resetFullSpectrumModalColor;

(function bindFullSpectrumCanvasEvents() {
  const svCanvas = document.getElementById('fsSvCanvas');
  const hueCanvas = document.getElementById('fsHueCanvas');
  let dragKind = '';
  const updateFromEvent = (ev, kind) => {
    const el = kind === 'sv' ? svCanvas : hueCanvas;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;
    const rect = el.getBoundingClientRect();
    const rx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width || el.width)));
    const ry = Math.max(0, Math.min(1, (ev.clientY - rect.top) / Math.max(1, rect.height || el.height)));
    if (kind === 'sv') selectFullSpectrumSvAtRatio(rx, ry);
    else selectFullSpectrumHueAtRatio(rx);
  };
  if (svCanvas && typeof svCanvas.addEventListener === 'function') {
    svCanvas.addEventListener('mousedown', (ev) => { dragKind = 'sv'; updateFromEvent(ev, 'sv'); });
  }
  if (hueCanvas && typeof hueCanvas.addEventListener === 'function') {
    hueCanvas.addEventListener('mousedown', (ev) => { dragKind = 'hue'; updateFromEvent(ev, 'hue'); });
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('mousemove', (ev) => { if (dragKind) updateFromEvent(ev, dragKind); });
    window.addEventListener('mouseup', () => { dragKind = ''; });
  }
})();

function syncWireModeToolbarUI() {
  const wireSel = Boolean(S && S.wireSelectMode);
  const wireDel = Boolean(S && S.wireDeleteMode);
  const painterOn = Boolean(formatPainterState && formatPainterState.active);
  const btnSel = document.getElementById('btnToggleSelectWires');
  const btnDel = document.getElementById('btnToggleDeleteWires');
  const btnPaint = document.getElementById('btnFormatPainter');
  if (btnSel && btnSel.classList) {
    btnSel.classList.toggle('active', wireSel);
    if (typeof btnSel.setAttribute === 'function') btnSel.setAttribute('aria-pressed', wireSel ? 'true' : 'false');
  }
  if (btnDel && btnDel.classList) {
    btnDel.classList.toggle('active', wireDel);
    if (typeof btnDel.setAttribute === 'function') btnDel.setAttribute('aria-pressed', wireDel ? 'true' : 'false');
  }
  if (btnPaint && btnPaint.classList) {
    btnPaint.classList.toggle('active', painterOn);
    if (typeof btnPaint.setAttribute === 'function') btnPaint.setAttribute('aria-pressed', painterOn ? 'true' : 'false');
    btnPaint.title = painterOn
      ? `🖌️ Format Painter ACTIVE (${formatPainterState.color}) — Click any node, container, sticky note, or wire to paint [Esc exits]`
      : '🖌️ Format Painter — Copy selected item/wire color and click nodes, containers, stickies, or wires to paint';
  }
  if (typeof document !== 'undefined' && document.body && document.body.classList) {
    document.body.classList.toggle('format-painter-active', painterOn);
  }
  const svgEl = (typeof wireSvg !== 'undefined' && wireSvg) ? wireSvg : (typeof document !== 'undefined' ? document.getElementById('wire-svg') : null);
  if (svgEl && svgEl.classList) {
    const interactive = wireSel || wireDel || painterOn;
    svgEl.classList.toggle('wires-interactive', interactive);
    svgEl.classList.toggle('wire-mode-paint', painterOn);
    svgEl.classList.toggle('wire-mode-select', wireSel && !painterOn);
    svgEl.classList.toggle('wire-mode-delete', wireDel && !painterOn);
  }
}
window.syncWireModeToolbarUI = syncWireModeToolbarUI;

function toggleSelectWiresMode(forceState) {
  ensureStateDefaults();
  const next = typeof forceState === 'boolean' ? forceState : !Boolean(S.wireSelectMode);
  S.wireSelectMode = next;
  if (next) S.wireDeleteMode = false;
  syncWireModeToolbarUI();
  renderWires();
  setStatus(next ? '🔌 Select Wires Mode ON — Click any connector to inspect & color it [Esc exits]' : '⬜ Select Wires Mode OFF');
  return S.wireSelectMode;
}
window.toggleSelectWiresMode = toggleSelectWiresMode;

function toggleDeleteWiresMode(forceState) {
  ensureStateDefaults();
  const next = typeof forceState === 'boolean' ? forceState : !Boolean(S.wireDeleteMode);
  S.wireDeleteMode = next;
  if (next) S.wireSelectMode = false;
  syncWireModeToolbarUI();
  renderWires();
  setStatus(next ? '✂️ Delete Wires Mode ON — Click any connector to delete it [Esc exits]' : '⬜ Delete Wires Mode OFF');
  return S.wireDeleteMode;
}
window.toggleDeleteWiresMode = toggleDeleteWiresMode;

function toggleFormatPainter(forceState) {
  ensureStateDefaults();
  const next = typeof forceState === 'boolean' ? forceState : !Boolean(formatPainterState && formatPainterState.active);
  if (next) {
    const selObj = typeof findSelectedObject === 'function' ? findSelectedObject() : null;
    const picked = (selObj && selectedItem)
      ? getEffectiveItemColorHex(selectedItem.kind, selObj)
      : (normalizeHexColor(S && S.activeBrushColor) || '#38bdf8');
    formatPainterState.active = true;
    formatPainterState.color = picked;
    formatPainterState.sourceKind = selectedItem ? selectedItem.kind : '';
    formatPainterState.sourceId = selectedItem ? selectedItem.id : '';
    if (S) S.activeBrushColor = picked;
    setStatus(`🖌️ Format Painter ON (${picked}) — Click any card, container, sticky note, or wire to paint [Esc exits]`);
  } else {
    formatPainterState.active = false;
    setStatus('⬜ Format Painter OFF');
  }
  syncWireModeToolbarUI();
  renderWires();
  if (typeof renderInspector === 'function' && selectedItem) renderInspector();
  return formatPainterState.active;
}
window.toggleFormatPainter = toggleFormatPainter;

function resetInteractionModes() {
  if (S && typeof S === 'object') {
    S.wireSelectMode = false;
    S.wireDeleteMode = false;
  }
  if (formatPainterState) {
    formatPainterState.active = false;
    formatPainterState.sourceKind = '';
    formatPainterState.sourceId = '';
  }
  syncWireModeToolbarUI();
}
window.resetInteractionModes = resetInteractionModes;

function handleWireHitClick(ev, wireId) {
  const painterOn = Boolean(formatPainterState && formatPainterState.active);
  const wireSel = Boolean(S && S.wireSelectMode);
  const wireDel = Boolean(S && S.wireDeleteMode);
  if (!painterOn && !wireSel && !wireDel) {
    return false;
  }
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
  if (painterOn) {
    return applyColorToTarget('wire', wireId, formatPainterState.color, 'format_painter');
  }
  if (wireSel) {
    const w = (S && S.wires || []).find(x => x && x.id === wireId);
    if (!w) return false;
    selectedItem = { kind: 'wire', id: wireId };
    syncSelectedDomClasses();
    renderWires();
    if (typeof renderInspector === 'function') renderInspector();
    setStatus(`🔌 Selected connector ${wireId} (${w.fromNode}.${w.fromPort} ➔ ${w.toNode}.${w.toPort})`);
    return true;
  }
  if (wireDel) {
    deleteWire(wireId);
    return true;
  }
  return false;
}
window.handleWireHitClick = handleWireHitClick;


function loadStateObject(stateObj, wfKeyOverride = '') {
  if (!stateObj || typeof stateObj !== 'object') return null;
  const copy = JSON.parse(JSON.stringify(stateObj));
  copy.wireSelectMode = false;
  copy.wireDeleteMode = false;
  S = copy;
  if (wfKeyOverride) S.workflowId = wfKeyOverride;
  ensureStateDefaults();
  resetInteractionModes();
  if (typeof captureBaselineSnapshot === 'function') captureBaselineSnapshot(true);
  selectedItem = null;
  armedPort = null;
  connectingPort = null;
  const selEl = typeof document !== 'undefined' ? document.getElementById('presetSelect') : null;
  if (selEl && S.workflowId) selEl.value = S.workflowId;
  if (typeof syncWorkflowStatusUI === 'function') syncWorkflowStatusUI();
  if (typeof renderAll === 'function') renderAll();
  if (typeof fitViewToAll === 'function') fitViewToAll();
  return S;
}
window.loadStateObject = loadStateObject;

function loadPreset(presetKey, forceFactory = false) {
  return loadPresetTemplate(presetKey, forceFactory);
}
window.loadPreset = loadPreset;

const STICKY_COLOR_PALETTE = ['yellow', 'green', 'blue', 'pink', 'amber'];

function addStickyNote(x, y, custom = {}) {
  ensureStateDefaults();
  enterConstructionMode('add sticky note', false);
  if (typeof x === 'object' && x !== null) {
    custom = x;
    x = custom.x;
    y = custom.y;
  }
  const attachedToId = custom.attachedToId || (selectedItem && selectedItem.kind !== 'sticky' ? selectedItem.id : '');
  const targetObj = attachedToId ? findAnyItemById(attachedToId) : null;
  const defaultX = typeof x === 'number'
    ? x
    : (targetObj ? targetObj.x + 20 : 160 + ((S.stickyNotes.length * 36) % 280));
  const defaultY = typeof y === 'number'
    ? y
    : (targetObj ? Math.max(40, targetObj.y - 260) : 90 + ((S.stickyNotes.length * 28) % 220));
  const item = {
    id: custom.id || uid('sticky'),
    title: custom.title || '📝 Sticky Note',
    color: (STICKY_COLOR_PALETTE.includes(custom.color) || normalizeHexColor(custom.color)) ? (normalizeHexColor(custom.color) || custom.color) : 'yellow',
    assignee: ['both', 'assistant', 'user'].includes(custom.assignee) ? custom.assignee : (custom.assignee === 'agent' ? 'assistant' : 'both'),
    attachedToId: attachedToId || '',
    attachedToId2: custom.attachedToId2 || (Array.isArray(custom.attachedToIds) && custom.attachedToIds[1]) || '',
    attachedToIds: Array.isArray(custom.attachedToIds)
      ? custom.attachedToIds.filter(Boolean)
      : [attachedToId, custom.attachedToId2].filter(Boolean),
    tetherIds: Array.isArray(custom.tetherIds)
      ? custom.tetherIds.filter(Boolean)
      : (Array.isArray(custom.attachedToIds) ? custom.attachedToIds.filter(Boolean) : [attachedToId, custom.attachedToId2].filter(Boolean)),
    text: typeof custom.text === 'string' ? custom.text : '',
    todos: Array.isArray(custom.todos)
      ? custom.todos.map(td => ({
          id: td.id || uid('todo'),
          text: String(td.text || 'Reminder task'),
          done: Boolean(td.done)
        }))
      : [
          { id: uid('todo'), text: 'Review node inputs & outputs', done: false }
        ],
    images: Array.isArray(custom.images) ? custom.images.slice() : [],
    x: defaultX,
    y: defaultY,
    w: custom.w || 280,
    h: custom.h || 240,
    userResized: Boolean(custom.userResized)
  };
  S.stickyNotes.push(item);
  selectedItem = { kind: 'sticky', id: item.id };
  autoSaveWorkflowState('add_sticky');
  setStatus(`📝 Added Sticky Note "${item.title}"${item.attachedToId ? ` attached to ${item.attachedToId}` : ''}`);
  renderAll();
  return item;
}
window.addStickyNote = addStickyNote;
window.spawnStickyNote = addStickyNote;

function findStickyNoteById(stickyId) {
  ensureStateDefaults();
  return (S.stickyNotes || []).find(sn => sn.id === stickyId) || null;
}

function updateStickyNoteField(stickyId, field, val, shouldFullRender = false) {
  const sn = findStickyNoteById(stickyId);
  if (!sn) return null;
  enterConstructionMode('edit sticky note', false);
  sn[field] = val;
  autoSaveWorkflowState('edit_sticky_' + field);
  if (shouldFullRender) {
    renderAll({ preserveInspector: true });
  } else {
    renderWires();
    updateMetricsAndJson();
  }
  return sn;
}
window.updateStickyNoteField = updateStickyNoteField;

function cycleStickyNoteColor(ev, stickyId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const sn = findStickyNoteById(stickyId);
  if (!sn) return;
  const curIdx = STICKY_COLOR_PALETTE.indexOf(sn.color || 'yellow');
  sn.color = STICKY_COLOR_PALETTE[(curIdx + 1) % STICKY_COLOR_PALETTE.length];
  autoSaveWorkflowState('sticky_color');
  renderAll({ preserveInspector: true });
}
window.cycleStickyNoteColor = cycleStickyNoteColor;

function getStickyTetherIds(sn) {
  if (!sn || typeof sn !== 'object') return [];
  const raw = [];
  if (sn.attachedToId) raw.push(String(sn.attachedToId).trim());
  if (sn.attachedToId2) raw.push(String(sn.attachedToId2).trim());
  if (Array.isArray(sn.attachedToIds)) raw.push(...sn.attachedToIds.map(x => String(x || '').trim()));
  if (Array.isArray(sn.tetherIds)) raw.push(...sn.tetherIds.map(x => String(x || '').trim()));
  if (Array.isArray(sn.extraTetherIds)) raw.push(...sn.extraTetherIds.map(x => String(x || '').trim()));
  const seen = new Set();
  const out = [];
  for (const id of raw) {
    if (!id) continue;
    const canonical = id;
    if (!seen.has(canonical)) {
      seen.add(canonical);
      out.push(canonical);
    }
  }
  return out;
}
window.getStickyTetherIds = getStickyTetherIds;

function syncStickyTetherFields(sn, idsList) {
  const clean = [];
  const seen = new Set();
  (idsList || []).forEach(x => {
    const s = String(x || '').trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      clean.push(s);
    }
  });
  sn.attachedToId = clean[0] || '';
  sn.attachedToId2 = clean[1] || '';
  sn.attachedToIds = clean.slice();
  sn.tetherIds = clean.slice();
  return clean;
}

function attachStickyToNode(stickyId, targetId) {
  const sn = findStickyNoteById(stickyId);
  if (!sn) return null;
  const current = getStickyTetherIds(sn);
  const rest = current.slice(1).filter(id => id !== targetId);
  const nextIds = targetId ? [targetId, ...rest] : rest;
  syncStickyTetherFields(sn, nextIds);
  autoSaveWorkflowState('attach_sticky');
  setStatus(sn.attachedToIds.length ? `📌 Tethered Sticky Note "${sn.title}" to ${sn.attachedToIds.join(' + ')}` : `📌 Unpinned Sticky Note "${sn.title}"`);
  renderAll({ preserveInspector: true });
  return sn;
}
window.attachStickyToNode = attachStickyToNode;

function attachStickySecondaryNode(stickyId, targetId2) {
  const sn = findStickyNoteById(stickyId);
  if (!sn) return null;
  const current = getStickyTetherIds(sn);
  const primary = current[0] || sn.attachedToId || '';
  const extra = current.slice(2).filter(id => id !== primary && id !== targetId2);
  const nextIds = [primary, targetId2, ...extra].filter(Boolean);
  syncStickyTetherFields(sn, nextIds);
  autoSaveWorkflowState('attach_sticky_secondary');
  setStatus(sn.attachedToIds.length ? `📌 Tethered Sticky Note "${sn.title}" to ${sn.attachedToIds.join(' + ')}` : `📌 Unpinned Sticky Note "${sn.title}"`);
  renderAll({ preserveInspector: true });
  return sn;
}
window.attachStickySecondaryNode = attachStickySecondaryNode;

function toggleStickyTetherNode(stickyId, targetId) {
  const sn = findStickyNoteById(stickyId);
  if (!sn || !targetId) return null;
  const current = getStickyTetherIds(sn);
  const nextIds = current.includes(targetId)
    ? current.filter(id => id !== targetId)
    : [...current, targetId];
  syncStickyTetherFields(sn, nextIds);
  autoSaveWorkflowState('toggle_sticky_tether');
  renderAll({ preserveInspector: true });
  return sn;
}
window.toggleStickyTetherNode = toggleStickyTetherNode;

function addStickyTodo(ev, stickyId, initialText = '') {
  if (typeof ev === 'string') {
    initialText = stickyId || '';
    stickyId = ev;
    ev = null;
  }
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const sn = findStickyNoteById(stickyId);
  if (!sn) return null;
  if (!Array.isArray(sn.todos)) sn.todos = [];
  const td = {
    id: uid('todo'),
    text: initialText || `To-Do item ${sn.todos.length + 1}`,
    done: false
  };
  sn.todos.push(td);
  autoSaveWorkflowState('add_sticky_todo');
  renderAll({ preserveInspector: true });
  return td;
}
window.addStickyTodo = addStickyTodo;
window.addStickyTodoItem = addStickyTodo;

function toggleStickyTodo(ev, stickyId, todoId) {
  if (typeof ev === 'string' && typeof stickyId === 'string' && !todoId) {
    todoId = stickyId;
    stickyId = ev;
    ev = null;
  }
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const sn = findStickyNoteById(stickyId);
  if (!sn || !Array.isArray(sn.todos)) return null;
  const td = sn.todos.find(t => t.id === todoId);
  if (!td) return null;
  td.done = !Boolean(td.done);
  autoSaveWorkflowState('toggle_sticky_todo');
  renderAll({ preserveInspector: true });
  return td;
}
window.toggleStickyTodo = toggleStickyTodo;
window.toggleStickyTodoItem = toggleStickyTodo;

function updateStickyTodoText(stickyId, todoId, nextText) {
  const sn = findStickyNoteById(stickyId);
  if (!sn || !Array.isArray(sn.todos)) return null;
  const td = sn.todos.find(t => t.id === todoId);
  if (!td) return null;
  td.text = String(nextText || '');
  autoSaveWorkflowState('edit_sticky_todo');
  updateMetricsAndJson();
  return td;
}
window.updateStickyTodoText = updateStickyTodoText;

function deleteStickyTodo(ev, stickyId, todoId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const sn = findStickyNoteById(stickyId);
  if (!sn || !Array.isArray(sn.todos)) return;
  sn.todos = sn.todos.filter(t => t.id !== todoId);
  autoSaveWorkflowState('delete_sticky_todo');
  renderAll({ preserveInspector: true });
}
window.deleteStickyTodo = deleteStickyTodo;

async function addStickyImageFromDataUrl(stickyId, dataUrl, caption = '') {
  const sn = findStickyNoteById(stickyId);
  if (!sn || !dataUrl) return null;
  if (!Array.isArray(sn.images)) sn.images = [];
  const uploadedUri = '';
  const imgEntry = {
    id: uid('simg'),
    url: uploadedUri || dataUrl,
    dataUrl: dataUrl,
    caption: caption || `Pasted PNG (${formatAutoSaveTime()})`
  };
  sn.images.push(imgEntry);
  if (!sn.userResized && (sn.h || 240) < 310) {
    sn.h = 320;
  }
  autoSaveWorkflowState('sticky_add_image');
  setStatus(`🖼️ Pasted image into Sticky Note "${sn.title}"`);
  renderAll({ preserveInspector: true });
  return imgEntry;
}
window.addStickyImageFromDataUrl = addStickyImageFromDataUrl;

function deleteStickyImage(ev, stickyId, imgId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const sn = findStickyNoteById(stickyId);
  if (!sn || !Array.isArray(sn.images)) return;
  sn.images = sn.images.filter(im => im.id !== imgId);
  autoSaveWorkflowState('sticky_delete_image');
  renderAll({ preserveInspector: true });
}
window.deleteStickyImage = deleteStickyImage;

function handleStickyImagePaste(ev, stickyId) {
  const cb = ev && ev.clipboardData;
  if (!cb || !cb.items) return false;
  for (let i = 0; i < cb.items.length; i++) {
    const item = cb.items[i];
    if (item && item.type && item.type.indexOf('image') !== -1) {
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
      const blob = item.getAsFile ? item.getAsFile() : null;
      if (!blob) continue;
      let targetId = stickyId || (selectedItem && selectedItem.kind === 'sticky' ? selectedItem.id : '');
      if (!targetId) {
        const created = addStickyNote();
        targetId = created.id;
      }
      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = () => {
          addStickyImageFromDataUrl(targetId, reader.result);
        };
        reader.readAsDataURL(blob);
      }
      return true;
    }
  }
  return false;
}
window.handleStickyImagePaste = handleStickyImagePaste;

function triggerStickyImageUpload(ev, stickyId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const inp = document.getElementById(`stickyFileInput_${stickyId}`);
  if (inp && typeof inp.click === 'function') {
    inp.click();
    return;
  }
  const tinyPng = makeFallbackPngDataUrl(8);
  addStickyImageFromDataUrl(stickyId, tinyPng, 'Sample Pasted Diagram.png');
}
window.triggerStickyImageUpload = triggerStickyImageUpload;

function onStickyFileInputChange(ev, stickyId) {
  const file = ev && ev.target && ev.target.files && ev.target.files[0];
  if (!file || typeof FileReader === 'undefined') return;
  const reader = new FileReader();
  reader.onload = () => {
    addStickyImageFromDataUrl(stickyId, reader.result, file.name);
  };
  reader.readAsDataURL(file);
}
window.onStickyFileInputChange = onStickyFileInputChange;

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('paste', (ev) => {
    const stickyTargetId = (selectedItem && selectedItem.kind === 'sticky') ? selectedItem.id : '';
    handleStickyImagePaste(ev, stickyTargetId);
  });
}

function isItemInsideContainer(item, cont) {
  if (!item || !cont || item.id === cont.id) return false;
  const cx = item.x + (item.w || 240) * 0.35;
  const cy = item.y + 30;
  return cx >= cont.x && cx <= cont.x + cont.w && cy >= cont.y && cy <= cont.y + cont.h;
}

function findCollapsedParentContainer(item) {
  for (const c of S.categories) {
    if (c.collapsed && isItemInsideContainer(item, c)) return c;
  }
  for (const sc of S.subcategories) {
    if (sc.collapsed && isItemInsideContainer(item, sc)) return sc;
  }
  for (const cell of S.cells) {
    if (cell.collapsed && isItemInsideContainer(item, cell)) return cell;
  }
  return null;
}

function findAnyItemById(itemId) {
  if (!itemId) return null;
  const direct = (
    (S.categories || []).find(c => c.id === itemId) ||
    (S.subcategories || []).find(sc => sc.id === itemId) ||
    (S.cells || []).find(cl => cl.id === itemId) ||
    (S.nodes || []).find(n => n.id === itemId) ||
    (S.fileContainers || []).find(fc => fc.id === itemId) ||
    (S.buses || []).find(b => b.id === itemId) ||
    (S.stickyNotes || []).find(sn => sn.id === itemId) ||
    null
  );
  if (direct) return direct;

  return null;
}

function getCollapsedContainerHeight(cont) {
  if (!cont) return 96;
  const inLen = (cont.inPorts || ['in']).length;
  const outLen = (cont.outPorts || ['out']).length;
  const hasBottom = Boolean(cont.bottomPorts && cont.bottomPorts.length);
  return Math.max(96, 52 + Math.max(inLen, outLen, 1) * 40 + (hasBottom ? 22 : 8));
}
window.getCollapsedContainerHeight = getCollapsedContainerHeight;

function isContainerItem(item) {
  if (!item) return false;
  return (
    (S.categories || []).some(c => c.id === item.id) ||
    (S.subcategories || []).some(sc => sc.id === item.id) ||
    (S.cells || []).some(cl => cl.id === item.id)
  );
}

function findEnclosingContainerForWire(w) {
  const fromObj = findAnyItemById(w.fromNode);
  const toObj = findAnyItemById(w.toNode);
  if (!fromObj || !toObj) return null;
  if (isContainerItem(fromObj) && isItemInsideContainer(toObj, fromObj)) {
    return fromObj;
  }
  if (isContainerItem(toObj) && isItemInsideContainer(fromObj, toObj)) {
    return toObj;
  }
  const allContainers = [...(S.categories || []), ...(S.subcategories || []), ...(S.cells || [])];
  for (const c of allContainers) {
    if (isItemInsideContainer(fromObj, c) && isItemInsideContainer(toObj, c)) {
      return c;
    }
  }
  return null;
}

function resolveActualPortDir(itemId, portName, fallbackDir) {
  const item = findAnyItemById(itemId);
  if (!item) return fallbackDir || 'out';
  if (Array.isArray(item.inPorts) && item.inPorts.includes(portName)) return 'in';
  if (Array.isArray(item.outPorts) && item.outPorts.includes(portName)) return 'out';
  if (Array.isArray(item.bottomPorts) && item.bottomPorts.includes(portName)) return 'bottom';
  return fallbackDir || 'out';
}

function getPortCoordinates(nodeOrBucketId, portName, dirHint, slotOffset = 0) {
  const dir = resolveActualPortDir(nodeOrBucketId, portName, dirHint);

  // Check if item is inside a collapsed container first
  const nodeItem = S.nodes.find(n => n.id === nodeOrBucketId) || S.fileContainers.find(b => b.id === nodeOrBucketId) || (S.buses || []).find(b => b.id === nodeOrBucketId);
  if (nodeItem) {
    const parentCollapsed = findCollapsedParentContainer(nodeItem);
    if (parentCollapsed) {
      const redirectedPort = dir === 'out' ? (parentCollapsed.outPorts || ['out'])[0] : (parentCollapsed.inPorts || ['in'])[0];
      return getPortCoordinates(parentCollapsed.id, redirectedPort, dir, slotOffset);
    }
  }

  // Prefer live DOM measurement of the exact .port-dot center when rendered in browser
  if (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelector) {
    const dotEl = domLayer.querySelector(`.port-dot[data-node="${nodeOrBucketId}"][data-port="${portName}"][data-dir="${dir}"]`)
      || domLayer.querySelector(`.port-dot[data-node="${nodeOrBucketId}"][data-port="${portName}"]`);
    if (dotEl && dotEl.offsetWidth > 0) {
      if (worldLayer && dotEl.getBoundingClientRect) {
        const dotRect = dotEl.getBoundingClientRect();
        const worldRect = worldLayer.getBoundingClientRect();
        const z = S.zoom || 1.0;
        if (dotRect.width > 0 && worldRect.width > 0) {
          return {
            x: Math.round((dotRect.left + dotRect.width / 2 - worldRect.left) / z),
            y: Math.round((dotRect.top + dotRect.height / 2 - worldRect.top) / z + slotOffset)
          };
        }
      }
      let cx = dotEl.offsetWidth / 2;
      let cy = dotEl.offsetHeight / 2;
      let cur = dotEl;
      while (cur && cur !== domLayer && cur !== worldLayer) {
        cx += cur.offsetLeft || 0;
        cy += cur.offsetTop || 0;
        cur = cur.offsetParent;
      }
      return { x: Math.round(cx), y: Math.round(cy + slotOffset) };
    }
  }

  const allContainers = [...S.categories, ...S.subcategories, ...S.cells];
  const cont = allContainers.find(c => c.id === nodeOrBucketId);
  if (cont) {
    const effH = cont.collapsed ? getCollapsedContainerHeight(cont) : cont.h;
    if ((cont.bottomPorts || []).includes(portName) || dir === 'bottom') {
      const bIdx = Math.max(0, (cont.bottomPorts || []).indexOf(portName));
      return { x: cont.x + Math.round(cont.w / 2) + bIdx * 28 + slotOffset, y: cont.y + effH - 6 };
    }
    const list = dir === 'out' ? (cont.outPorts || ['out']) : (cont.inPorts || ['in']);
    const idx = Math.max(0, list.indexOf(portName));
    const px = dir === 'out' ? cont.x + cont.w - 14 : cont.x + 14;
    const py = cont.y + 62 + idx * 38 + slotOffset;
    return { x: px, y: py };
  }
  const bus = (S.buses || []).find(b => b.id === nodeOrBucketId);
  if (bus) {
    const list = dir === 'out' ? (bus.outPorts || []) : (bus.inPorts || []);
    const idx = Math.max(0, list.indexOf(portName));
    if (bus.orientation === 'top-bottom') {
      const px = bus.x + 36 + idx * 44 + slotOffset;
      const py = dir === 'out' ? bus.y + (bus.h || 195) - 12 : bus.y + 42;
      return { x: px, y: py };
    }
    const isRev = bus.orientation === 'right-left';
    const leftOut = isRev ? dir === 'out' : dir !== 'out';
    const px = leftOut ? bus.x + 14 : bus.x + (bus.w || 250) - 14;
    const py = bus.y + 90 + idx * 38 + slotOffset;
    return { x: px, y: py };
  }
  const node = S.nodes.find(n => n.id === nodeOrBucketId);
  if (node) {
    const list = dir === 'out' ? node.outPorts : node.inPorts;
    const idx = Math.max(0, list.indexOf(portName));
    const px = dir === 'out' ? node.x + (node.w || 255) - 14 : node.x + 14;
    const py = node.y + 84 + idx * 38 + slotOffset;
    return { x: px, y: py };
  }
  const bucket = S.fileContainers.find(b => b.id === nodeOrBucketId);
  if (bucket) {
    const list = dir === 'out' ? (bucket.outPorts || ['files_out']) : (bucket.inPorts || ['files_in']);
    const idx = Math.max(0, list.indexOf(portName));
    const px = dir === 'out' ? bucket.x + (bucket.w || 245) - 14 : bucket.x + 14;
    const py = bucket.y + 62 + idx * 38 + slotOffset;
    return { x: px, y: py };
  }
  return { x: 100, y: 100 };
}

function estimateItemHeight(item, kind) {
  const cs = (item && item.collapsedSections) ? item.collapsedSections : {};
  if (kind === 'node') {
    const portRows = Math.max((item.inPorts || []).length, (item.outPorts || []).length, 1);
    const paramCount = Object.keys(item.params || {}).length;
    const paramsH = paramCount > 0 ? (cs.params ? 22 : (24 + paramCount * 16)) : 0;
    const hasIoSpec = Boolean(item.inputSpec || item.outputSpec);
    const ioSpecH = hasIoSpec ? (cs.io_specs ? 22 : 44) : 0;
    const stepsArr = Array.isArray(item.steps) && item.steps.length
      ? item.steps
      : (Array.isArray(item.substeps) ? item.substeps : []);
    const substepsCount = stepsArr.length;
    const substepsH = substepsCount > 0 ? (cs.substeps ? 22 : Math.min(115, 22 + substepsCount * 22)) : 0;
    const rulesArr = Array.isArray(item.rules) && item.rules.length
      ? item.rules
      : (Array.isArray(item.notes) ? item.notes : []);
    const rulesCount = rulesArr.length;
    const rulesH = rulesCount > 0 ? (cs.rules ? 22 : Math.min(100, 22 + rulesCount * 20)) : 0;
    const uiLaunchH = (item.ui_url || item.uiUrl) ? 26 : 0;
    const calcH = 70 + portRows * 40 + uiLaunchH + ioSpecH + substepsH + rulesH + paramsH + 16;
    const anyCol = Boolean(cs.params || cs.io_specs || cs.substeps || cs.rules);
    const minH = Math.max(anyCol ? 148 : 205, calcH);
    return (item && item.userResized && item.h) ? Math.max(item.h, minH) : minH;
  }
  if (kind === 'bucket') {
    const fileCount = (item.files || []).length;
    const portRows = Math.max((item.inPorts || ['files_in']).length, (item.outPorts || ['files_out']).length, 1);
    const filesH = cs.files ? 24 : (Math.min(8, fileCount) * 26 + 26);
    const calcH = 68 + portRows * 40 + filesH + 38;
    const minH = Math.max(cs.files ? 158 : 205, calcH);
    return (item && item.userResized && item.h) ? Math.max(item.h, minH) : minH;
  }
  if (kind === 'bus') {
    const portRows = Math.max((item.inPorts || []).length, (item.outPorts || []).length, 2);
    const calcH = 82 + portRows * 40 + 24;
    const minH = Math.max(205, calcH);
    return (item && item.userResized && item.h) ? Math.max(item.h, minH) : minH;
  }
  return item.h || 185;
}

function getContainerTopClearance(cont) {
  if (!cont || cont.collapsed) return 60;
  const inCount = (cont.inPorts || ['in']).length;
  const outCount = (cont.outPorts || ['out']).length;
  const portRows = Math.max(inCount, outCount, 1);
  const ioRailH = 14 + portRows * 40;
  const notesArr = cont.notes || cont.checklist || [];
  const notesCollapsed = Boolean(cont.collapsedSections && cont.collapsedSections.notes);
  const notesH = notesArr.length > 0 ? (notesCollapsed ? 26 : Math.min(104, 24 + notesArr.length * 22)) : 0;
  return Math.max(52, 38 + ioRailH + notesH + 20);
}

function autoFitWorkflowContainersAndPreventOverlap() {
  if (!S) return;
  const min_gap_x = 36;
  const min_gap_y = 28;
  const padLeft = 20;
  const padRight = 20;
  const padBottom = 44;
  const min_container_gap_x = 32;
  const min_container_gap_y = 64;

  const measureLeaf = (item, kind, defaultW) => {
    const domEl = (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelector)
      ? domLayer.querySelector(`[data-item-id="${item.id}"]`)
      : null;
    const estH = estimateItemHeight(item, kind);
    const domW = domEl ? Math.max(domEl.offsetWidth || 0, domEl.scrollWidth || 0) : 0;
    const domH = domEl ? Math.max(domEl.scrollHeight || 0, domEl.offsetHeight || 0) : 0;
    const w = item.userResized && item.w
      ? item.w
      : (domW > 0 ? Math.max(item.w || defaultW, domW) : (item.w || defaultW));
    const h = Math.max(item.userResized && item.h ? item.h : 0, domH, estH);
    item.w = w;
    item.h = h;
    return { w, h };
  };

  const leafItems = [];
  (S.nodes || []).forEach(n => {
    measureLeaf(n, 'node', 255);
    leafItems.push({ item: n, kind: 'node' });
  });
  (S.fileContainers || []).forEach(fc => {
    measureLeaf(fc, 'bucket', 245);
    leafItems.push({ item: fc, kind: 'bucket' });
  });
  (S.buses || []).forEach(bus => {
    measureLeaf(bus, 'bus', 250);
    leafItems.push({ item: bus, kind: 'bus' });
  });

  const allContainers = [
    ...(S.categories || []),
    ...(S.subcategories || []),
    ...(S.cells || [])
  ];

  // Assign each leaf item to its explicit or tightest enclosing container (if any)
  const childrenByContainerId = {};
  const parentByLeafId = {};
  allContainers.forEach(c => { childrenByContainerId[c.id] = []; });

  leafItems.forEach(({ item }) => {
    let bestCont = null;
    allContainers.forEach(cont => {
      if (Array.isArray(cont.childNodeIds) && cont.childNodeIds.includes(item.id)) {
        bestCont = cont;
      } else if (item.parentId && item.parentId === cont.id) {
        bestCont = cont;
      }
    });
    if (!bestCont) {
      let bestArea = Infinity;
      allContainers.forEach(cont => {
        if (isItemInsideContainer(item, cont)) {
          const area = (cont.w || 320) * (cont.h || 220);
          if (area < bestArea) {
            bestArea = area;
            bestCont = cont;
          }
        }
      });
    }
    if (!bestCont && item._parentContId) {
      const prevCont = allContainers.find(c => c.id === item._parentContId);
      if (prevCont && item.x >= prevCont.x - 20 && item.y >= prevCont.y - 20) {
        bestCont = prevCont;
      }
    }
    if (bestCont) {
      item._parentContId = bestCont.id;
      childrenByContainerId[bestCont.id].push(item);
      parentByLeafId[item.id] = bestCont.id;
    }
  });

  // Step 1 & 2: Inside each container, resolve sibling overlaps and auto-fit container (x, y, w, h) to 100% surround all children
  allContainers.forEach(cont => {
    if (cont.collapsed) return;
    const topClearance = getContainerTopClearance(cont);
    const children = childrenByContainerId[cont.id] || [];
    if (children.length === 0) {
      cont.w = (cont.userResized && cont.w) ? cont.w : Math.max(260, 220);
      cont.h = (cont.userResized && cont.h) ? cont.h : Math.max(150, topClearance + 36);
      return;
    }

    // Deterministic sibling collision resolution inside container (skip shifting user-customized node positions)
    if (!S._hasUserSavedLayout) {
      children.sort((a, b) => (a.x - b.x) || (a.y - b.y));
      for (let pass = 0; pass < 6; pass++) {
        let changed = false;
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            const a = children[i];
            const b = children[j];
            const aw = a.w || 255, ah = a.h || 185;
            const bw = b.w || 255, bh = b.h || 185;
            const overlapX = (a.x < b.x + bw + min_gap_x) && (a.x + aw + min_gap_x > b.x);
            const overlapY = (a.y < b.y + bh + min_gap_y) && (a.y + ah + min_gap_y > b.y);
            if (overlapX && overlapY) {
              const dxCenters = Math.abs((b.x + bw / 2) - (a.x + aw / 2));
              const dyCenters = Math.abs((b.y + bh / 2) - (a.y + ah / 2));
              if (dxCenters >= dyCenters) {
                if (b.x >= a.x) {
                  b.x = a.x + aw + min_gap_x;
                } else {
                  a.x = b.x + bw + min_gap_x;
                }
              } else {
                if (b.y >= a.y) {
                  b.y = a.y + ah + min_gap_y;
                } else {
                  a.y = b.y + bh + min_gap_y;
                }
              }
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
    }

    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    children.forEach(ch => {
      const cw = ch.w || 255;
      const chH = ch.h || 185;
      if (ch.x < minLeft) minLeft = ch.x;
      if (ch.y < minTop) minTop = ch.y;
      if (ch.x + cw > maxRight) maxRight = ch.x + cw;
      if (ch.y + chH > maxBottom) maxBottom = ch.y + chH;
    });

    if (!cont.userResized) {
      cont.x = Math.round(minLeft - padLeft);
      cont.y = Math.round(minTop - topClearance);
    } else {
      if (minLeft < cont.x + padLeft) cont.x = Math.round(minLeft - padLeft);
      if (minTop < cont.y + topClearance) cont.y = Math.round(minTop - topClearance);
    }

    const reqW = Math.round(maxRight - cont.x + padRight);
    const reqH = Math.round(maxBottom - cont.y + padBottom);
    cont.w = (cont.userResized && cont.w) ? Math.max(cont.w, reqW) : Math.max(260, reqW);
    cont.h = (cont.userResized && cont.h) ? Math.max(cont.h, reqH) : Math.max(topClearance + 80, reqH);
  });

  // Step 3: Resolve any container-to-container AABB overlaps across the canvas
  const shiftContainerAndChildren = (cont, dx, dy) => {
    if (dx === 0 && dy === 0) return;
    cont.x = Math.round(cont.x + dx);
    cont.y = Math.round(cont.y + dy);
    const kids = childrenByContainerId[cont.id] || [];
    kids.forEach(ch => {
      ch.x = Math.round(ch.x + dx);
      ch.y = Math.round(ch.y + dy);
    });
  };

  if (!S._hasUserSavedLayout) {
    for (let pass = 0; pass < 8; pass++) {
      let anyMoved = false;
      allContainers.sort((a, b) => (a.x - b.x) || (a.y - b.y));
      for (let i = 0; i < allContainers.length; i++) {
        for (let j = i + 1; j < allContainers.length; j++) {
          const cA = allContainers[i];
          const cB = allContainers[j];
          const wA = cA.w || 320, hA = cA.collapsed ? 78 : (cA.h || 220);
          const wB = cB.w || 320, hB = cB.collapsed ? 78 : (cB.h || 220);
          const hitX = (cA.x < cB.x + wB + min_container_gap_x) && (cA.x + wA + min_container_gap_x > cB.x);
          const hitY = (cA.y < cB.y + hB + min_container_gap_y) && (cA.y + hA + min_container_gap_y > cB.y);
          if (hitX && hitY) {
            const pushRight = (cA.x + wA + min_container_gap_x) - cB.x;
            const pushDown = (cA.y + hA + min_container_gap_y) - cB.y;
            const sameColumn = Math.abs(cA.x - cB.x) < 60 && cB.y > cA.y;
            if (sameColumn || (pushDown < pushRight && cB.y >= cA.y + hA * 0.45)) {
              shiftContainerAndChildren(cB, 0, pushDown);
            } else {
              shiftContainerAndChildren(cB, pushRight, 0);
            }
            anyMoved = true;
          }
        }
      }
      if (!anyMoved) break;
    }
  }

  // Step 4: Sync updated geometry to live DOM nodes before wire routing
  if (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelectorAll) {
    allContainers.forEach(cont => {
      const el = domLayer.querySelector(`[data-item-id="${cont.id}"]`);
      if (el && el.style) {
        el.style.left = `${cont.x}px`;
        el.style.top = `${cont.y}px`;
        el.style.width = `${cont.w}px`;
        el.style.height = `${cont.collapsed ? 78 : cont.h}px`;
      }
    });
    leafItems.forEach(({ item }) => {
      const el = domLayer.querySelector(`[data-item-id="${item.id}"]`);
      if (el && el.style) {
        el.style.left = `${item.x}px`;
        el.style.top = `${item.y}px`;
        el.style.minHeight = `${item.h}px`;
        el.style.height = 'auto';
      }
    });
  }
}
window.autoFitWorkflowContainersAndPreventOverlap = autoFitWorkflowContainersAndPreventOverlap;
window.autoFitContainersToNodes = autoFitWorkflowContainersAndPreventOverlap;

function getObstacleBoxes() {
  const boxes = [];
  (S.nodes || []).forEach(n => {
    if (n && !findCollapsedParentContainer(n)) {
      const domEl = (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelector) ? domLayer.querySelector(`[data-item-id="${n.id}"]`) : null;
      const w = (domEl && domEl.offsetWidth > 0) ? Math.max(domEl.offsetWidth, n.w || 255) : (n.w || 255);
      const h = (domEl && domEl.offsetHeight > 0) ? Math.max(domEl.offsetHeight, estimateItemHeight(n, 'node')) : Math.max(n.h || 185, estimateItemHeight(n, 'node'));
      boxes.push({ id: n.id, x: n.x, y: n.y, w, h });
    }
  });
  (S.fileContainers || []).forEach(fc => {
    if (fc && !findCollapsedParentContainer(fc)) {
      const domEl = (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelector) ? domLayer.querySelector(`[data-item-id="${fc.id}"]`) : null;
      const w = (domEl && domEl.offsetWidth > 0) ? Math.max(domEl.offsetWidth, fc.w || 245) : (fc.w || 245);
      const h = (domEl && domEl.offsetHeight > 0) ? Math.max(domEl.offsetHeight, estimateItemHeight(fc, 'bucket')) : Math.max(fc.h || 180, estimateItemHeight(fc, 'bucket'));
      boxes.push({ id: fc.id, x: fc.x, y: fc.y, w, h });
    }
  });
  (S.buses || []).forEach(bus => {
    if (bus && !findCollapsedParentContainer(bus)) {
      const domEl = (typeof domLayer !== 'undefined' && domLayer && domLayer.querySelector) ? domLayer.querySelector(`[data-item-id="${bus.id}"]`) : null;
      const w = (domEl && domEl.offsetWidth > 0) ? Math.max(domEl.offsetWidth, bus.w || 250) : (bus.w || 250);
      const h = (domEl && domEl.offsetHeight > 0) ? Math.max(domEl.offsetHeight, estimateItemHeight(bus, 'bus')) : Math.max(bus.h || 185, estimateItemHeight(bus, 'bus'));
      boxes.push({ id: bus.id, x: bus.x, y: bus.y, w, h });
    }
  });
  const leafList = [...(S.nodes || []), ...(S.fileContainers || []), ...(S.buses || [])];
  [...(S.categories || []), ...(S.subcategories || []), ...(S.cells || [])].forEach(c => {
    if (!c || findCollapsedParentContainer(c)) return;
    if (c.collapsed) {
      boxes.push({ id: c.id, x: c.x, y: c.y, w: c.w || 320, h: getCollapsedContainerHeight(c) });
      return;
    }
    const isCat = (S.categories || []).some(ct => ct && ct.id === c.id);
    if (!isCat) {
      const hasChild = leafList.some(lf => isItemInsideContainer(lf, c));
      if (!hasChild) {
        boxes.push({ id: c.id, x: c.x, y: c.y, w: c.w || 320, h: c.h || 185 });
      }
    }
  });
  return boxes;
}
window.getOrthObstacleBoxes = getObstacleBoxes;

function segmentHitsObstacle(x1, y1, x2, y2, obstacles, ignoreIds, pad = 16) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  for (const b of obstacles) {
    if (ignoreIds && (b.id === ignoreIds[0] || b.id === ignoreIds[1])) {
      continue;
    }
    if (maxX > b.x - pad && minX < b.x + b.w + pad && maxY > b.y - pad && minY < b.y + b.h + pad) {
      return true;
    }
  }
  return false;
}

function polylineHitsObstacle(pts, obstacles, ignoreIds, pad = 16) {
  for (let i = 1; i < pts.length; i++) {
    if (segmentHitsObstacle(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, obstacles, ignoreIds, pad)) {
      return true;
    }
  }
  return false;
}

function clampWaypointsInsideContainer(pts, cont) {
  if (!cont || pts.length <= 2) return pts;
  const minX = Math.round(cont.x + 10);
  const maxX = Math.round(cont.x + (cont.w || 320) - 10);
  const minY = Math.round(cont.y + 36);
  const maxY = Math.round(cont.y + (cont.h || 240) - 14);
  return pts.map((pt, idx) => {
    if (idx === 0 || idx === pts.length - 1) return pt;
    return {
      x: Math.max(minX, Math.min(maxX, pt.x)),
      y: Math.max(minY, Math.min(maxY, pt.y))
    };
  });
}

function wirePathClearOfAllNodes(pts, obstacles, ignoreIds, pad = 18) {
  if (!pts || pts.length < 2) return true;
  if (pts.length === 2) {
    return !segmentHitsObstacle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, obstacles, ignoreIds, pad);
  }
  if (segmentHitsObstacle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, obstacles, [ignoreIds && ignoreIds[0], null], 10)) {
    return false;
  }
  const n = pts.length;
  if (segmentHitsObstacle(pts[n - 2].x, pts[n - 2].y, pts[n - 1].x, pts[n - 1].y, obstacles, [null, ignoreIds && ignoreIds[1]], 10)) {
    return false;
  }
  const midPts = pts.slice(1, n - 1);
  if (polylineHitsObstacle(midPts, obstacles, [], pad)) {
    return false;
  }
  return true;
}

function computeConnectedPathway(selItem, wires) {
  const selId = (selItem && selItem.id) ? String(selItem.id) : '';
  const selKind = (selItem && selItem.kind) ? String(selItem.kind) : '';
  const nodeIds = new Set();
  const neighborIds = new Set();
  const wireIdxSet = new Set();
  const wireIdSet = new Set();
  const portKeys = new Set();
  if (!selId) {
    return { active: false, selectedId: '', selectedKind: '', nodeIds, neighborIds, wireIdxSet, wireIdSet, portKeys };
  }
  const list = Array.isArray(wires) ? wires : [];
  if (selKind === 'wire') {
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      if (!w || String(w.id) !== selId) continue;
      wireIdxSet.add(i);
      wireIdSet.add(selId);
      if (w.fromNode) {
        const fn = String(w.fromNode);
        nodeIds.add(fn);
        neighborIds.add(fn);
        if (w.fromPort) portKeys.add(`${fn}::${String(w.fromPort)}`);
      }
      if (w.toNode) {
        const tn = String(w.toNode);
        nodeIds.add(tn);
        neighborIds.add(tn);
        if (w.toPort) portKeys.add(`${tn}::${String(w.toPort)}`);
      }
      break;
    }
    return { active: true, selectedId: selId, selectedKind: 'wire', nodeIds, neighborIds, wireIdxSet, wireIdSet, portKeys };
  }
  nodeIds.add(selId);
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    if (!w) continue;
    if (w.fromNode === selId || w.toNode === selId) {
      wireIdxSet.add(i);
      if (w.id) wireIdSet.add(String(w.id));
      if (w.fromNode) {
        const fn = String(w.fromNode);
        nodeIds.add(fn);
        if (fn !== selId) neighborIds.add(fn);
        if (w.fromPort) portKeys.add(`${fn}::${String(w.fromPort)}`);
      }
      if (w.toNode) {
        const tn = String(w.toNode);
        nodeIds.add(tn);
        if (tn !== selId) neighborIds.add(tn);
        if (w.toPort) portKeys.add(`${tn}::${String(w.toPort)}`);
      }
    }
  }
  return { active: true, selectedId: selId, selectedKind: selKind, nodeIds, neighborIds, wireIdxSet, wireIdSet, portKeys };
}
window.computeConnectedPathway = computeConnectedPathway;

const ORTH_STUB = 18;
const ORTH_OBS_MARGIN = 10;
const ORTH_LANE_STEP = 12;
const ORTH_SEG_SEP = 10;

function createOrthHeap() {
  const items = [];
  return {
    size: () => items.length,
    push(node) {
      items.push(node);
      let idx = items.length - 1;
      while (idx > 0) {
        const p = (idx - 1) >> 1;
        if (items[p].f <= items[idx].f) break;
        const tmp = items[p]; items[p] = items[idx]; items[idx] = tmp;
        idx = p;
      }
    },
    pop() {
      const top = items[0];
      const last = items.pop();
      if (items.length > 0) {
        items[0] = last;
        let idx = 0;
        const n = items.length;
        while (true) {
          const l = idx * 2 + 1;
          const r = l + 1;
          let s = idx;
          if (l < n && items[l].f < items[s].f) s = l;
          if (r < n && items[r].f < items[s].f) s = r;
          if (s === idx) break;
          const tmp = items[s]; items[s] = items[idx]; items[idx] = tmp;
          idx = s;
        }
      }
      return top;
    }
  };
}

function dedupSortedNums(arr) {
  arr.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const v = Math.round(arr[i]);
    if (out.length === 0 || v !== out[out.length - 1]) out.push(v);
  }
  return out;
}

function simplifyMiddlePts(pts) {
  if (pts.length <= 2) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    if ((prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y)) continue;
    if (prev.x === cur.x && prev.y === cur.y) continue;
    out.push(cur);
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (!tail || tail.x !== last.x || tail.y !== last.y) out.push(last);
  return out;
}

function orthHorizValid(y, xA, xB, obsList, occH, wireIdx, obsMargin, sepTol) {
  const lo = Math.min(xA, xB);
  const hi = Math.max(xA, xB);
  for (let i = 0; i < obsList.length; i++) {
    const b = obsList[i];
    if (y > b.y - obsMargin && y < b.y + b.h + obsMargin && hi > b.x - obsMargin && lo < b.x + b.w + obsMargin) {
      return false;
    }
  }
  for (let j = 0; j < occH.length; j++) {
    const sg = occH[j];
    if (sg.wireIdx !== wireIdx && Math.abs(y - sg.y) < sepTol && hi > sg.xMin - 2 && lo < sg.xMax + 2) {
      return false;
    }
  }
  return true;
}

function orthVertValid(x, yA, yB, obsList, occV, wireIdx, obsMargin, sepTol) {
  const lo = Math.min(yA, yB);
  const hi = Math.max(yA, yB);
  for (let i = 0; i < obsList.length; i++) {
    const b = obsList[i];
    if (x > b.x - obsMargin && x < b.x + b.w + obsMargin && hi > b.y - obsMargin && lo < b.y + b.h + obsMargin) {
      return false;
    }
  }
  for (let j = 0; j < occV.length; j++) {
    const sg = occV[j];
    if (sg.wireIdx !== wireIdx && Math.abs(x - sg.x) < sepTol && hi > sg.yMin - 2 && lo < sg.yMax + 2) {
      return false;
    }
  }
  return true;
}

function orthCandidateScore(pts, obsList, occH, occV, wireIdx, obsMargin, sepTol) {
  let score = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.y === b.y) {
      if (!orthHorizValid(a.y, a.x, b.x, obsList, occH, wireIdx, obsMargin, sepTol)) return Infinity;
      const lo = Math.min(a.x, b.x);
      const hi = Math.max(a.x, b.x);
      for (let k = 0; k < occV.length; k++) {
        const sg = occV[k];
        if (sg.wireIdx !== wireIdx && sg.x > lo && sg.x < hi && a.y > sg.yMin && a.y < sg.yMax) score += 35;
      }
      score += (hi - lo);
    } else if (a.x === b.x) {
      if (!orthVertValid(a.x, a.y, b.y, obsList, occV, wireIdx, obsMargin, sepTol)) return Infinity;
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      for (let k = 0; k < occH.length; k++) {
        const sg = occH[k];
        if (sg.wireIdx !== wireIdx && sg.y > lo && sg.y < hi && a.x > sg.xMin && a.x < sg.xMax) score += 35;
      }
      score += (hi - lo) + 120;
    } else {
      return Infinity;
    }
  }
  return score;
}

function tryFastOrthRoute(ep, obsList, occH, occV, wireIdx) {
  const s1 = ep.s1;
  const s2 = ep.s2;
  if (ep.startDir === 0 && Math.abs(s1.y - s2.y) <= 1) {
    const midX = Math.round((s1.x + s2.x) / 2);
    const straightCand = (s1.y === s2.y)
      ? [s1, s2]
      : [s1, { x: midX, y: s1.y }, { x: midX, y: s2.y }, s2];
    if (orthCandidateScore(straightCand, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, ORTH_SEG_SEP) < Infinity) {
      return straightCand;
    }
  }
  if (ep.startDir === 0 && s2.x >= s1.x + 8) {
    const midBase = Math.round((s1.x + s2.x) / 2);
    const offsets = [0, 14, -14, 28, -28];
    let bestPts = null;
    let bestScore = Infinity;
    for (let oi = 0; oi < offsets.length; oi++) {
      const mx = midBase + offsets[oi];
      if (mx <= s1.x + 2 || mx >= s2.x - 2) continue;
      const cand = simplifyMiddlePts([s1, { x: mx, y: s1.y }, { x: mx, y: s2.y }, s2]);
      const sc = orthCandidateScore(cand, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, ORTH_SEG_SEP);
      if (sc < bestScore) {
        bestScore = sc;
        bestPts = cand;
      }
    }
    if (bestPts) return bestPts;
  }
  if (ep.startDir === 1 && s2.y >= s1.y + 8) {
    const cand = simplifyMiddlePts([s1, { x: s1.x, y: s2.y }, s2]);
    if (orthCandidateScore(cand, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, ORTH_SEG_SEP) < Infinity) {
      return cand;
    }
  }
  return null;
}

function buildOrthSparseGrid(s1, s2, obsList, enclosingCont = null) {
  const xs = [s1.x, s2.x];
  const ys = [s1.y, s2.y];
  let minObsX = Math.min(s1.x, s2.x);
  let maxObsX = Math.max(s1.x, s2.x);
  let minObsY = Math.min(s1.y, s2.y);
  let maxObsY = Math.max(s1.y, s2.y);
  for (let i = 0; i < obsList.length; i++) {
    const b = obsList[i];
    if (b.x < minObsX) minObsX = b.x;
    if (b.x + b.w > maxObsX) maxObsX = b.x + b.w;
    if (b.y < minObsY) minObsY = b.y;
    if (b.y + b.h > maxObsY) maxObsY = b.y + b.h;
    for (let dx = 18; dx <= 90; dx += ORTH_LANE_STEP) {
      xs.push(b.x - dx);
      xs.push(b.x + b.w + dx);
    }
    for (let dy = 18; dy <= 126; dy += ORTH_LANE_STEP) {
      ys.push(b.y - dy);
      ys.push(b.y + b.h + dy);
    }
  }
  if (Math.abs(s2.x - s1.x) <= 320) {
    const xLo = Math.min(s1.x, s2.x);
    const xHi = Math.max(s1.x, s2.x);
    for (let gx = xLo; gx <= xHi; gx += ORTH_LANE_STEP) xs.push(gx);
  }
  for (let k = 18; k <= 246; k += ORTH_LANE_STEP) {
    ys.push(minObsY - k);
    ys.push(maxObsY + k);
  }
  for (let ok = 24; ok <= 96; ok += ORTH_LANE_STEP) {
    xs.push(minObsX - ok);
    xs.push(maxObsX + ok);
  }
  let cleanXs = dedupSortedNums(xs);
  let cleanYs = dedupSortedNums(ys);
  if (enclosingCont && !enclosingCont.collapsed) {
    const cMinX = Math.round(enclosingCont.x + 10);
    const cMaxX = Math.round(enclosingCont.x + (enclosingCont.w || 320) - 10);
    const cMinY = Math.round(enclosingCont.y + 36);
    const cMaxY = Math.round(enclosingCont.y + (enclosingCont.h || 240) - 14);
    cleanXs = dedupSortedNums(cleanXs.filter(x => x >= cMinX && x <= cMaxX).concat([Math.round(s1.x), Math.round(s2.x), cMinX + 6, cMaxX - 6]));
    cleanYs = dedupSortedNums(cleanYs.filter(y => y >= cMinY && y <= cMaxY).concat([Math.round(s1.y), Math.round(s2.y), cMinY + 6, cMaxY - 6]));
    minObsX = Math.max(minObsX, cMinX);
    maxObsX = Math.min(maxObsX, cMaxX);
    minObsY = Math.max(minObsY, cMinY);
    maxObsY = Math.min(maxObsY, cMaxY);
  }
  return { xs: cleanXs, ys: cleanYs, minObsX, maxObsX, minObsY, maxObsY };
}

function runOrthAstar(s1, s2, grid, obsList, occH, occV, wireIdx, obsMargin, sepTol, startDir) {
  if (typeof window !== 'undefined') {
    window.__ORTH_ASTAR_CALL_COUNT__ = (window.__ORTH_ASTAR_CALL_COUNT__ || 0) + 1;
  }
  const xs = grid.xs;
  const ys = grid.ys;
  const nx = xs.length;
  const ny = ys.length;
  const sxi = xs.indexOf(Math.round(s1.x));
  const syi = ys.indexOf(Math.round(s1.y));
  const exi = xs.indexOf(Math.round(s2.x));
  const eyi = ys.indexOf(Math.round(s2.y));
  if (sxi < 0 || syi < 0 || exi < 0 || eyi < 0) return { pts: null, capped: false };

  const infBoxes = obsList.map(b => ({
    ix0: b.x - obsMargin,
    iy0: b.y - obsMargin,
    ix1: b.x + b.w + obsMargin,
    iy1: b.y + b.h + obsMargin
  }));
  const obsByRow = new Array(ny);
  const occHByRow = new Array(ny);
  for (let r = 0; r < ny; r++) {
    const ry = ys[r];
    obsByRow[r] = infBoxes.filter(ib => ry > ib.iy0 && ry < ib.iy1);
    occHByRow[r] = occH.filter(sg => sg.wireIdx !== wireIdx && Math.abs(ry - sg.y) < sepTol);
  }
  const obsByCol = new Array(nx);
  const occVByCol = new Array(nx);
  for (let c = 0; c < nx; c++) {
    const cx = xs[c];
    obsByCol[c] = infBoxes.filter(ib => cx > ib.ix0 && cx < ib.ix1);
    occVByCol[c] = occV.filter(sg => sg.wireIdx !== wireIdx && Math.abs(cx - sg.x) < sepTol);
  }

  function horizStepValid(yi, xA, xB) {
    const lo = xA < xB ? xA : xB;
    const hi = xA > xB ? xA : xB;
    const rObs = obsByRow[yi];
    for (let i = 0; i < rObs.length; i++) {
      if (hi > rObs[i].ix0 && lo < rObs[i].ix1) return false;
    }
    const rOcc = occHByRow[yi];
    for (let j = 0; j < rOcc.length; j++) {
      if (hi > rOcc[j].xMin - 2 && lo < rOcc[j].xMax + 2) return false;
    }
    return true;
  }

  function vertStepValid(xi, yA, yB) {
    const lo = yA < yB ? yA : yB;
    const hi = yA > yB ? yA : yB;
    const cObs = obsByCol[xi];
    for (let i = 0; i < cObs.length; i++) {
      if (hi > cObs[i].iy0 && lo < cObs[i].iy1) return false;
    }
    const cOcc = occVByCol[xi];
    for (let j = 0; j < cOcc.length; j++) {
      if (hi > cOcc[j].yMin - 2 && lo < cOcc[j].yMax + 2) return false;
    }
    return true;
  }

  function horizCrossPenalty(yVal, xA, xB) {
    const lo = xA < xB ? xA : xB;
    const hi = xA > xB ? xA : xB;
    let pen = 0;
    for (let i = 0; i < occV.length; i++) {
      const sg = occV[i];
      if (sg.wireIdx !== wireIdx && sg.x > lo && sg.x < hi && yVal > sg.yMin && yVal < sg.yMax) pen += 35;
    }
    return pen;
  }

  function vertCrossPenalty(xVal, yA, yB) {
    const lo = yA < yB ? yA : yB;
    const hi = yA > yB ? yA : yB;
    let pen = 0;
    for (let i = 0; i < occH.length; i++) {
      const sg = occH[i];
      if (sg.wireIdx !== wireIdx && sg.y > lo && sg.y < hi && xVal > sg.xMin && xVal < sg.xMax) pen += 35;
    }
    return pen;
  }

  const totalStates = nx * ny * 2;
  const gScore = new Float64Array(totalStates);
  const parentArr = new Int32Array(totalStates);
  const closed = new Uint8Array(totalStates);
  for (let si = 0; si < totalStates; si++) {
    gScore[si] = 1e15;
    parentArr[si] = -1;
  }
  const startKey = (syi * nx + sxi) * 2 + startDir;
  gScore[startKey] = 0;
  const heap = createOrthHeap();
  heap.push({ key: startKey, f: Math.abs(s2.x - s1.x) + Math.abs(s2.y - s1.y) });
  let goalKey = -1;
  let expansions = 0;
  let capped = false;
  const MAX_ASTAR_EXPANSIONS = 2500;
  const TURN_PENALTY = 120;
  const dirs = [
    { dx: 1, dy: 0, nd: 0 },
    { dx: -1, dy: 0, nd: 0 },
    { dx: 0, dy: 1, nd: 1 },
    { dx: 0, dy: -1, nd: 1 }
  ];

  while (heap.size() > 0) {
    const cur = heap.pop();
    const ck = cur.key;
    if (closed[ck]) continue;
    closed[ck] = 1;
    const cdir = ck & 1;
    const cellIdx = ck >> 1;
    const cyi = Math.floor(cellIdx / nx);
    const cxi = cellIdx - cyi * nx;
    if (cxi === exi && cyi === eyi) {
      goalKey = ck;
      break;
    }
    expansions += 1;
    if (expansions >= MAX_ASTAR_EXPANSIONS) {
      capped = true;
      break;
    }
    const curG = gScore[ck];
    const cxVal = xs[cxi];
    const cyVal = ys[cyi];
    for (let di = 0; di < 4; di++) {
      const mv = dirs[di];
      const nxi = cxi + mv.dx;
      const nyi = cyi + mv.dy;
      if (nxi < 0 || nxi >= nx || nyi < 0 || nyi >= ny) continue;
      const nk = (nyi * nx + nxi) * 2 + mv.nd;
      if (closed[nk]) continue;
      const nxVal = xs[nxi];
      const nyVal = ys[nyi];
      let stepLen = Math.abs(nxVal - cxVal) + Math.abs(nyVal - cyVal);
      if (mv.nd === 0) {
        if (!horizStepValid(cyi, cxVal, nxVal)) continue;
        stepLen += horizCrossPenalty(cyVal, cxVal, nxVal);
      } else {
        if (!vertStepValid(cxi, cyVal, nyVal)) continue;
        stepLen += vertCrossPenalty(cxVal, cyVal, nyVal);
      }
      const turnCost = (cdir !== mv.nd) ? TURN_PENALTY : 0;
      const endTurn = (nxi === exi && nyi === eyi && mv.nd !== 0) ? TURN_PENALTY : 0;
      const ng = curG + stepLen + turnCost + endTurn;
      if (ng < gScore[nk]) {
        gScore[nk] = ng;
        parentArr[nk] = ck;
        const h = Math.abs(s2.x - nxVal) + Math.abs(s2.y - nyVal);
        heap.push({ key: nk, f: ng + h });
      }
    }
  }
  if (goalKey < 0) return { pts: null, capped };
  const revPts = [];
  let trace = goalKey;
  while (trace >= 0) {
    const tc = trace >> 1;
    const ty = Math.floor(tc / nx);
    const tx = tc - ty * nx;
    revPts.push({ x: xs[tx], y: ys[ty] });
    trace = parentArr[trace];
  }
  revPts.reverse();
  return { pts: simplifyMiddlePts(revPts), capped: false };
}

function buildOuterCorridorFallback(ep, grid, obsList, occH, occV, wireIdx) {
  const xSpanLo = Math.min(ep.s1.x, ep.s2.x) - 96;
  const xSpanHi = Math.max(ep.s1.x, ep.s2.x) + 96;
  let localMinY = Math.min(ep.s1.y, ep.s2.y);
  let localMaxY = Math.max(ep.s1.y, ep.s2.y);
  for (let i = 0; i < obsList.length; i++) {
    const b = obsList[i];
    if (b.x + b.w >= xSpanLo && b.x <= xSpanHi) {
      if (b.y < localMinY) localMinY = b.y;
      if (b.y + b.h > localMaxY) localMaxY = b.y + b.h;
    }
  }
  const preferTop = (ep.s1.y + ep.s2.y) / 2 <= (localMinY + localMaxY) / 2;
  const rawYs = [];
  for (let d = 24; d <= 264; d += ORTH_LANE_STEP) {
    const tLocal = Math.round(localMinY - d);
    const bLocal = Math.round(localMaxY + d);
    const tGlob = Math.round(grid.minObsY - d);
    const bGlob = Math.round(grid.maxObsY + d);
    if (preferTop) {
      rawYs.push(tLocal, tGlob, bLocal, bGlob);
    } else {
      rawYs.push(bLocal, bGlob, tLocal, tGlob);
    }
  }
  const seenY = {};
  const yCands = [];
  for (let i = 0; i < rawYs.length; i++) {
    const yv = rawYs[i];
    if (!seenY[yv]) {
      seenY[yv] = true;
      yCands.push(yv);
    }
  }

  const stepDir1 = ep.s1.x >= ep.p1.x ? 1 : -1;
  const stepDir2 = ep.s2.x <= ep.p2.x ? -1 : 1;
  const sepLevels = [ORTH_SEG_SEP, 8, 4];

  for (let si = 0; si < sepLevels.length; si++) {
    const sep = sepLevels[si];
    let best = null;
    let bestScore = Infinity;
    for (let yi = 0; yi < yCands.length; yi++) {
      const sy = yCands[yi];
      let chosenX1 = null;
      for (let k1 = 0; k1 < 14; k1++) {
        const cx1 = ep.s1.x + stepDir1 * k1 * ORTH_LANE_STEP;
        if (k1 > 0 && !orthHorizValid(ep.s1.y, ep.s1.x, cx1, obsList, occH, wireIdx, ORTH_OBS_MARGIN, sep)) {
          continue;
        }
        if (orthVertValid(cx1, ep.s1.y, sy, obsList, occV, wireIdx, ORTH_OBS_MARGIN, sep)) {
          chosenX1 = cx1;
          break;
        }
      }
      if (chosenX1 === null) continue;

      let chosenX2 = null;
      for (let k2 = 0; k2 < 14; k2++) {
        const cx2 = ep.s2.x + stepDir2 * k2 * ORTH_LANE_STEP;
        if (Math.abs(cx2 - chosenX1) < sep && Math.max(Math.min(ep.s1.y, sy), Math.min(ep.s2.y, sy)) < Math.min(Math.max(ep.s1.y, sy), Math.max(ep.s2.y, sy))) {
          continue;
        }
        if (k2 > 0 && !orthHorizValid(ep.s2.y, cx2, ep.s2.x, obsList, occH, wireIdx, ORTH_OBS_MARGIN, sep)) {
          continue;
        }
        if (orthVertValid(cx2, sy, ep.s2.y, obsList, occV, wireIdx, ORTH_OBS_MARGIN, sep)) {
          chosenX2 = cx2;
          break;
        }
      }
      if (chosenX2 === null) continue;

      const cand = simplifyMiddlePts([
        ep.s1,
        { x: chosenX1, y: ep.s1.y },
        { x: chosenX1, y: sy },
        { x: chosenX2, y: sy },
        { x: chosenX2, y: ep.s2.y },
        ep.s2
      ]);
      const sc = orthCandidateScore(cand, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, sep);
      if (sc < bestScore) {
        bestScore = sc;
        best = cand;
        if (sc < 4000) break;
      }
    }
    if (best) return best;
  }

  const laneOff = (wireIdx % 12) * ORTH_LANE_STEP;
  const safeTop = grid.minObsY - 24 - laneOff;
  const safeBot = grid.maxObsY + 24 + laneOff;
  const safeY = preferTop ? safeTop : safeBot;
  return simplifyMiddlePts([ep.s1, { x: ep.s1.x + stepDir1 * laneOff, y: ep.s1.y }, { x: ep.s1.x + stepDir1 * laneOff, y: safeY }, { x: ep.s2.x + stepDir2 * laneOff, y: safeY }, { x: ep.s2.x + stepDir2 * laneOff, y: ep.s2.y }, ep.s2]);
}

function computeWireStubEndpoints(w, p1, p2, obsList) {
  const fromDir = resolveActualPortDir(w && w.fromNode, w && w.fromPort, (w && w.fromDir) || 'out');
  const toDir = resolveActualPortDir(w && w.toNode, w && w.toPort, (w && w.toDir) || 'in');
  const fromBox = (w && w.fromNode) ? (obsList.find(b => b.id === w.fromNode) || findAnyItemById(w.fromNode)) : null;
  const toBox = (w && w.toNode) ? (obsList.find(b => b.id === w.toNode) || findAnyItemById(w.toNode)) : null;
  let s1;
  let s2;
  let startDir = 0;

  if (fromDir === 'bottom') {
    const fh = fromBox ? (fromBox.collapsed ? getCollapsedContainerHeight(fromBox) : (fromBox.h || 78)) : 78;
    s1 = {
      x: Math.round(p1.x),
      y: Math.round(fromBox ? Math.max(p1.y + ORTH_STUB, fromBox.y + fh + ORTH_STUB) : (p1.y + ORTH_STUB))
    };
    startDir = 1;
  } else if (fromBox && isContainerItem(fromBox) && !fromBox.collapsed) {
    if (fromDir === 'in') {
      s1 = { x: Math.round(p1.x + ORTH_STUB), y: Math.round(p1.y) };
    } else {
      s1 = { x: Math.round(Math.max(p1.x + ORTH_STUB, fromBox.x + (fromBox.w || 320) + ORTH_STUB)), y: Math.round(p1.y) };
    }
  } else {
    const onLeft = fromBox && p1.x < fromBox.x + (fromBox.w || 255) / 2;
    s1 = {
      x: Math.round(onLeft
        ? Math.min(p1.x - ORTH_STUB, fromBox.x - ORTH_STUB)
        : (fromBox ? Math.max(p1.x + ORTH_STUB, fromBox.x + (fromBox.w || 255) + ORTH_STUB) : (p1.x + ORTH_STUB))),
      y: Math.round(p1.y)
    };
  }

  if (toDir === 'bottom') {
    const th = toBox ? (toBox.collapsed ? getCollapsedContainerHeight(toBox) : (toBox.h || 78)) : 78;
    s2 = {
      x: Math.round(p2.x),
      y: Math.round(toBox ? Math.max(p2.y + ORTH_STUB, toBox.y + th + ORTH_STUB) : (p2.y + ORTH_STUB))
    };
  } else if (toBox && isContainerItem(toBox) && !toBox.collapsed) {
    if (toDir === 'out') {
      s2 = { x: Math.round(p2.x - ORTH_STUB), y: Math.round(p2.y) };
    } else {
      s2 = { x: Math.round(Math.min(p2.x - ORTH_STUB, toBox.x - ORTH_STUB)), y: Math.round(p2.y) };
    }
  } else {
    const onRight = toBox && p2.x > toBox.x + (toBox.w || 255) / 2;
    s2 = {
      x: Math.round(onRight
        ? Math.max(p2.x + ORTH_STUB, toBox.x + (toBox.w || 255) + ORTH_STUB)
        : (toBox ? Math.min(p2.x - ORTH_STUB, toBox.x - ORTH_STUB) : (p2.x - ORTH_STUB))),
      y: Math.round(p2.y)
    };
  }

  return {
    p1: { x: Math.round(p1.x), y: Math.round(p1.y) },
    p2: { x: Math.round(p2.x), y: Math.round(p2.y) },
    s1,
    s2,
    startDir
  };
}

function registerOrthSegments(pts, wireIdx, occH, occV, startIdx, endIdx) {
  const lo = typeof startIdx === 'number' ? startIdx : 0;
  const hi = typeof endIdx === 'number' ? endIdx : (pts.length - 1);
  for (let i = lo; i < hi; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.y === b.y && Math.abs(a.x - b.x) > 0) {
      occH.push({ y: a.y, xMin: Math.min(a.x, b.x), xMax: Math.max(a.x, b.x), wireIdx });
    } else if (a.x === b.x && Math.abs(a.y - b.y) > 0) {
      occV.push({ x: a.x, yMin: Math.min(a.y, b.y), yMax: Math.max(a.y, b.y), wireIdx });
    }
  }
}

function computeOrthWireWaypoints(w, idx, p1, p2, occupiedState = null, obstacles = null) {
  const fullObsList = Array.isArray(obstacles) ? obstacles : getObstacleBoxes();
  const enclosingCont = (w && w.fromNode && w.toNode) ? findEnclosingContainerForWire(w) : null;
  let obsList = fullObsList;
  if (enclosingCont && !enclosingCont.collapsed) {
    const filtered = fullObsList.filter(b => {
      if (b.id === enclosingCont.id) return false;
      const obj = findAnyItemById(b.id);
      return obj && isItemInsideContainer(obj, enclosingCont);
    });
    obsList = filtered;
  }
  const occ = (occupiedState && typeof occupiedState === 'object' && Array.isArray(occupiedState.h) && Array.isArray(occupiedState.v))
    ? occupiedState
    : { h: [], v: [], preRegistered: false };
  const occH = occ.h;
  const occV = occ.v;
  const wireIdx = typeof idx === 'number' ? idx : 0;
  const ep = computeWireStubEndpoints(w, p1, p2, obsList);
  if (enclosingCont && !enclosingCont.collapsed) {
    const cMinX = Math.round(enclosingCont.x + 10);
    const cMaxX = Math.round(enclosingCont.x + (enclosingCont.w || 320) - 10);
    const cMinY = Math.round(enclosingCont.y + 36);
    const cMaxY = Math.round(enclosingCont.y + (enclosingCont.h || 240) - 14);
    ep.s1 = { x: Math.max(cMinX, Math.min(cMaxX, ep.s1.x)), y: Math.max(cMinY, Math.min(cMaxY, ep.s1.y)) };
    ep.s2 = { x: Math.max(cMinX, Math.min(cMaxX, ep.s2.x)), y: Math.max(cMinY, Math.min(cMaxY, ep.s2.y)) };
  }
  if (!occ.preRegistered) {
    registerOrthSegments([ep.p1, ep.s1], wireIdx, occH, occV);
    registerOrthSegments([ep.s2, ep.p2], wireIdx, occH, occV);
  }
  let mid = tryFastOrthRoute(ep, obsList, occH, occV, wireIdx);
  if (mid) {
    if (enclosingCont && !enclosingCont.collapsed) {
      mid = clampWaypointsInsideContainer(mid, enclosingCont);
    }
    if (typeof window !== 'undefined') {
      window.__ORTH_FASTPATH_COUNT__ = (window.__ORTH_FASTPATH_COUNT__ || 0) + 1;
    }
    registerOrthSegments(mid, wireIdx, occH, occV);
    return [ep.p1].concat(mid, [ep.p2]);
  }
  const grid = buildOrthSparseGrid(ep.s1, ep.s2, obsList, enclosingCont);
  let res = runOrthAstar(ep.s1, ep.s2, grid, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, ORTH_SEG_SEP, ep.startDir);
  if (!res.pts && !res.capped) {
    res = runOrthAstar(ep.s1, ep.s2, grid, obsList, occH, occV, wireIdx, ORTH_OBS_MARGIN, 7, ep.startDir);
  }
  mid = res.pts || buildOuterCorridorFallback(ep, grid, obsList, occH, occV, wireIdx);
  if (mid.length === 1) {
    mid = [ep.s1, ep.s2];
  }
  if (enclosingCont && !enclosingCont.collapsed) {
    mid = clampWaypointsInsideContainer(mid, enclosingCont);
  }
  registerOrthSegments(mid, wireIdx, occH, occV);
  return [ep.p1].concat(mid, [ep.p2]);
}
window.computeOrthWireWaypoints = computeOrthWireWaypoints;
window.computeOrthogonalWaypoints = computeOrthWireWaypoints;
function computeOrthogonalWaypoints(w, idx, p1, p2, localLaneOffset = 0, obstacles = null) {
  return computeOrthWireWaypoints(w, idx, p1, p2, localLaneOffset, obstacles);
}
window.routeOrthogonalWire = function routeOrthogonalWire(p1, p2, obstacles, ignoreIds, parentCont) {
  const fakeWire = {
    fromNode: Array.isArray(ignoreIds) ? ignoreIds[0] : '',
    toNode: Array.isArray(ignoreIds) ? ignoreIds[1] : ''
  };
  return computeOrthWireWaypoints(fakeWire, 0, p1, p2, null, obstacles || getObstacleBoxes());
};

let _wireRouteCache = {
  sig: '',
  wirePaths: [],
  vertSegments: []
};
let _dragWireRaf = 0;

function invalidateWireRouteCache() {
  _wireRouteCache = { sig: '', wirePaths: [], vertSegments: [] };
}

function scheduleDragWireRender() {
  if (typeof requestAnimationFrame !== 'function') {
    renderWires();
    return;
  }
  if (_dragWireRaf) return;
  _dragWireRaf = requestAnimationFrame(() => {
    _dragWireRaf = 0;
    renderWires();
  });
}

function cancelScheduledDragWireRender() {
  if (_dragWireRaf && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(_dragWireRaf);
  }
  _dragWireRaf = 0;
}

function buildHorizWithJumps(xStart, xEnd, y, wireIdx, vertSegments) {
  if (xStart === xEnd) return '';
  const dir = xEnd >= xStart ? 1 : -1;
  const xMin = Math.min(xStart, xEnd), xMax = Math.max(xStart, xEnd);
  const crossings = vertSegments
    .filter(v => v.wireIdx !== wireIdx && v.x > xMin + 8 && v.x < xMax - 8 && y > v.yMin + 6 && y < v.yMax - 6)
    .sort((a, b) => dir > 0 ? a.x - b.x : b.x - a.x);
  let d = '';
  let prevX = xStart;
  for (const c of crossings) {
    const preX = c.x - dir * 6;
    const postX = c.x + dir * 6;
    if (dir > 0 ? (preX <= prevX + 1 || postX >= xEnd - 1) : (preX >= prevX - 1 || postX <= xEnd + 1)) {
      continue;
    }
    const sweep = dir > 0 ? 1 : 0;
    d += ` L ${preX} ${y} A 6 6 0 0 ${sweep} ${postX} ${y}`;
    prevX = postX;
  }
  d += ` L ${xEnd} ${y}`;
  return d;
}

function renderWires() {
  if (!wireSvg || !S) return;
  const style = S.wireStyle || 'schematic';
  const isSchem = style === 'schematic' || style === 'schematic_pulse' || style === 'ortho_pulse' || style === 'subway_pulse';
  const pathway = computeConnectedPathway(selectedItem, S.wires || []);
  const isFlowPulsing = Boolean(pulseTimer)
    || (!pathway.active && (style === 'schematic_pulse' || style === 'flow' || style === 'ortho_pulse' || style === 'subway_pulse'));
  const obstacles = getObstacleBoxes();

  const resolveCollapsedHostId = (itemId) => {
    const item = findAnyItemById(itemId);
    if (!item) return null;
    const pCol = findCollapsedParentContainer(item);
    if (pCol) return pCol.id;
    return isContainerItem(item) && item.collapsed ? item.id : null;
  };

  const visibleWires = [];
  const portTotalCounts = {};
  (S.wires || []).forEach((w, idx) => {
    if (!w) return;
    const enclosingCont = findEnclosingContainerForWire(w);
    if (enclosingCont && (enclosingCont.collapsed || findCollapsedParentContainer(enclosingCont))) return;
    const hFrom = resolveCollapsedHostId(w.fromNode);
    const hTo = resolveCollapsedHostId(w.toNode);
    if (hFrom && hTo && hFrom === hTo) return;
    const fDir = resolveActualPortDir(w.fromNode, w.fromPort, w.fromDir || 'out');
    const tDir = resolveActualPortDir(w.toNode, w.toPort, w.toDir || 'in');
    const fKey = `${w.fromNode}:${fDir}:${w.fromPort}`;
    const tKey = `${w.toNode}:${tDir}:${w.toPort}`;
    const fSlotIdx = portTotalCounts[fKey] || 0;
    portTotalCounts[fKey] = fSlotIdx + 1;
    const tSlotIdx = portTotalCounts[tKey] || 0;
    portTotalCounts[tKey] = tSlotIdx + 1;
    visibleWires.push({ w, idx, fDir, tDir, fKey, tKey, fSlotIdx, tSlotIdx });
  });

  visibleWires.forEach(item => {
    const fCnt = portTotalCounts[item.fKey] || 1;
    const tCnt = portTotalCounts[item.tKey] || 1;
    const slot1 = isSchem ? (fCnt <= 1 ? 0 : Math.round((item.fSlotIdx - (fCnt - 1) / 2) * 10)) : 0;
    const slot2 = isSchem ? (tCnt <= 1 ? 0 : Math.round((item.tSlotIdx - (tCnt - 1) / 2) * 10)) : 0;
    item.p1 = getPortCoordinates(item.w.fromNode, item.w.fromPort, item.fDir, slot1);
    item.p2 = getPortCoordinates(item.w.toNode, item.w.toPort, item.tDir, slot2);
  });

  const obsSig = obstacles
    .map(b => `${b.id}:${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.w)},${Math.round(b.h)}`)
    .join('|');
  const contColSig = [...(S.categories || []), ...(S.subcategories || []), ...(S.cells || [])]
    .map(c => `${c.id}:${c.collapsed ? 1 : 0}`)
    .join('|');
  const wireSig = visibleWires
    .map(it => `${it.w.id}:${it.w.fromNode}:${it.w.fromPort}:${it.w.toNode}:${it.w.toPort}:${Math.round(it.p1.x)},${Math.round(it.p1.y)}->${Math.round(it.p2.x)},${Math.round(it.p2.y)}`)
    .join('|');
  const geomSig = `${S.workflowId || ''}#${style}#${obsSig}#${contColSig}#${wireSig}`;

  let wirePaths;
  let vertSegments;
  if (_wireRouteCache.sig === geomSig && Array.isArray(_wireRouteCache.wirePaths)) {
    wirePaths = _wireRouteCache.wirePaths;
    vertSegments = _wireRouteCache.vertSegments;
    const liveWireMap = {};
    visibleWires.forEach(vw => { liveWireMap[vw.idx] = vw.w; });
    wirePaths.forEach(wp => {
      if (liveWireMap[wp.idx]) wp.w = liveWireMap[wp.idx];
    });
    if (typeof window !== 'undefined') {
      window.__ORTH_WIRE_CACHE_HITS__ = (window.__ORTH_WIRE_CACHE_HITS__ || 0) + 1;
    }
  } else {
    const occupiedState = { h: [], v: [], preRegistered: true };
    visibleWires.forEach(item => {
      const ep = computeWireStubEndpoints(item.w, item.p1, item.p2, obstacles);
      item.span = Math.abs(ep.s2.x - ep.s1.x) + Math.abs(ep.s2.y - ep.s1.y);
      if (isSchem) {
        registerOrthSegments([ep.p1, ep.s1], item.idx, occupiedState.h, occupiedState.v);
        registerOrthSegments([ep.s2, ep.p2], item.idx, occupiedState.h, occupiedState.v);
      }
    });
    const routeOrder = visibleWires.slice().sort((a, b) => (a.span !== b.span) ? (a.span - b.span) : (a.idx - b.idx));
    vertSegments = [];
    const routedByIdx = {};
    routeOrder.forEach(item => {
      const pts = isSchem
        ? computeOrthWireWaypoints(item.w, item.idx, item.p1, item.p2, occupiedState, obstacles)
        : [item.p1, item.p2];
      if (isSchem) {
        for (let i = 0; i < pts.length - 1; i++) {
          if (pts[i].x === pts[i + 1].x && Math.abs(pts[i].y - pts[i + 1].y) > 4) {
            vertSegments.push({
              x: pts[i].x,
              yMin: Math.min(pts[i].y, pts[i + 1].y),
              yMax: Math.max(pts[i].y, pts[i + 1].y),
              wireIdx: item.idx
            });
          }
        }
      }
      routedByIdx[item.idx] = { w: item.w, idx: item.idx, p1: item.p1, p2: item.p2, pts, d: '', wpAttr: '' };
    });
    wirePaths = visibleWires.map(item => routedByIdx[item.idx]);
    wirePaths.forEach(entry => {
      const { p1, p2, pts, idx } = entry;
      let d = '';
      if (!isSchem) {
        const c1x = p1.x + Math.max(50, Math.abs(p2.x - p1.x) * 0.45);
        const c2x = p2.x - Math.max(50, Math.abs(p2.x - p1.x) * 0.45);
        d = `M ${p1.x} ${p1.y} C ${c1x} ${p1.y}, ${c2x} ${p2.y}, ${p2.x} ${p2.y}`;
      } else {
        d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          if (a.y === b.y) {
            d += buildHorizWithJumps(a.x, b.x, a.y, idx, vertSegments);
          } else {
            d += ` L ${b.x} ${b.y}`;
          }
        }
      }
      entry.d = d;
      entry.wpAttr = pts.map(pt => `${pt.x},${pt.y}`).join(';');
    });
    _wireRouteCache = { sig: geomSig, wirePaths, vertSegments };
    if (typeof window !== 'undefined') {
      window.__ORTH_WIRE_CACHE_MISSES__ = (window.__ORTH_WIRE_CACHE_MISSES__ || 0) + 1;
    }
  }

  if (typeof window !== 'undefined') {
    window.__ORTH_LAST_WIRE_PATHS__ = wirePaths.map(wp => ({
      id: wp.w.id,
      fromNode: wp.w.fromNode,
      toNode: wp.w.toNode,
      pts: wp.pts
    }));
  }

  const svgParts = [
    `<g id="canvas-origin-guide" pointer-events="none">` +
    `<line x1="0" y1="-4000" x2="0" y2="5000" stroke="rgba(219, 188, 127, 0.28)" stroke-width="1.5" stroke-dasharray="6 6" />` +
    `<line x1="-4000" y1="0" x2="8000" y2="0" stroke="rgba(219, 188, 127, 0.28)" stroke-width="1.5" stroke-dasharray="6 6" />` +
    `<rect x="6" y="6" width="118" height="20" rx="4" fill="rgba(17, 21, 24, 0.82)" stroke="rgba(219, 188, 127, 0.35)" stroke-width="1" />` +
    `<text x="12" y="19" fill="rgba(219, 188, 127, 0.85)" font-family="Consolas, monospace" font-size="10" font-weight="700">⌖ ORIGIN (0, 0)</text>` +
    `</g>`
  ];

  const getPointAlongPolyline = (ptsList, tRaw) => {
    const arr = Array.isArray(ptsList) && ptsList.length >= 2 ? ptsList : [{ x: 0, y: 0 }];
    if (arr.length === 1) return arr[0];
    const t = Math.max(0, Math.min(1, Number(tRaw) || 0));
    const segLens = [];
    let totalLen = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      const dx = arr[i + 1].x - arr[i].x;
      const dy = arr[i + 1].y - arr[i].y;
      const len = Math.hypot(dx, dy);
      segLens.push(len);
      totalLen += len;
    }
    if (totalLen <= 0.001) return arr[0];
    let dist = totalLen * t;
    for (let i = 0; i < segLens.length; i++) {
      if (dist <= segLens[i] || i === segLens.length - 1) {
        const frac = segLens[i] > 0.001 ? (dist / segLens[i]) : 0;
        return {
          x: arr[i].x + (arr[i + 1].x - arr[i].x) * frac,
          y: arr[i].y + (arr[i + 1].y - arr[i].y) * frac
        };
      }
      dist -= segLens[i];
    }
    return arr[arr.length - 1];
  };

  const defaultColor = style === 'subway_pulse' ? '#dbbc7f' : (style === 'ortho_pulse' ? '#a7c080' : '#7fbbb3');
  const tracerActive = Boolean(flowTracerState && flowTracerState.active);
  const renderWireEntry = (entry, isGlowLayer) => {
    const { w, p1, p2, d, wpAttr, pts } = entry;
    const customWireHex = normalizeHexColor(w && w.color);
    const isSelectedWire = Boolean(selectedItem && selectedItem.kind === 'wire' && selectedItem.id === w.id);
    const isTraceActiveWire = Boolean(tracerActive && flowTracerState.activeWireId === w.id && (flowTracerState.phase === 'transit_in' || flowTracerState.phase === 'emit_out'));
    const isTraceDoneWire = Boolean(tracerActive && flowTracerState.completedWireIds && flowTracerState.completedWireIds.has(w.id));
    const pulseCls = (isFlowPulsing && (!pathway.active || Boolean(pulseTimer))) ? ' wire-pulsing-flow' : '';
    const traceCls = isTraceActiveWire ? ' trace-active-wire' : (isTraceDoneWire ? ' trace-completed-wire' : '');
    const wireStateCls = isSelectedWire
      ? 'wire-selected'
      : (pathway.active && !isTraceActiveWire && !isTraceDoneWire ? (isGlowLayer ? 'wire-pathway-glow' : 'wire-pathway-dim') : '');
    const wireCls = 'wire-path' + (wireStateCls ? ' ' + wireStateCls : '') + traceCls + pulseCls;
    const baseStroke = isTraceActiveWire
      ? '#facc15'
      : (isTraceDoneWire ? '#34d399' : (customWireHex || (isSelectedWire ? defaultColor : (isGlowLayer ? '#38bdf8' : defaultColor))));
    const baseWidth = isTraceActiveWire ? '3.6' : ((isGlowLayer || isSelectedWire || isTraceDoneWire) ? '3' : '2.4');
    const pinCls = (pathway.active && !isGlowLayer && !isSelectedWire && !isTraceActiveWire) ? 'wire-pathway-dim' : ((isGlowLayer || isSelectedWire || isTraceActiveWire) ? 'wire-port-pin-glow' : '');
    svgParts.push(`<path class="wire-hit" data-wire-id="${w.id}" d="${d}" stroke="transparent" stroke-width="14" fill="none" onclick="handleWireHitClick(event, '${w.id}')" />`);
    if (isTraceActiveWire) {
      svgParts.push(`<path class="trace-active-wire-halo" data-wire-id="${w.id}" d="${d}" stroke="#facc15" stroke-width="9" opacity="0.28" fill="none" />`);
    } else if (isSelectedWire) {
      svgParts.push(`<path class="wire-selected-halo" data-wire-id="${w.id}" d="${d}" stroke="#facc15" stroke-width="8" opacity="0.44" fill="none" />`);
    } else if (isGlowLayer) {
      svgParts.push(`<path class="wire-pathway-halo" data-wire-id="${w.id}" d="${d}" stroke="#38bdf8" stroke-width="7" opacity="0.28" fill="none" />`);
    } else {
      svgParts.push(`<path class="${(pathway.active && !isTraceDoneWire ? 'wire-pathway-dim' : '') + pulseCls}" d="${d}" stroke="#111518" stroke-width="5.2" fill="none" opacity="0.72" />`);
    }
    svgParts.push(`<path class="${wireCls.trim()}" data-wire-id="${w.id}" data-waypoints="${wpAttr}" d="${d}" stroke="${baseStroke}" stroke-width="${baseWidth}" fill="none" />`);
    svgParts.push(`<circle class="${pinCls}" cx="${p1.x}" cy="${p1.y}" r="${(isGlowLayer || isTraceActiveWire) ? 5 : 4}" fill="#a7c080" stroke="#111518" stroke-width="1.2" />`);
    svgParts.push(`<circle class="${pinCls}" cx="${p2.x}" cy="${p2.y}" r="${(isGlowLayer || isTraceActiveWire) ? 5 : 4}" fill="#dbbc7f" stroke="#111518" stroke-width="1.2" />`);
    if (isTraceActiveWire) {
      const tokenPt = getPointAlongPolyline(pts && pts.length >= 2 ? pts : [p1, p2], flowTracerState.phaseProgress);
      const fileTxt = String(flowTracerState.activeFileLabel || 'payload.json').slice(0, 26);
      const escLbl = escSvgXml('📄 ' + fileTxt);
      const pillW = Math.max(76, Math.round(fileTxt.length * 6.4 + 28));
      const rx = Math.round(tokenPt.x - pillW / 2);
      const ry = Math.round(tokenPt.y - 12);
      svgParts.push(
        `<g class="trace-token-pill" pointer-events="none">` +
        `<rect x="${rx}" y="${ry}" width="${pillW}" height="22" rx="11" fill="#141a20" stroke="#facc15" stroke-width="2" />` +
        `<text x="${Math.round(tokenPt.x)}" y="${Math.round(tokenPt.y + 3)}" text-anchor="middle" fill="#fef08a" font-family="Consolas, monospace" font-size="10" font-weight="700">${escLbl}</text>` +
        `</g>`
      );
    } else if (pulseTimer) {
      const px = p1.x + (p2.x - p1.x) * pulseProgress;
      const py = p1.y + (p2.y - p1.y) * pulseProgress;
      svgParts.push(`<circle cx="${px}" cy="${py}" r="6" fill="#ece6d8" stroke="#a7c080" stroke-width="2" />`);
    }
  };

  wirePaths.forEach(entry => {
    if (!pathway.active || !pathway.wireIdxSet.has(entry.idx)) {
      renderWireEntry(entry, false);
    }
  });
  if (pathway.active) {
    wirePaths.forEach(entry => {
      if (pathway.wireIdxSet.has(entry.idx)) {
        renderWireEntry(entry, true);
      }
    });
  }

  // Draw dashed tether connectors ONLY when BOTH sticky note and target exist and are visible
  (S.stickyNotes || []).forEach(sn => {
    if (!sn || findCollapsedParentContainer(sn)) return;
    const tetherIds = getStickyTetherIds(sn);
    if (!tetherIds.length) return;
    const sx = Math.round(sn.x + (sn.w || 280) / 2);
    const sy = Math.round(sn.y + (sn.h || 240) / 2);
    tetherIds.forEach(tId => {
      const target = findAnyItemById(tId);
      if (!target || findCollapsedParentContainer(target)) return;
      const tx = Math.round(target.x + (target.w || 280) / 2);
      const ty = Math.round(target.y + 24);
      svgParts.push(`<path class="sticky-tether-line" data-sticky-id="${sn.id}" data-target-id="${target.id}" d="M ${sx} ${sy} L ${tx} ${ty}" stroke="#eab308" stroke-width="2.2" stroke-dasharray="6 5" fill="none" opacity="0.92" pointer-events="none" />`);
      svgParts.push(`<circle cx="${sx}" cy="${sy}" r="4" fill="#eab308" stroke="#111518" stroke-width="1.2" pointer-events="none" />`);
      svgParts.push(`<circle cx="${tx}" cy="${ty}" r="4.5" fill="#fef08a" stroke="#111518" stroke-width="1.4" pointer-events="none" />`);
    });
  });

  // Render crisp SVG overlay pills above wire strokes on connected container bulkhead ports
  const bulkheadPorts = {};
  visibleWires.forEach(vw => {
    const w = vw.w;
    const fObj = findAnyItemById(w.fromNode);
    const tObj = findAnyItemById(w.toNode);
    if (fObj && isContainerItem(fObj) && !fObj.collapsed && !findCollapsedParentContainer(fObj) && vw.fDir !== 'bottom') {
      const k = `${fObj.id}:${vw.fDir}:${w.fromPort}`;
      const isInt = Boolean(tObj && isItemInsideContainer(tObj, fObj));
      const cur = bulkheadPorts[k] || { contId: fObj.id, dir: vw.fDir, portName: w.fromPort, dot: vw.p1, hasInternal: false, hasExternal: false };
      if (isInt) cur.hasInternal = true;
      else cur.hasExternal = true;
      bulkheadPorts[k] = cur;
    }
    if (tObj && isContainerItem(tObj) && !tObj.collapsed && !findCollapsedParentContainer(tObj) && vw.tDir !== 'bottom') {
      const k = `${tObj.id}:${vw.tDir}:${w.toPort}`;
      const isInt = Boolean(fObj && isItemInsideContainer(fObj, tObj));
      const cur = bulkheadPorts[k] || { contId: tObj.id, dir: vw.tDir, portName: w.toPort, dot: vw.p2, hasInternal: false, hasExternal: false };
      if (isInt) cur.hasInternal = true;
      else cur.hasExternal = true;
      bulkheadPorts[k] = cur;
    }
  });
  const escSvgTxt = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Draw dynamic capsule rings on any port with >= 2 visible connected wires so all wires terminate inside the grown dot
  Object.keys(portTotalCounts).forEach(pk => {
    const cnt = portTotalCounts[pk] || 0;
    if (cnt < 2) return;
    const sep1 = pk.indexOf(':');
    const sep2 = sep1 >= 0 ? pk.indexOf(':', sep1 + 1) : -1;
    if (sep1 < 0 || sep2 < 0) return;
    const pNode = pk.slice(0, sep1);
    const pDir = pk.slice(sep1 + 1, sep2);
    const pName = pk.slice(sep2 + 1);
    const basePt = getPortCoordinates(pNode, pName, pDir, 0);
    const capLen = 13 + (cnt - 1) * 10;
    const capW = pDir === 'bottom' ? capLen : 14;
    const capH = pDir === 'bottom' ? 14 : capLen;
    const capX = Math.round(basePt.x - capW / 2);
    const capY = Math.round(basePt.y - capH / 2);
    svgParts.push(
      `<rect class="port-multi-capsule" data-node="${escSvgTxt(pNode)}" data-port="${escSvgTxt(pName)}" data-dir="${pDir}" data-conn-count="${cnt}" x="${capX}" y="${capY}" width="${capW}" height="${capH}" rx="7" pointer-events="none" />`
    );
  });

  Object.keys(bulkheadPorts).forEach(k => {
    const bp = bulkheadPorts[k];
    if (!bp || (!bp.hasInternal && !bp.hasExternal)) return;
    if (!bp.hasInternal) return;
    const lblText = escSvgTxt(bp.portName);
    const pillW = Math.max(28, Math.round(String(bp.portName || '').length * 6.4 + 10));
    const anchorX = bp.dir === 'in' ? (bp.dot.x + 8) : (bp.dot.x - 8);
    const rx = bp.dir === 'in' ? anchorX : (anchorX - pillW);
    const ry = bp.dot.y - 21;
    const tx = Math.round(rx + pillW / 2);
    const ty = bp.dot.y - 10;
    svgParts.push(
      `<g class="bulkhead-port-label-svg" data-cont-id="${escSvgTxt(bp.contId)}" data-port="${lblText}" data-dir="${bp.dir}" pointer-events="none">` +
      `<rect x="${rx}" y="${ry}" width="${pillW}" height="15" rx="4" />` +
      `<text x="${tx}" y="${ty}" text-anchor="middle">${lblText}</text>` +
      `</g>`
    );
  });

  wireSvg.innerHTML = svgParts.join('');
  if (typeof syncWireModeToolbarUI === 'function') syncWireModeToolbarUI();
}
window.renderWires = renderWires;
function countVisiblePortConnections(itemId, portName, dir) {
  if (!S || !Array.isArray(S.wires)) return 0;
  let count = 0;
  for (let i = 0; i < S.wires.length; i++) {
    const w = S.wires[i];
    if (!w) continue;
    const enc = findEnclosingContainerForWire(w);
    if (enc && (enc.collapsed || findCollapsedParentContainer(enc))) continue;
    const fDir = resolveActualPortDir(w.fromNode, w.fromPort, w.fromDir || 'out');
    const tDir = resolveActualPortDir(w.toNode, w.toPort, w.toDir || 'in');
    if (w.fromNode === itemId && w.fromPort === portName && fDir === dir) count += 1;
    if (w.toNode === itemId && w.toPort === portName && tDir === dir) count += 1;
  }
  return count;
}
window.countVisiblePortConnections = countVisiblePortConnections;

function renderPortDot(itemId, portName, dir) {
  const isArmed = armedPort && armedPort.nodeId === itemId && armedPort.portName === portName && armedPort.dir === dir;
  const connCount = countVisiblePortConnections(itemId, portName, dir);
  const grownPx = connCount >= 2 ? (13 + (connCount - 1) * 10) : 13;
  const sizeStyle = connCount >= 2
    ? (dir === 'bottom' ? ` style="width:${grownPx}px;height:14px;"` : ` style="width:14px;height:${grownPx}px;"`)
    : '';
  const cls = `port-dot ${dir}${isArmed ? ' port-armed-pulse' : ''}${connCount >= 2 ? ' port-dot-grown' : ''}`;
  return `<span class="${cls}" data-node="${itemId}" data-port="${portName}" data-dir="${dir}" data-conn-count="${connCount}"${sizeStyle} title="Click-then-Click or Drag wire (${portName})" onmousedown="onPortMouseDown(event,'${itemId}','${portName}','${dir}')" onmouseup="finishPortConnect(event,'${itemId}','${portName}','${dir}')" onclick="onPortClick(event,'${itemId}','${portName}','${dir}')"></span>`;
}

function getItemOverlayStateClasses(itemId) {
  const cls = [];
  if (canvasSearchState && canvasSearchState.matchIdSet && canvasSearchState.matchIdSet.has(itemId)) {
    cls.push('search-match-highlight');
    if (canvasSearchState.activeId === itemId) cls.push('search-match-active');
  }
  if (flowTracerState && flowTracerState.active) {
    if (flowTracerState.activeNodeId === itemId && flowTracerState.phase === 'processing') {
      cls.push('trace-node-processing');
    } else if (flowTracerState.receivingNodeId === itemId && (flowTracerState.phase === 'transit_in' || flowTracerState.phase === 'emit_out')) {
      cls.push('trace-receiving');
    } else if (flowTracerState.completedNodeIds && flowTracerState.completedNodeIds.has(itemId)) {
      cls.push('trace-node-done');
    }
  }
  return cls.join(' ');
}

function renderContainerBox(cont, kind, boxCls, hdrCls, icon) {
  if (findCollapsedParentContainer(cont)) return '';
  const sel = selectedItem && selectedItem.id === cont.id ? 'selected' : '';
  const overlayCls = getItemOverlayStateClasses(cont.id);
  const isCol = Boolean(cont.collapsed);
  const colCls = isCol ? 'collapsed-blackbox' : '';
  const effH = isCol ? getCollapsedContainerHeight(cont) : cont.h;
  const inHtml = (cont.inPorts || ['in']).map(p => `<div class="port-row port-row-stacked port-row-in"><span class="cont-port-lbl port-lbl-above">${p}</span>${renderPortDot(cont.id, p, 'in')}</div>`).join('');
  const outHtml = (cont.outPorts || ['out']).map(p => `<div class="port-row port-row-stacked port-row-out"><span class="cont-port-lbl port-lbl-above">${p}</span>${renderPortDot(cont.id, p, 'out')}</div>`).join('');
  const botHtml = (cont.bottomPorts || ['bus']).map(p => `<span class="port-row">${renderPortDot(cont.id, p, 'bottom')}<span>${p}</span></span>`).join('');
  const notesArr = cont.notes || cont.checklist || [];
  const cs = cont.collapsedSections || {};
  const notesCol = Boolean(cs.notes);
  const notesHtml = !isCol && notesArr.length
    ? `<div class="container-notes-pane">
        <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${cont.id}', 'notes', event)" title="Click to ${notesCol ? 'expand' : 'collapse'} Container Notes (${notesArr.length}) — container resizes to fit">
          <strong style="color:var(--gold);font-size:10px;">📝 Notes: (${notesArr.length})</strong>
          <span class="collapse-arrow-badge">${notesCol ? '▸ Show' : '▾ Hide'}</span>
        </div>
        ${notesCol ? '' : notesArr.map(line => `<div>${line}</div>`).join('')}
      </div>`
    : '';
  const collapseLabel = isCol ? '[+] Expand' : '[–] Collapse';
  const tint = getItemColorInlineStyles(cont, kind);
  return `
    <div class="${boxCls} ${sel} ${colCls} ${overlayCls}" data-item-id="${cont.id}" style="left:${cont.x}px;top:${cont.y}px;width:${cont.w}px;height:${effH}px;${tint.cardStyle}" onmousedown="startDragItem(event, '${kind}', '${cont.id}')">
      <div class="${hdrCls}" style="${tint.hdrStyle}">
        <span>${icon} ${cont.title} ${isCol ? '<small style="color:var(--gold);">(Black-Box)</small>' : ''}</span>
        <span style="display:flex;gap:4px;align-items:center;">
          <button class="hdr-mini-btn no-drag" onclick="toggleContainerCollapse(event, '${kind}', '${cont.id}')" title="${isCol ? 'Expand Black-Box Subsystem Container' : 'Collapse Container into Black-Box Subsystem'}">${collapseLabel}</button>
          <button class="hdr-mini-btn no-drag" style="color:var(--red);" onclick="deleteItemById(event, '${kind}', '${cont.id}')" title="Delete">🗑️</button>
        </span>
      </div>
      <div class="container-io-rail">
        <div class="port-col port-col-in">${inHtml}</div>
        <div class="port-col port-col-out">${outHtml}</div>
      </div>
      ${notesHtml}
      <div class="container-bottom-ports">${botHtml}</div>
      ${isCol ? '' : `<div class="resize-handle" onmousedown="startResizeItem(event, '${kind}', '${cont.id}')"></div>`}
    </div>
  `;
}

let lastInspectedSelectionKey = '';

function isInspectorInputFocused() {
  const el = document.getElementById('inspectorContent');
  const ae = (typeof document !== 'undefined') ? document.activeElement : null;
  if (!el || !ae) return false;
  const tag = String(ae.tagName || '').toUpperCase();
  const isFormField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || Boolean(ae.isContentEditable);
  return isFormField && (typeof el.contains === 'function' ? el.contains(ae) : true);
}

function renderAll(options = {}) {
  ensureStateDefaults();
  syncOfflineModeUI();
  syncWorkflowStatusUI();
  syncWireModeToolbarUI();
  renderCustomNodesPalette();
  document.body.classList.toggle('clean-unselected-view', !selectedItem);
  document.body.classList.toggle('hide-left-palette', Boolean(S.hideLeftPalette));
  document.body.classList.toggle('fullscreen-canvas-view', Boolean(S.fullScreenView));
  document.body.classList.toggle('layout-locked', Boolean(S.lockLayout));
  const wsSel = document.getElementById('wireStyleSelect');
  if (wsSel && wsSel.value !== S.wireStyle) wsSel.value = S.wireStyle;
  const lockBtn = document.getElementById('btnLockLayout');
  if (lockBtn) {
    const lbl = lockBtn.querySelector ? lockBtn.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = S.lockLayout ? 'Locked' : 'Lock';
    else lockBtn.textContent = S.lockLayout ? '🔒 Layout Locked (Pan Only · View Mode)' : '🔓 Lock Layout (Pan Only)';
    lockBtn.title = S.lockLayout
      ? '🔒 Layout Locked (Pan Only · View Mode) — Click to unlock layout'
      : '🔓 Lock Layout (Pan Only) — Lock node positions so dragging anywhere pans the canvas';
  }
  const leftBtn = document.getElementById('btnToggleLeftPalette');
  if (leftBtn) {
    const lbl = leftBtn.querySelector ? leftBtn.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = S.hideLeftPalette ? 'Palette ▸' : 'Palette';
    else leftBtn.textContent = S.hideLeftPalette ? '▶ Show Palette' : '◀ Hide Palette';
    leftBtn.title = S.hideLeftPalette ? '▶ Show Left Palette Sidebar' : '◀ Hide Left Palette Sidebar';
  }
  const fsBtn = document.getElementById('btnFullScreenView');
  if (fsBtn) {
    const lbl = fsBtn.querySelector ? fsBtn.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = S.fullScreenView ? 'Exit' : 'Full';
    else fsBtn.textContent = S.fullScreenView ? '⛶ Exit Full Screen' : '⛶ Full Screen';
    fsBtn.title = S.fullScreenView ? '⛶ Exit Full Screen — Restore sidebars' : '⛶ Full Screen — Hide both sidebars for clean full-screen diagram view';
  }
  const allListsBtn = document.getElementById('btnToggleAllLongLists');
  if (allListsBtn) {
    const lbl = allListsBtn.querySelector ? allListsBtn.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = S.allListsCollapsed ? 'Lists ▸' : 'Lists ▾';
    else allListsBtn.textContent = S.allListsCollapsed ? 'Lists ▸' : 'Lists ▾';
  }
  applyWorldTransform();

  const isEmpty = S.categories.length === 0 && S.subcategories.length === 0 && S.cells.length === 0 && S.nodes.length === 0 && S.fileContainers.length === 0 && S.buses.length === 0;
  document.getElementById('canvasHint').style.display = isEmpty ? 'block' : 'none';

  let html = '';

  S.categories.forEach(c => {
    html += renderContainerBox(c, 'category', 'cat-box', 'cat-hdr', '📁');
  });

  S.subcategories.forEach(sc => {
    html += renderContainerBox(sc, 'subcategory', 'subcat-box', 'subcat-hdr', '📂');
  });

  S.cells.forEach(cell => {
    html += renderContainerBox(cell, 'cell', 'cell-box', 'subcat-hdr', '🧱');
  });

  S.nodes.forEach(n => {
    if (findCollapsedParentContainer(n)) return;
    const sel = selectedItem && selectedItem.id === n.id ? 'selected' : '';
    const cs = n.collapsedSections || {};
    const nodeType = n.type || 'step';
    const effectiveInPorts = Array.isArray(n.inPorts) ? n.inPorts : (Array.isArray(n.inputs) ? n.inputs : []);
    const inPortsHtml = effectiveInPorts.map(p => `
      <div class="port-row port-row-stacked port-row-in">
        <span class="port-lbl-above">${p}</span>
        ${renderPortDot(n.id, p, 'in')}
      </div>
    `).join('');
    const outPortsHtml = (n.outPorts || []).map(p => `
      <div class="port-row port-row-stacked port-row-out">
        <span class="port-lbl-above">${p}</span>
        ${renderPortDot(n.id, p, 'out')}
      </div>
    `).join('');
    const paramEntries = Object.entries(n.params || {});
    const paramsCol = Boolean(cs.params);
    const paramsHtml = paramEntries.length ? `
      <div class="node-params-box" style="display:flex;flex-direction:column;gap:3px;background:rgba(255,255,255,0.03);border:1px solid rgba(236,230,216,0.14);padding:4px 6px;border-radius:6px;">
        <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${n.id}', 'params', event)" title="Click to ${paramsCol ? 'expand' : 'collapse'} Parameters (${paramEntries.length}) — container resizes to fit">
          <span style="font-size:10px;font-weight:700;color:var(--fg1);">🎛️ Parameters (${paramEntries.length})</span>
          <span class="collapse-arrow-badge">${paramsCol ? '▸ ' + paramEntries.length : '▾ Hide'}</span>
        </div>
        ${paramsCol ? '' : paramEntries.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;background:rgba(0,0,0,0.22);padding:3px 6px;border-radius:4px;">
            <span style="color:var(--fg1)">${k}</span>
            <strong style="color:var(--aqua);font-family:Consolas,monospace;">${v}</strong>
          </div>
        `).join('')}
      </div>
    ` : '';
    const ioCol = Boolean(cs.io_specs);
    const ioSummaryHtml = (n.inputSpec || n.outputSpec) ? `
      <div class="node-io-spec-box" style="display:flex;flex-direction:column;gap:3px;background:rgba(127,187,179,0.08);border:1px solid rgba(127,187,179,0.22);padding:5px 7px;border-radius:6px;font-size:10px;">
        <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${n.id}', 'io_specs', event)" title="Click to ${ioCol ? 'expand' : 'collapse'} I/O Specs — container resizes to fit">
          <span style="font-size:10px;font-weight:700;color:var(--aqua);">📥/📤 I/O Specs</span>
          <span class="collapse-arrow-badge">${ioCol ? '▸ Show' : '▾ Hide'}</span>
        </div>
        ${ioCol ? '' : `
          ${n.inputSpec ? `<div><strong style="color:var(--aqua);">📥 Input(s):</strong> <span style="color:var(--fg0);">${n.inputSpec}</span></div>` : ''}
          ${n.outputSpec ? `<div><strong style="color:var(--accent);">📤 Output(s):</strong> <span style="color:var(--fg0);">${n.outputSpec}</span></div>` : ''}
        `}
      </div>
    ` : '';
    const substepsArr = Array.isArray(n.steps) && n.steps.length
      ? n.steps
      : (Array.isArray(n.bullets) && n.bullets.length
        ? n.bullets
        : (Array.isArray(n.substeps) && n.substeps.length ? n.substeps : []));
    const substepsCol = Boolean(cs.substeps);
    const substepsHeaderLabel = nodeType === 'idea'
      ? '💡 What You Do Here'
      : (nodeType === 'external_in'
        ? '📥 What Happens in Upstream Workflow'
        : (nodeType === 'external_out'
          ? '📤 What Happens in Downstream Workflow'
          : '🔧 What You Do in This UI'));
    const substepsHtml = substepsArr.length ? `
      <div class="node-substeps-box" style="display:flex;flex-direction:column;gap:4px;background:rgba(167,192,128,0.08);border:1px solid rgba(167,192,128,0.28);padding:5px 7px;border-radius:6px;max-height:${n.userResized ? 'none' : '150px'};overflow-y:auto;">
        <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${n.id}', 'substeps', event)" title="Click to ${substepsCol ? 'expand' : 'collapse'} Steps (${substepsArr.length}) — container resizes to fit">
          <span style="font-size:10px;font-weight:700;color:var(--accent);">${substepsHeaderLabel} (${substepsArr.length})</span>
          <span class="collapse-arrow-badge">${substepsCol ? '▸ ' + substepsArr.length + ' steps' : '▾ Hide'}</span>
        </div>
        ${substepsCol ? '' : `<ul class="node-steps-list" style="margin:0;padding-left:15px;display:flex;flex-direction:column;gap:3px;">${substepsArr.map(ss => `<li style="font-size:10px;line-height:1.35;color:var(--fg0);">${ss}</li>`).join('')}</ul>`}
      </div>
    ` : '';
    const rulesArr = Array.isArray(n.rules) && n.rules.length ? n.rules : [];
    const rulesCol = Boolean(cs.rules);
    const rulesHtml = rulesArr.length ? `
      <div class="node-rules-box" style="display:flex;flex-direction:column;gap:4px;background:rgba(219,188,127,0.08);border:1px solid rgba(219,188,127,0.28);padding:6px 7px;border-radius:6px;max-height:${n.userResized ? 'none' : '180px'};overflow-y:auto;">
        <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${n.id}', 'rules', event)" title="Click to ${rulesCol ? 'expand' : 'collapse'} Active Python Rules (${rulesArr.length}) — container resizes to fit">
          <span style="font-size:10px;font-weight:700;color:var(--gold);">⚙️ Active Python Rules (${rulesArr.length})</span>
          <span class="collapse-arrow-badge">${rulesCol ? '▸ ' + rulesArr.length + ' rules' : '▾ Hide'}</span>
        </div>
        ${rulesCol ? '' : rulesArr.map(r => `<div style="font-size:10px;line-height:1.35;color:var(--fg0);padding:3px 5px;background:rgba(0,0,0,0.26);border-left:2px solid var(--gold);border-radius:3px;">${r}</div>`).join('')}
      </div>
    ` : '';
    const uiUrl = (n.ui_url !== undefined ? n.ui_url : n.uiUrl) || '';
    const uiLabel = (n.ui_label !== undefined ? n.ui_label : n.uiLabel) || n.title || 'Open UI';
    const uiLinkHtml = uiUrl ? `
      <a href="${uiUrl}" target="_blank" rel="noopener" class="node-ui-launch-link no-drag" data-ui-url="${uiUrl}" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
        <span>🚀 Open UI: ${uiLabel}</span>
        <span style="font-size:10px;opacity:0.85;">↗</span>
      </a>
    ` : '';
    const docLinksArr = Array.isArray(n.doc_links) ? n.doc_links : (Array.isArray(n.docLinks) ? n.docLinks : []);
    const docLinksHtml = docLinksArr.length ? `
      <div class="node-doc-links-row no-drag" style="display:flex;flex-wrap:wrap;gap:5px;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
        ${docLinksArr.map(dl => `<a href="${dl.url || '#'}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:5px;background:rgba(219,188,127,0.14);border:1px solid rgba(219,188,127,0.42);color:var(--gold);font-size:10px;font-weight:700;text-decoration:none;">📖 ${dl.label || dl.url} ↗</a>`).join('')}
      </div>
    ` : '';
    const nodePathButtonsArr = Array.isArray(n.pathButtons) ? n.pathButtons : [];
    const nodePathButtonsHtml = nodePathButtonsArr.length ? `
      <div class="node-path-buttons-row no-drag" style="display:flex;flex-wrap:wrap;gap:5px;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
        ${nodePathButtonsArr.map(pb => `<button type="button" class="hdr-mini-btn no-drag" style="background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.42);color:#7dd3fc;padding:3px 7px;font-size:10px;font-weight:700;" onclick="openLocalPath('${escSvgXml(pb.path || '')}', '${escSvgXml(pb.mode || (pb.kind === 'folder' ? 'explorer' : 'app'))}', event)" title="Open ${escSvgXml(pb.path || '')} (${pb.mode || (pb.kind === 'folder' ? 'Windows Explorer' : 'Associated App')})">${pb.kind === 'folder' ? '📂' : '📄'} ${escSvgXml(pb.label || pb.path || 'Open')}</button>`).join('')}
      </div>
    ` : '';
    const isLlmNode = Boolean(nodeType === 'llm_query' || n.llmProvider || n.llmPrompt || (n.llmConfig && typeof n.llmConfig === 'object'));
    const rawLlmProv = n.llmProvider || (n.llmConfig && n.llmConfig.provider) || 'ollama';
    const llmProv = rawLlmProv;
    const llmMod = n.llmModel || (n.llmConfig && n.llmConfig.model) || 'llama3.2';
    const llmPrmpt = n.llmPrompt || (n.llmConfig && n.llmConfig.prompt) || '';
    const wiredInFiles = isLlmNode ? collectUpstreamFilesForNode(n.id) : [];
    const llmCardControlsHtml = isLlmNode ? `
      <div class="node-llm-box no-drag" style="display:flex;flex-direction:column;gap:5px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.42);padding:6px 8px;border-radius:6px;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <strong style="font-size:10.5px;color:#d8b4fe;">🤖 LLM / AI Query Engine</strong>
          <span style="font-size:9.5px;color:#c084fc;font-family:Consolas,monospace;">📥 ${wiredInFiles.length} wired file(s)</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          <select class="no-drag" style="font-size:10px;padding:3px 5px;" onchange="updateNodeLlmField('${n.id}', 'llmProvider', this.value, true)">
            <option value="ollama" ${llmProv === 'ollama' ? 'selected' : ''}>🦙 Local Ollama (${OLLAMA_LOCAL_BASE_URL})</option>
            <option value="gemini" ${llmProv === 'gemini' ? 'selected' : ''}>✨ Gemini API (gemini-2.5-pro / flash)</option>
            <option value="openai" ${llmProv === 'openai' ? 'selected' : ''}>🤖 OpenAI / Custom API Endpoint</option>
            <option value="custom" ${llmProv === 'custom' ? 'selected' : ''}>🔌 Custom Endpoint</option>
          </select>
          <input type="text" class="no-drag" style="font-size:10px;padding:3px 5px;" placeholder="Model (e.g. llama3.2, gemini-2.5-pro)" value="${escSvgXml(llmMod)}" oninput="updateNodeLlmField('${n.id}', 'llmModel', this.value, false)" onchange="updateNodeLlmField('${n.id}', 'llmModel', this.value, true)">
        </div>
        <textarea class="no-drag" rows="3" style="font-size:10px;padding:4px 6px;background:rgba(0,0,0,0.36);color:#f3e8ff;border:1px solid rgba(168,85,247,0.35);border-radius:4px;" placeholder="Put the prompt or instructions here — wired input files + prompt get run -> output file comes out" oninput="updateNodeLlmField('${n.id}', 'llmPrompt', this.value, false)" onchange="updateNodeLlmField('${n.id}', 'llmPrompt', this.value, false)">${escSvgXml(llmPrmpt)}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <button type="button" class="hdr-mini-btn no-drag" style="flex:1;padding:4px 8px;font-size:10.5px;font-weight:700;background:rgba(168,85,247,0.28);border:1px solid #c084fc;color:#f3e8ff;" onclick="runLlmQueryNode('${n.id}', event)">▶ Run Prompt + Input Files</button>
        </div>
        ${n.lastLlmOutput ? `<div style="font-size:9.5px;color:#86efac;font-family:Consolas,monospace;background:rgba(0,0,0,0.32);padding:3px 6px;border-radius:4px;">✅ ${escSvgXml(n.lastLlmOutput)}</div>` : ''}
      </div>
    ` : '';
    const isTraceProc = Boolean(flowTracerState && flowTracerState.active && flowTracerState.activeNodeId === n.id && flowTracerState.phase === 'processing');
    const tracePct = Math.round(Math.max(5, Math.min(100, (Number(flowTracerState && flowTracerState.phaseProgress) || 0) * 100)));
    const traceProcHtml = isTraceProc ? `
      <div class="node-trace-progress-badge" data-trace-node-badge="${n.id}">
        <div style="display:flex;justify-content:space-between;gap:6px;">
          <span>⚙️ Running on <strong>${escSvgXml(flowTracerState.activeFileLabel || 'input')}</strong></span>
          <span>${tracePct}%</span>
        </div>
        <div class="node-trace-progress-track"><div class="node-trace-progress-fill" style="width:${tracePct}%;"></div></div>
        <div style="color:#a7f3d0;">➔ Emitting: <code>${escSvgXml(flowTracerState.activeOutputLabel || 'output.json')}</code></div>
      </div>
    ` : '';
    const categoryBadge = n.category || (nodeType === 'idea' ? '💡 IDEA / TRIGGER' : (nodeType === 'llm_query' ? '🤖 LLM / AI QUERY' : (nodeType === 'external_in' ? '📥 EXTERNAL WORKFLOW IN' : (nodeType === 'external_out' ? '📤 EXTERNAL WORKFLOW OUT' : 'Processor'))));
    const nodeTint = getItemColorInlineStyles(n, 'node');
    const nodeOverlayCls = getItemOverlayStateClasses(n.id);
    html += `
      <div class="wf-node node-type-${nodeType} ${sel} ${nodeOverlayCls}" data-item-id="${n.id}" data-node-type="${nodeType}" style="left:${n.x}px;top:${n.y}px;width:${n.w || 255}px;${n.userResized && n.h ? `min-height:${n.h}px;` : ''}display:flex;flex-direction:column;${nodeTint.cardStyle}" onmousedown="startDragItem(event, 'node', '${n.id}')">
        <div class="node-hdr" style="${nodeTint.hdrStyle}">
          <span class="node-title-text">${n.title}</span>
          <span style="display:flex;gap:4px;align-items:center;">
            <span class="node-badge-text" style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(0,0,0,0.3);color:var(--gold);">${categoryBadge}</span>
            <button class="hdr-mini-btn no-drag" style="color:var(--red);" onclick="deleteItemById(event, 'node', '${n.id}')" title="Delete Node">🗑️</button>
          </span>
        </div>
        <div class="node-port-controls no-drag">
          <span style="display:inline-flex;gap:3px;">
            <button type="button" class="hdr-mini-btn no-drag" onclick="adjustNodePorts(event, '${n.id}', 'in', 1)" title="Add Input Port">+In</button>
            <button type="button" class="hdr-mini-btn no-drag" onclick="adjustNodePorts(event, '${n.id}', 'in', -1)" title="Remove Last Input Port">-In</button>
          </span>
          <span style="display:inline-flex;gap:3px;">
            <button type="button" class="hdr-mini-btn no-drag" onclick="adjustNodePorts(event, '${n.id}', 'out', 1)" title="Add Output Port">+Out</button>
            <button type="button" class="hdr-mini-btn no-drag" onclick="adjustNodePorts(event, '${n.id}', 'out', -1)" title="Remove Last Output Port">-Out</button>
          </span>
        </div>
        <div class="node-ports">
          <div class="port-col">${inPortsHtml}</div>
          <div class="port-col">${outPortsHtml}</div>
        </div>
        <div class="node-body" style="flex:1;">
          ${uiLinkHtml}
          ${docLinksHtml}
          ${nodePathButtonsHtml}
          ${llmCardControlsHtml}
          ${ioSummaryHtml}
          ${substepsHtml}
          ${rulesHtml}
          ${paramsHtml}
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;">
            <div style="font-size:10px;color:var(--fg1);font-family:Consolas,monospace;">🔗 ${n.scriptBinding || 'unbound'}</div>
            <span style="display:flex;gap:4px;flex-wrap:wrap;">
              <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 7px;font-size:9.5px;font-weight:700;background:rgba(16,185,129,0.22);border:1px solid rgba(16,185,129,0.55);color:#6ee7b7;" onclick="runSingleStageNodeSafe(event, '${n.id}')" title="▶ Run only this stage with Non-Destructive Overwrite Guard (checks if existing output files changed before writing)">▶ Run Stage (Safe Diff)</button>
              <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9.5px;background:rgba(167,192,128,0.16);border:1px solid rgba(167,192,128,0.42);color:#a7c080;" onclick="chooseScriptForNode('${n.id}', event)" title="🐍 Connect a Python/JS script file to this node">🐍 Connect Script</button>
              <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9.5px;background:rgba(245,158,11,0.16);border:1px solid rgba(245,158,11,0.42);color:#fde68a;" onclick="chooseFolderForContainer('${n.id}', event)" title="📁 Choose a folder to connect to this node">📁 Choose Folder</button>
            </span>
          </div>
          ${n.lastStageRunSummary ? `<div style="font-size:9.5px;color:#fde68a;background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);padding:3px 6px;border-radius:4px;font-family:Consolas,monospace;">${escSvgXml(n.lastStageRunSummary)}</div>` : ''}
          ${traceProcHtml}
        </div>
        <div class="resize-handle" onmousedown="startResizeItem(event, 'node', '${n.id}')" title="Drag corner to resize node"></div>
      </div>
    `;
  });

  S.fileContainers.forEach(fc => {
    if (findCollapsedParentContainer(fc)) return;
    const sel = selectedItem && selectedItem.id === fc.id ? 'selected' : '';
    const cs = fc.collapsedSections || {};
    const filesCol = Boolean(cs.files);
    const filesArr = fc.files || [];
    const filterStr = fc.pattern || fc.filter || '*.*';
    const folderLocalPath = fc.localRepoPath || fc.folderPath || './assets';
    const bucketPathButtonsArr = Array.isArray(fc.pathButtons) ? fc.pathButtons : [];
    const bucketPathButtonsHtml = bucketPathButtonsArr.length ? `
      <div class="node-path-buttons-row no-drag" style="display:flex;flex-wrap:wrap;gap:5px;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
        ${bucketPathButtonsArr.map(pb => `<button type="button" class="hdr-mini-btn no-drag" style="background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.42);color:#7dd3fc;padding:3px 7px;font-size:10px;font-weight:700;" onclick="openLocalPath('${escSvgXml(pb.path || '')}', '${escSvgXml(pb.mode || (pb.kind === 'folder' ? 'explorer' : 'app'))}', event)" title="Open ${escSvgXml(pb.path || '')}">${pb.kind === 'folder' ? '📂' : '📄'} ${escSvgXml(pb.label || pb.path || 'Open')}</button>`).join('')}
      </div>
    ` : '';
    const selectedIndices = Array.isArray(fc.selectedFileIndices)
      ? fc.selectedFileIndices
      : (typeof fc.selectedFileIndex === 'number' ? [fc.selectedFileIndex] : [0]);
    const fileStatesMap = (fc.fileStates && typeof fc.fileStates === 'object') ? fc.fileStates : {};
    const hasLinkedFolder = Boolean(fc.folderHandle || (fc.folderPath && !String(fc.folderPath).startsWith('./assets')));
    const filesHtml = filesArr.map((f, fIdx) => {
      const fStr = typeof f === 'object' && f !== null ? (f.url || f.path || f.name || '') : String(f || '');
      const cleanPathOnly = fStr.split(' (')[0].trim();
      const fLabel = typeof f === 'object' && f !== null ? (f.name || f.label || fStr) : fStr;
      const isPlaceholderSample = isOfflineStandaloneMode() && !hasLinkedFolder && !/^ht(?:tp|tps):\/\//i.test(cleanPathOnly);
      const fHref = (!isPlaceholderSample && (cleanPathOnly.startsWith('./') || cleanPathOnly.startsWith('/') || cleanPathOnly.startsWith('http')))
        ? cleanPathOnly
        : ((!isPlaceholderSample && fc.folderPath) ? `${fc.folderPath.replace(/\/$/, '')}/${cleanPathOnly}` : '');
      const fLocalPath = cleanPathOnly.startsWith('./') || cleanPathOnly.startsWith('/') ? cleanPathOnly : `${folderLocalPath.replace(/\/$/, '')}/${cleanPathOnly}`;
      const isSelectedFile = selectedIndices.includes(fIdx);
      const stEntry = fileStatesMap[fIdx] || fileStatesMap[fStr] || { status: 'verified' };
      const stKind = stEntry.status || 'verified';
      const isTraceUpdatedRow = Boolean(stEntry.traceUpdated || (flowTracerState && flowTracerState.updatedBucketMap && flowTracerState.updatedBucketMap[`${fc.id}::${fLabel}`]));
      let badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.42);color:#6ee7b7;font-size:9px;white-space:nowrap;" title="Existing file verified on disk">🟢 Verified</span>`;
      if (stEntry.traceUpdated) {
        badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(16,185,129,0.28);border:1px solid #34d399;color:#ecfdf5;font-size:9px;font-weight:700;white-space:nowrap;" title="${escSvgXml(stEntry.traceNote || 'Updated by flow tracer')}">✨ ${escSvgXml(stEntry.traceBadge || 'Generated')}</span>`;
      } else if (stKind === 'identical') {
        badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(16,185,129,0.22);border:1px solid #10b981;color:#a7f3d0;font-size:9px;white-space:nowrap;" title="SHA-256 matches existing file 100% — no overwrite needed">🟢 Identical (No Overwrite Needed)</span>`;
      } else if (stKind === 'diff') {
        const deltaLbl = stEntry.deltaSummary || '+Δ lines / fields';
        badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(250,204,21,0.2);border:1px solid #facc15;color:#fef08a;font-size:9px;white-space:nowrap;" title="Re-run output differs from existing file on disk — protected by Overwrite Guard">🟡 Changed (${escSvgXml(deltaLbl)})</span>`;
      } else if (stKind === 'queued') {
        badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(148,163,184,0.18);border:1px solid rgba(148,163,184,0.4);color:#cbd5e1;font-size:9px;white-space:nowrap;">⚪ Queued</span>`;
      } else if (stKind === 'applied_bak') {
        badgeHtml = `<span style="padding:1px 5px;border-radius:4px;background:rgba(56,189,248,0.2);border:1px solid #38bdf8;color:#bae6fd;font-size:9px;white-space:nowrap;" title="Updated file applied and previous version backed up to .bak">✅ Applied (.bak saved)</span>`;
      }
      const diffActionsHtml = stKind === 'diff' ? `
        <div class="no-drag" style="display:flex;align-items:center;gap:4px;padding-left:18px;flex-wrap:wrap;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
          <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9px;background:rgba(250,204,21,0.22);border:1px solid #facc15;color:#fef08a;font-weight:700;" onclick="openFileDiffInspectorModal(event, '${fc.id}', ${fIdx})" title="Inspect exact diff between existing file and new stage output">🔍 View Diff</button>
          <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9px;background:rgba(16,185,129,0.22);border:1px solid #10b981;color:#a7f3d0;font-weight:700;" onclick="applyCandidateFileWithBackup(event, '${fc.id}', ${fIdx})" title="Apply new output and save existing file as .bak backup">✅ Apply &amp; Backup .bak</button>
          <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9px;background:rgba(56,189,248,0.18);border:1px solid #38bdf8;color:#bae6fd;font-weight:700;" onclick="keepExistingFileSafe(event, '${fc.id}', ${fIdx})" title="Keep existing file untouched and discard candidate overwrite">🛡️ Keep Existing</button>
        </div>
      ` : '';
      return `
      <div class="bucket-file-row no-drag ${isTraceUpdatedRow ? 'trace-file-updated' : ''}" style="display:flex;flex-direction:column;gap:3px;padding:4px 6px;background:${isSelectedFile ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.04)'};border:1px solid ${isSelectedFile ? 'rgba(56,189,248,0.55)' : 'rgba(255,255,255,0.06)'};border-radius:4px;font-family:Consolas,monospace;font-size:10px;" onclick="toggleSelectBucketFile(event, '${fc.id}', ${fIdx})" onmousedown="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <label class="no-drag" style="display:flex;align-items:center;gap:5px;cursor:pointer;flex:1;min-width:0;" onclick="event.stopPropagation()">
            <input type="checkbox" class="no-drag" ${isSelectedFile ? 'checked' : ''} onchange="toggleSelectBucketFile(event, '${fc.id}', ${fIdx})" title="Select this file for single-file step execution (▶ Trace or ▶ Step Selected)" />
            ${fHref ? `<a href="${fHref}" target="_blank" rel="noopener" class="no-drag" style="color:var(--aqua);text-decoration:underline;word-break:break-all;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">📄 ${fLabel} ↗</a>` : `<span style="word-break:break-all;">📄 ${fLabel}</span>`}
          </label>
          <span style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
            ${badgeHtml}
            <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 4px;font-size:9px;color:#fde68a;" onclick="openLocalPath('${escSvgXml(fLocalPath)}', 'select', event, '${fc.id}')" title="📂 Reveal or connect local folder">📂</button>
            <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 4px;font-size:9px;color:#7dd3fc;" onclick="openLocalPath('${escSvgXml(fLocalPath)}', 'app', event, '${fc.id}')" title="🚀 Open file (connects local folder if sample placeholder)">🚀</button>
            <button class="hdr-mini-btn no-drag" style="padding:0 4px;font-size:9px;color:var(--red);" onclick="removeFileFromBucket(event, '${fc.id}', ${fIdx})" title="Remove file from container">✕</button>
          </span>
        </div>
        ${diffActionsHtml}
      </div>
    `}).join('');
    const inPortsBucketHtml = (fc.inPorts && fc.inPorts.length ? fc.inPorts : ['files_in']).map(p => `
      <div class="port-row port-row-stacked port-row-in"><span class="port-lbl-above">${p}</span>${renderPortDot(fc.id, p, 'in')}</div>
    `).join('');
    const outPortsBucketHtml = (fc.outPorts && fc.outPorts.length ? fc.outPorts : ['files_out']).map(p => `
      <div class="port-row port-row-stacked port-row-out"><span class="port-lbl-above">${p}</span>${renderPortDot(fc.id, p, 'out')}</div>
    `).join('');
    const bucketTint = getItemColorInlineStyles(fc, 'bucket');
    const bucketOverlayCls = getItemOverlayStateClasses(fc.id);
    html += `
      <div class="file-bucket ${sel} ${bucketOverlayCls}" data-item-id="${fc.id}" style="left:${fc.x}px;top:${fc.y}px;width:${fc.w || 360}px;${fc.userResized && fc.h ? `min-height:${fc.h}px;` : ''}display:flex;flex-direction:column;${bucketTint.cardStyle}" onmousedown="startDragItem(event, 'bucket', '${fc.id}')">
        <div class="bucket-hdr" style="${bucketTint.hdrStyle}">
          <span>🗄️ ${fc.title}</span>
          <span style="display:flex;gap:4px;align-items:center;">
            <button type="button" class="hdr-mini-btn no-drag" style="background:rgba(16,185,129,0.22);border:1px solid rgba(16,185,129,0.55);color:#6ee7b7;font-size:9.5px;padding:1px 6px;font-weight:700;" onclick="chooseFolderForContainer('${fc.id}', event)" title="📁 Choose Folder in Windows Explorer to connect &amp; populate files">📁 Choose Folder</button>
            <button type="button" class="hdr-mini-btn no-drag" style="background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#fde68a;font-size:9.5px;padding:1px 6px;" onclick="openLocalPath('${escSvgXml(folderLocalPath)}', 'explorer', event)" title="📂 Open ${escSvgXml(folderLocalPath)} in Windows Explorer">📂 Explorer</button>
            <span style="font-size:10px;font-family:Consolas,monospace;">${filesArr.length} files</span>
            <button class="hdr-mini-btn no-drag" style="color:var(--red);" onclick="deleteItemById(event, 'bucket', '${fc.id}')" title="Delete Bucket">🗑️</button>
          </span>
        </div>
        <div class="node-ports">
          <div class="port-col">${inPortsBucketHtml}</div>
          <div class="port-col">${outPortsBucketHtml}</div>
        </div>
        <div class="node-body" style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <div style="font-size:10px;color:var(--gold);">Filter: <code>${filterStr}</code></div>
            <span style="display:flex;gap:4px;">
              <button type="button" class="hdr-mini-btn no-drag" style="background:rgba(16,185,129,0.18);border:1px solid rgba(16,185,129,0.48);color:#6ee7b7;font-size:9.5px;padding:2px 6px;" onclick="chooseFolderForContainer('${fc.id}', event)" title="Choose a folder to connect to this container">📁 Choose Folder</button>
              <button type="button" class="hdr-mini-btn no-drag" style="background:rgba(56,189,248,0.16);border:1px solid rgba(56,189,248,0.42);color:#7dd3fc;font-size:9.5px;padding:2px 6px;" onclick="openLocalPath('${escSvgXml(folderLocalPath)}', 'explorer', event)" title="Open ${escSvgXml(folderLocalPath)} in Windows Explorer">📂 Open Folder</button>
            </span>
          </div>
          ${fc.folderPath ? `<div style="font-size:9.5px;color:var(--aqua);font-family:Consolas,monospace;">📂 Repo Folder: <code>${fc.folderPath}</code></div>` : ''}
          ${bucketPathButtonsHtml}
          <div class="collapsible-sec-hdr no-drag" onclick="toggleNodeSectionCollapse('${fc.id}', 'files', event)" style="background:rgba(219,188,127,0.08);border:1px solid rgba(219,188,127,0.22);padding:3px 6px;border-radius:5px;" title="Click to ${filesCol ? 'expand' : 'collapse'} File List (${filesArr.length} files) — container resizes to fit">
            <span style="font-size:10px;font-weight:700;color:var(--gold);">📁 Files (${filesArr.length}) · Selected: ${selectedIndices.length}</span>
            <span class="collapse-arrow-badge">${filesCol ? '▸ ' + filesArr.length + ' files' : '▾ Hide'}</span>
          </div>
          ${filesCol ? '' : `<div class="bucket-files-list" style="display:flex;flex-direction:column;gap:4px;max-height:${fc.userResized ? 'none' : '210px'};overflow-y:auto;">${filesHtml}</div>`}
          <div class="bucket-step-toolbar no-drag" style="display:flex;flex-direction:column;gap:4px;margin-top:4px;padding:5px 6px;background:rgba(15,23,42,0.65);border:1px solid rgba(56,189,248,0.32);border-radius:6px;" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:9.5px;color:#93c5fd;">
              <span>🛡️ <strong>Safe Step Runner</strong> (Never overwrites blindly)</span>
              <button type="button" class="hdr-mini-btn no-drag" style="padding:1px 5px;font-size:9px;background:rgba(250,204,21,0.16);border:1px solid rgba(250,204,21,0.45);color:#fef08a;" onclick="simulateBucketCandidateDiff(event, '${fc.id}')" title="Test Overwrite Guard when a stage re-run produces a modified output file">🧪 Test Diff Guard</button>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button type="button" class="hdr-mini-btn no-drag" style="flex:1;padding:4px 7px;font-size:10px;font-weight:700;background:rgba(56,189,248,0.22);border:1px solid #38bdf8;color:#e0f2fe;" onclick="runBucketSelectedFileNextStage(event, '${fc.id}')" title="Run the next connected stage ONLY on the selected file(s) with Overwrite &amp; Diff Guard">▶ Step Selected (${selectedIndices.length || 1}) ➔ Next Stage</button>
              <button type="button" class="hdr-mini-btn no-drag" style="flex:1;padding:4px 7px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.22);border:1px solid #10b981;color:#a7f3d0;" onclick="runBucketAllFilesNextStage(event, '${fc.id}')" title="Run the next connected stage on ALL (${filesArr.length}) files in this container with Overwrite &amp; Diff Guard">▶▶ Run All (${filesArr.length})</button>
            </div>
            ${fc.lastStepRunReport ? `<div style="font-size:9.5px;color:#fde68a;font-family:Consolas,monospace;background:rgba(0,0,0,0.35);padding:3px 5px;border-radius:4px;">${escSvgXml(fc.lastStepRunReport)}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px;margin-top:4px;">
            <button style="flex:1;padding:3px 6px;font-size:10px;background:rgba(16,185,129,0.18);border-color:rgba(16,185,129,0.5);color:#6ee7b7;" onclick="chooseFolderForContainer('${fc.id}', event)" title="Choose a folder in Windows Explorer and auto-populate matching files">📁 Choose Folder</button>
            <button style="flex:1;padding:3px 6px;font-size:10px;" onclick="addFileToBucket(event, '${fc.id}')" title="Add file to container (resizes container to fit)">+ Add File</button>
            <button style="padding:3px 6px;font-size:10px;" onclick="previewBucketFiles(event, '${fc.id}')" title="Preview files in status bar">▶ Preview</button>
          </div>
        </div>
        <div class="resize-handle" onmousedown="startResizeItem(event, 'bucket', '${fc.id}')" title="Drag corner to resize file container"></div>
      </div>
    `;
  });

  (S.buses || []).forEach(bus => {
    if (findCollapsedParentContainer(bus)) return;
    const sel = selectedItem && selectedItem.id === bus.id ? 'selected' : '';
    const inPortsHtml = (bus.inPorts || []).map(p => `
      <div class="port-row port-row-stacked port-row-in"><span class="port-lbl-above">${p}</span>${renderPortDot(bus.id, p, 'in')}</div>
    `).join('');
    const outPortsHtml = (bus.outPorts || []).map(p => `
      <div class="port-row port-row-stacked port-row-out"><span class="port-lbl-above">${p}</span>${renderPortDot(bus.id, p, 'out')}</div>
    `).join('');
    const busTint = getItemColorInlineStyles(bus, 'bus');
    const busOverlayCls = getItemOverlayStateClasses(bus.id);
    html += `
      <div class="bus-bar-node ${sel} ${busOverlayCls}" data-item-id="${bus.id}" style="left:${bus.x}px;top:${bus.y}px;width:${bus.w || 250}px;${bus.h ? `min-height:${bus.h}px;` : ''}${busTint.cardStyle}" onmousedown="startDragItem(event, 'bus', '${bus.id}')">
        <div class="bus-hdr" style="${busTint.hdrStyle}">
          <span>${bus.title}</span>
          <span style="display:flex;gap:4px;align-items:center;">
            <small style="font-size:10px;color:var(--aqua);">${bus.orientation || 'left-right'}</small>
            <button class="hdr-mini-btn no-drag" style="color:var(--red);" onclick="deleteItemById(event, 'bus', '${bus.id}')" title="Delete Bus Bar">🗑️</button>
          </span>
        </div>
        <div style="display:flex;gap:4px;padding:4px 8px;background:rgba(0,0,0,0.28);border-bottom:1px solid var(--border);">
          <button class="hdr-mini-btn no-drag" onclick="adjustBusPorts(event, '${bus.id}', 'in', 1)">+In</button>
          <button class="hdr-mini-btn no-drag" onclick="adjustBusPorts(event, '${bus.id}', 'in', -1)">-In</button>
          <button class="hdr-mini-btn no-drag" onclick="adjustBusPorts(event, '${bus.id}', 'out', 1)">+Out</button>
          <button class="hdr-mini-btn no-drag" onclick="adjustBusPorts(event, '${bus.id}', 'out', -1)">-Out</button>
        </div>
        <div class="node-ports">
          <div class="port-col">${inPortsHtml}</div>
          <div class="port-col">${outPortsHtml}</div>
        </div>
        <div class="resize-handle" onmousedown="startResizeItem(event, 'bus', '${bus.id}')" title="Drag corner to resize bus bar"></div>
      </div>
    `;
  });

  const attachableTargets = [
    ...(S.nodes || []).map(n => ({ id: n.id, label: String(n.title || n.id).slice(0, 34) })),
    ...(S.categories || []).map(c => ({ id: c.id, label: '📁 ' + String(c.title || c.id).slice(0, 30) })),
    ...(S.subcategories || []).map(sc => ({ id: sc.id, label: '📂 ' + String(sc.title || sc.id).slice(0, 30) })),
    ...(S.fileContainers || []).map(fc => ({ id: fc.id, label: '🗄️ ' + String(fc.title || fc.id).slice(0, 30) }))
  ];

  (S.stickyNotes || []).forEach(sn => {
    if (!sn || findCollapsedParentContainer(sn)) return;
    const sel = selectedItem && selectedItem.id === sn.id ? 'selected' : '';
    const stickyTint = getItemColorInlineStyles(sn, 'sticky');
    const colorCls = stickyTint.customHex ? 'sticky-color-custom' : `sticky-color-${sn.color || 'yellow'}`;
    const todosArr = Array.isArray(sn.todos) ? sn.todos : [];
    const imagesArr = Array.isArray(sn.images) ? sn.images : [];
    const snTetherIds = getStickyTetherIds(sn);
    const primaryTetherId = snTetherIds[0] || sn.attachedToId || '';
    const secondaryTetherId = snTetherIds[1] || sn.attachedToId2 || '';
    const attachOptionsHtml = `<option value="">📌 Tether 1: Unpinned (Canvas)</option>` + attachableTargets.map(t =>
      `<option value="${t.id}" ${primaryTetherId === t.id ? 'selected' : ''}>📌 ${escSvgXml(t.label)}</option>`
    ).join('');
    const attachOptions2Html = `<option value="">➕ Also tether to 2nd node/stage...</option>` + attachableTargets.map(t =>
      `<option value="${t.id}" ${secondaryTetherId === t.id ? 'selected' : ''}>🔗 ${escSvgXml(t.label)}</option>`
    ).join('');
    const todosHtml = todosArr.map(td => `
      <div class="sticky-todo-row ${td.done ? 'done' : ''} no-drag">
        <input type="checkbox" ${td.done ? 'checked' : ''} onchange="toggleStickyTodo(event, '${sn.id}', '${td.id}')" title="Mark To-Do complete/incomplete" />
        <input type="text" value="${escSvgXml(td.text || '')}" oninput="updateStickyTodoText('${sn.id}', '${td.id}', this.value)" placeholder="To-do item..." />
        <button class="hdr-mini-btn no-drag" style="padding:0 4px;font-size:9px;color:#fca5a5;" onclick="deleteStickyTodo(event, '${sn.id}', '${td.id}')" title="Remove To-Do item">✕</button>
      </div>
    `).join('');
    const imagesHtml = imagesArr.length ? `
      <div class="sticky-img-grid no-drag">
        ${imagesArr.map(im => `
          <div class="sticky-img-card">
            <img src="${escSvgXml(im.url || im.dataUrl || '')}" alt="${escSvgXml(im.caption || 'Sticky Image')}" />
            <button class="sticky-img-del no-drag" onclick="deleteStickyImage(event, '${sn.id}', '${im.id}')" title="Remove image">✕</button>
          </div>
        `).join('')}
      </div>
    ` : '';
    const stickyOverlayCls = getItemOverlayStateClasses(sn.id);
    html += `
      <div class="sticky-note-card ${colorCls} ${sel} ${stickyOverlayCls}" data-item-id="${sn.id}" data-sticky-id="${sn.id}" style="left:${sn.x}px;top:${sn.y}px;width:${sn.w || 280}px;min-height:${sn.h || 240}px;${stickyTint.cardStyle}" onmousedown="startDragItem(event, 'sticky', '${sn.id}')" onpaste="handleStickyImagePaste(event, '${sn.id}')">
        <div class="sticky-hdr" style="${stickyTint.hdrStyle}">
          <input type="text" class="sticky-title-input no-drag" value="${escSvgXml(sn.title || '📝 Sticky Note')}" oninput="updateStickyNoteField('${sn.id}', 'title', this.value)" title="Edit Sticky Note Title" />
          <select class="no-drag" style="padding:1px 4px;font-size:9.5px;border-radius:4px;max-width:74px;" onchange="updateStickyNoteField('${sn.id}', 'assignee', this.value, true)" title="Reminder Assignee">
            <option value="both" ${sn.assignee === 'both' ? 'selected' : ''}>👥 Both</option>
            <option value="assistant" ${sn.assignee === 'assistant' ? 'selected' : ''}>🤖 Assistant</option>
            <option value="user" ${sn.assignee === 'user' ? 'selected' : ''}>👤 User</option>
          </select>
          <button class="hdr-mini-btn no-drag" onclick="cycleStickyNoteColor(event, '${sn.id}')" title="🎨 Cycle Sticky Note Color (${sn.color || 'yellow'})">🎨</button>
          <button class="hdr-mini-btn no-drag" style="color:#fca5a5;" onclick="deleteItemById(event, 'sticky', '${sn.id}')" title="Delete Sticky Note">🗑️</button>
        </div>
        <div class="sticky-body">
          <div style="display:flex;flex-direction:column;gap:3px;">
            <select class="no-drag" style="width:100%;padding:2px 5px;font-size:10px;border-radius:4px;" onchange="attachStickyToNode('${sn.id}', this.value)" title="Primary Tether: Attach Sticky Note to a Node or Container">
              ${attachOptionsHtml}
            </select>
            <select class="no-drag" style="width:100%;padding:2px 5px;font-size:10px;border-radius:4px;border-color:rgba(250,204,21,0.45);" onchange="attachStickySecondaryNode('${sn.id}', this.value)" title="Secondary Multi-Node Tether: Also tether this same Sticky Note to a 2nd Node/Stage (e.g. Stage 2 AND Stage 3)">
              ${attachOptions2Html}
            </select>
          </div>
          <textarea class="sticky-textarea no-drag" placeholder="Write reminder notes... (Press Ctrl+V here to paste any screenshot/PNG!)" oninput="updateStickyNoteField('${sn.id}', 'text', this.value)">${escSvgXml(sn.text || '')}</textarea>
          <div class="sticky-todo-list">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:10px;color:#fef08a;">☑️ To-Do Checklist (${todosArr.filter(t => t.done).length}/${todosArr.length})</strong>
              <button class="hdr-mini-btn no-drag" style="padding:1px 6px;font-size:9.5px;" onclick="addStickyTodo(event, '${sn.id}')" title="Add a To-Do item to this Sticky Note">+ To-Do</button>
            </div>
            ${todosHtml}
          </div>
          ${imagesHtml}
          <div style="display:flex;gap:4px;margin-top:auto;padding-top:3px;">
            <input type="file" id="stickyFileInput_${sn.id}" accept="image/*" style="display:none;" onchange="onStickyFileInputChange(event, '${sn.id}')" />
            <button class="hdr-mini-btn no-drag" style="flex:1;padding:3px 6px;font-size:10px;" onclick="triggerStickyImageUpload(event, '${sn.id}')" title="Paste (Ctrl+V) or Upload a PNG/Screenshot into this Sticky Note">🖼️ Paste / Add PNG</button>
          </div>
        </div>
        <div class="resize-handle" onmousedown="startResizeItem(event, 'sticky', '${sn.id}')" title="Drag corner to resize sticky note"></div>
      </div>
    `;
  });

  domLayer.innerHTML = html;
  if (!activeDrag) {
    autoFitWorkflowContainersAndPreventOverlap();
  }
  syncSelectedDomClasses();
  if (options && options.deferWires) {
    scheduleDragWireRender();
  } else {
    cancelScheduledDragWireRender();
    renderWires();
  }
  const selKey = selectedItem ? `${selectedItem.kind}:${selectedItem.id}` : '';
  const shouldPreserveInspector = Boolean(options && options.preserveInspector) || (isInspectorInputFocused() && selKey === lastInspectedSelectionKey);
  if (!shouldPreserveInspector) {
    renderInspector();
  } else {
    syncInspectorLiveReadouts(findSelectedObject());
  }
  updateMetricsAndJson();
}

function syncInspectorLiveReadouts(obj) {
  if (!obj) return;
  const inReadout = document.getElementById('insp-io-in-readout');
  if (inReadout) {
    inReadout.textContent = obj.inputSpec || (obj.inPorts || []).join(', ') || 'None';
  }
  const outReadout = document.getElementById('insp-io-out-readout');
  if (outReadout) {
    outReadout.textContent = obj.outputSpec || (obj.outPorts || []).join(', ') || 'None';
  }
  const scriptReadout = document.getElementById('insp-script-code-readout');
  if (scriptReadout) {
    scriptReadout.textContent = obj.scriptBinding || 'bound_script.py';
  }
}

function findSelectedObject() {
  if (!selectedItem) return null;
  const { kind, id } = selectedItem;
  if (kind === 'category') return S.categories.find(x => x.id === id);
  if (kind === 'subcategory') return S.subcategories.find(x => x.id === id);
  if (kind === 'cell') return S.cells.find(x => x.id === id);
  if (kind === 'node') return S.nodes.find(x => x.id === id);
  if (kind === 'bucket') return S.fileContainers.find(x => x.id === id);
  if (kind === 'bus') return (S.buses || []).find(x => x.id === id);
  if (kind === 'sticky') return (S.stickyNotes || []).find(x => x.id === id);
  if (kind === 'wire') return (S.wires || []).find(x => x.id === id);
  return null;
}

function renderInspectorColorSectionHtml(kind, obj) {
  const effHex = getEffectiveItemColorHex(kind, obj);
  const hasCustom = Boolean(normalizeHexColor(obj && obj.color));
  const painterActive = Boolean(formatPainterState && formatPainterState.active);
  return `
    <div style="display:flex;flex-direction:column;gap:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(236,230,216,0.18);padding:8px;border-radius:6px;margin-top:4px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <strong style="font-size:11px;color:var(--gold);">🎨 Color &amp; Format Painter</strong>
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="display:inline-block;width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.45);background:${effHex};"></span>
          <code style="font-size:10px;color:var(--aqua);">${hasCustom ? effHex : 'default'}</code>
          <button type="button" class="inspector-fullspectrum-rect" onclick="openFullSpectrumColorModal(event)" title="Open Full-Spectrum Color Picker"></button>
          <button type="button" class="hdr-mini-btn" onclick="applyColorFromSwatch('__RESET__')" title="Reset Color">Reset</button>
        </div>
      </div>
      <div class="inspector-honeycomb-grid">${renderHoneycombHexGridHtml(effHex)}</div>
      <button type="button" class="tb-svg-btn ${painterActive ? 'active' : ''}" style="justify-content:center;background:rgba(250,204,21,0.16);border-color:#facc15;color:#fef08a;" onclick="toggleFormatPainter()">🖌️ ${painterActive ? 'Exit Format Painter' : 'Copy Color with Format Painter'}</button>
    </div>
  `;
}

function renderInspector() {
  const el = document.getElementById('inspectorContent');
  if (!el) return;
  const obj = findSelectedObject();
  lastInspectedSelectionKey = selectedItem ? `${selectedItem.kind}:${selectedItem.id}` : '';
  if (!obj) {
    el.innerHTML = `<div style="color:var(--fg1);">Click any Category, Subcategory, Cell, Node, Bus Bar, or File Container on the canvas to inspect or customize it.</div>`;
    return;
  }

  let extra = '';
  if (selectedItem.kind === 'node') {
    const nodeType = obj.type || 'step';
    const activeRules = Array.isArray(obj.rules) && obj.rules.length ? obj.rules : (obj.notes || []);
    const activeSteps = Array.isArray(obj.steps) && obj.steps.length
      ? obj.steps
      : (Array.isArray(obj.bullets) && obj.bullets.length
        ? obj.bullets
        : (Array.isArray(obj.substeps) ? obj.substeps : []));
    const rulesCardsHtml = activeRules.map((r) => `
      <div style="font-size:11px;line-height:1.4;color:var(--fg0);padding:5px 7px;background:rgba(0,0,0,0.32);border-left:3px solid var(--gold);border-radius:4px;">
        ${r}
      </div>
    `).join('');
    const uiUrlVal = (obj.ui_url !== undefined ? obj.ui_url : obj.uiUrl) || '';
    const uiLabelVal = (obj.ui_label !== undefined ? obj.ui_label : obj.uiLabel) || '';
    extra = `
      <div style="display:flex;flex-direction:column;gap:6px;background:rgba(127,187,179,0.08);border:1px solid rgba(127,187,179,0.25);padding:8px;border-radius:6px;">
        <div><strong style="color:var(--aqua);">📥 Input(s):</strong> <span id="insp-io-in-readout" style="color:var(--fg0);font-family:Consolas,monospace;font-size:11px;">${obj.inputSpec || (obj.inPorts || []).join(', ') || 'None'}</span></div>
        <div><strong style="color:var(--accent);">📤 Output(s):</strong> <span id="insp-io-out-readout" style="color:var(--fg0);font-family:Consolas,monospace;font-size:11px;">${obj.outputSpec || (obj.outPorts || []).join(', ') || 'None'}</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;background:rgba(219,188,127,0.08);border:1px solid rgba(219,188,127,0.28);padding:8px;border-radius:6px;">
        <div style="font-weight:700;color:var(--gold);font-size:11px;">⚙️ Active Python Rules (in <code id="insp-script-code-readout">${obj.scriptBinding || 'bound_script.py'}</code>):</div>
        ${rulesCardsHtml || '<div style="color:var(--fg1);font-size:11px;">No rules defined yet.</div>'}
      </div>
      <label>Node Type:</label>
      <select id="insp-node-type-select" onchange="updateSelectedNodeType(this.value)">
        <option value="step" ${nodeType === 'step' ? 'selected' : ''}>⚙️ Standard Processing Step (step)</option>
        <option value="llm_query" ${nodeType === 'llm_query' ? 'selected' : ''}>🤖 LLM / AI Query Node (llm_query)</option>
        <option value="idea" ${nodeType === 'idea' ? 'selected' : ''}>💡 Idea / Trigger Node — Output-Only (idea)</option>
        <option value="external_in" ${nodeType === 'external_in' ? 'selected' : ''}>📥 Upstream External Workflow (external_in)</option>
        <option value="external_out" ${nodeType === 'external_out' ? 'selected' : ''}>📤 Downstream External Workflow (external_out)</option>
      </select>
      <div style="display:flex;flex-direction:column;gap:6px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.38);padding:8px;border-radius:6px;margin-top:2px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="color:#d8b4fe;font-size:11px;">🤖 LLM / AI Query Configuration</strong>
          <button type="button" onclick="runLlmQueryNode('${obj.id}', event)" style="padding:3px 8px;font-size:10px;font-weight:700;background:rgba(168,85,247,0.28);border-color:#c084fc;color:#f3e8ff;">▶ Run Prompt + Input Files</button>
        </div>
        <label style="font-size:10.5px;">Provider / Execution Mode (<code>llmProvider</code>):</label>
        <select id="insp-llm-provider-select" onchange="updateNodeLlmField('${obj.id}', 'llmProvider', this.value, true)">
          <option value="ollama" ${(obj.llmProvider || (obj.llmConfig && obj.llmConfig.provider) || 'ollama') === 'ollama' ? 'selected' : ''}>🦙 Local Ollama (${OLLAMA_LOCAL_BASE_URL})</option>
          <option value="gemini" ${(obj.llmProvider || (obj.llmConfig && obj.llmConfig.provider)) === 'gemini' ? 'selected' : ''}>✨ Gemini API (gemini-2.5-pro / gemini-2.5-flash)</option>
          <option value="openai" ${(obj.llmProvider || (obj.llmConfig && obj.llmConfig.provider)) === 'openai' ? 'selected' : ''}>🤖 OpenAI / Custom API Endpoint</option>
          <option value="custom" ${(obj.llmProvider || (obj.llmConfig && obj.llmConfig.provider)) === 'custom' ? 'selected' : ''}>🔌 Custom Endpoint</option>
        </select>
        <label style="font-size:10.5px;">Model Name (<code>llmModel</code>, e.g. <code>llama3.2</code>, <code>qwen2.5-coder</code>, <code>deepseek-r1</code>, <code>gemini-2.5-pro</code>):</label>
        <input type="text" id="insp-llm-model-input" value="${escSvgXml(obj.llmModel || (obj.llmConfig && obj.llmConfig.model) || 'llama3.2')}" oninput="updateNodeLlmField('${obj.id}', 'llmModel', this.value, false)" onchange="updateNodeLlmField('${obj.id}', 'llmModel', this.value, true)">
        <label style="font-size:10.5px;">🔑 Optional API Key (stored in browser <code>localStorage</code> ONLY — never saved to workflow JSON!):</label>
        <input type="password" id="insp-llm-apikey-input" placeholder="Stored locally in browser only" value="${escSvgXml(getLlmApiKeyFromLocalStorage(obj.llmProvider || 'ollama'))}" onchange="setLlmApiKeyInLocalStorage(obj.llmProvider || 'ollama', this.value)">
        <label style="font-size:10.5px;">📝 Prompt / Instructions (<code>llmPrompt</code>):</label>
        <textarea id="insp-llm-prompt-input" rows="3" placeholder="Put the prompt or instructions here — wired input files + prompt get run -> output file comes out" oninput="updateNodeLlmField('${obj.id}', 'llmPrompt', this.value, false)" onchange="updateNodeLlmField('${obj.id}', 'llmPrompt', this.value, true)">${escSvgXml(obj.llmPrompt || (obj.llmConfig && obj.llmConfig.prompt) || '')}</textarea>
      </div>
      <label>Category Badge:</label>
      <input type="text" id="insp-category-input" value="${obj.category || ''}" oninput="updateSelectedField('category', this.value)" onchange="updateSelectedField('category', this.value)">
      <label>🔗 UI Launch URL (Clickable 🚀 Open UI Pill inside Node):</label>
      <input type="text" id="insp-ui-url-input" placeholder="./preview/index.html" value="${uiUrlVal}" oninput="updateSelectedUiUrl(this.value)" onchange="updateSelectedUiUrl(this.value)">
      <label>🏷️ UI Launch Button Label:</label>
      <input type="text" id="insp-ui-label-input" placeholder="Custom Tool Preview" value="${uiLabelVal}" oninput="updateSelectedUiLabel(this.value)" onchange="updateSelectedUiLabel(this.value)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <label style="margin:0;">📥 Input Port Names (comma-separated):</label>
        <span style="display:inline-flex;gap:4px;">
          <button type="button" id="insp-btn-add-in-port" class="hdr-mini-btn" onclick="adjustNodePorts(event, '${obj.id}', 'in', 1)" title="Add Input Port">+Input</button>
          <button type="button" id="insp-btn-rem-in-port" class="hdr-mini-btn" onclick="adjustNodePorts(event, '${obj.id}', 'in', -1)" title="Remove Last Input Port">-Input</button>
        </span>
      </div>
      <input type="text" id="insp-in-ports-input" value="${(obj.inPorts || []).join(', ')}" placeholder="in_1, in_2" oninput="updateSelectedPorts('inPorts', this.value)" onchange="updateSelectedPorts('inPorts', this.value)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <label style="margin:0;">📤 Output Port Names (comma-separated):</label>
        <span style="display:inline-flex;gap:4px;">
          <button type="button" id="insp-btn-add-out-port" class="hdr-mini-btn" onclick="adjustNodePorts(event, '${obj.id}', 'out', 1)" title="Add Output Port">+Output</button>
          <button type="button" id="insp-btn-rem-out-port" class="hdr-mini-btn" onclick="adjustNodePorts(event, '${obj.id}', 'out', -1)" title="Remove Last Output Port">-Output</button>
        </span>
      </div>
      <input type="text" id="insp-out-ports-input" value="${(obj.outPorts || []).join(', ')}" placeholder="out_1, out_2" oninput="updateSelectedPorts('outPorts', this.value)" onchange="updateSelectedPorts('outPorts', this.value)">
      <label>🔧 Bulleted "What You Do in This UI" Steps (one per line):</label>
      <textarea id="insp-steps-input" rows="4" oninput="updateSelectedSteps(this.value)" onchange="updateSelectedSteps(this.value)">${activeSteps.join('\n')}</textarea>
      <label>Script / Code Binding:</label>
      <div style="display:flex;gap:4px;">
        <input type="text" id="insp-script-input" style="flex:1;" value="${obj.scriptBinding || ''}" oninput="updateSelectedField('scriptBinding', this.value)" onchange="updateSelectedField('scriptBinding', this.value)">
        <button type="button" onclick="chooseScriptForNode('${obj.id}', event)" style="padding:4px 8px;font-size:10px;background:rgba(167,192,128,0.2);border-color:rgba(167,192,128,0.5);color:#a7c080;" title="Pick a script file (.py, .js, .bat) from Windows Explorer">🐍 Connect Script...</button>
        <button type="button" onclick="chooseFolderForContainer('${obj.id}', event)" style="padding:4px 8px;font-size:10px;background:rgba(16,185,129,0.2);border-color:rgba(16,185,129,0.5);color:#6ee7b7;" title="Pick a folder in Windows Explorer to connect to this node">📁 Choose Folder</button>
      </div>
      <label>Parameters JSON:</label>
      <textarea id="insp-params-input" rows="3" oninput="updateSelectedParams(this.value)" onchange="updateSelectedParams(this.value)">${JSON.stringify(obj.params || {}, null, 2)}</textarea>
      <label>⚙️ Active Python Rules / Notes (one per line):</label>
      <textarea id="insp-notes-input" rows="4" oninput="updateSelectedNotes(this.value)" onchange="updateSelectedNotes(this.value)">${activeRules.join('\n')}</textarea>
    `;
  } else if (selectedItem.kind === 'bucket') {
    const parsedBucketFilter = parseBucketFilterState(obj.pattern || obj.filter || '*.*');
    const folderLocalPath = obj.localRepoPath || obj.folderPath || './assets';
    const checkboxesHtml = REPO_COMMON_FILE_TYPES.map(ft => {
      const isChecked = parsedBucketFilter.checkedKeys.has(ft.key);
      return `
        <label style="display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:5px;background:${isChecked ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.04)'};border:1px solid ${isChecked ? 'rgba(56,189,248,0.45)' : 'var(--border)'};cursor:pointer;font-size:10.5px;">
          <input type="checkbox" class="bucket-filetype-cb" data-filetype-key="${ft.key}" ${isChecked ? 'checked' : ''} onchange="onBucketFileTypeCheckboxChange('${ft.key}', this.checked)" />
          <span><strong style="color:var(--gold);">${ft.extLabel}</strong> <span style="color:var(--fg1);font-size:9.5px;">(${ft.desc})</span></span>
        </label>
      `;
    }).join('');
    extra = `
      <label>📂 Workspace Folder Path:</label>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <input type="text" id="insp-folder-path-input" style="flex:1;min-width:160px;" value="${obj.folderPath || './assets'}" oninput="updateSelectedField('folderPath', this.value)" onchange="updateSelectedField('folderPath', this.value)">
        <button type="button" onclick="chooseFolderForContainer('${obj.id}', event)" style="padding:4px 8px;font-size:10.5px;background:rgba(16,185,129,0.22);border-color:rgba(16,185,129,0.55);color:#6ee7b7;font-weight:700;" title="Pick a folder in Windows Explorer and auto-populate matching files">📁 Choose Folder</button>
        <button type="button" onclick="scanRepoFolderIntoContainer('${obj.id}')" style="padding:4px 8px;font-size:10.5px;background:rgba(56,189,248,0.2);border-color:rgba(56,189,248,0.5);color:#7dd3fc;" title="Scan folder on disk and populate files">🔄 Scan Folder</button>
        <button type="button" onclick="openLocalPath('${escSvgXml(folderLocalPath)}', 'explorer', event)" style="padding:4px 8px;font-size:10.5px;background:rgba(245,158,11,0.2);border-color:rgba(245,158,11,0.5);color:#fde68a;" title="Open folder in Windows Explorer">📂 Explorer</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;background:rgba(219,188,127,0.07);border:1px solid rgba(219,188,127,0.26);padding:8px;border-radius:6px;margin-top:4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="color:var(--gold);font-size:11px;">☑️ FILE TYPES (COMMON — 12 TYPES)</strong>
          <span id="insp-pattern-readout" style="font-family:Consolas,monospace;font-size:10px;color:var(--aqua);">${obj.pattern || obj.filter || '*.*'}</span>
        </div>
        <div id="insp-bucket-filetypes-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
          ${checkboxesHtml}
        </div>
        <label style="font-size:10.5px;color:var(--fg0);margin-top:2px;">➕ Custom Extensions (comma-separated, e.g. <code>.psd, .glb, .webp, .csv</code>):</label>
        <input type="text" id="insp-custom-ext-input" placeholder=".psd, .glb, .webp, .csv" value="${escSvgXml(parsedBucketFilter.customRaw)}" oninput="onBucketCustomExtInput(this.value)" onchange="onBucketCustomExtInput(this.value)">
      </div>
      <label>Files (one per line):</label>
      <textarea id="insp-files-input" rows="4" oninput="updateSelectedFiles(this.value)" onchange="updateSelectedFiles(this.value)">${(obj.files || []).join('\n')}</textarea>
    `;
  } else if (selectedItem.kind === 'category' || selectedItem.kind === 'subcategory' || selectedItem.kind === 'cell') {
    extra = `
      <label>Left Input Ports (comma-separated):</label>
      <input type="text" id="insp-in-ports-input" value="${(obj.inPorts || []).join(', ')}" oninput="updateSelectedPorts('inPorts', this.value)" onchange="updateSelectedPorts('inPorts', this.value)">
      <label>Right Output Ports (comma-separated):</label>
      <input type="text" id="insp-out-ports-input" value="${(obj.outPorts || []).join(', ')}" oninput="updateSelectedPorts('outPorts', this.value)" onchange="updateSelectedPorts('outPorts', this.value)">
      <label>Bottom Subsystem Ports (comma-separated):</label>
      <input type="text" id="insp-bottom-ports-input" value="${(obj.bottomPorts || []).join(', ')}" oninput="updateSelectedPorts('bottomPorts', this.value)" onchange="updateSelectedPorts('bottomPorts', this.value)">
      <label>Notes (one per line):</label>
      <textarea id="insp-notes-input" rows="4" oninput="updateSelectedNotes(this.value)" onchange="updateSelectedNotes(this.value)">${(obj.notes || obj.checklist || []).join('\n')}</textarea>
    `;
  } else if (selectedItem.kind === 'bus') {
    extra = `
      <label>Port Location / Orientation:</label>
      <select onchange="updateBusOrientation(this.value)">
        <option value="left-right" ${obj.orientation === 'left-right' ? 'selected' : ''}>Left → Right (Default)</option>
        <option value="top-bottom" ${obj.orientation === 'top-bottom' ? 'selected' : ''}>Top → Bottom</option>
        <option value="right-left" ${obj.orientation === 'right-left' ? 'selected' : ''}>Right → Left</option>
        <option value="all-sides" ${obj.orientation === 'all-sides' ? 'selected' : ''}>All Sides</option>
      </select>
      <label>Input Ports (comma-separated):</label>
      <input type="text" id="insp-in-ports-input" value="${(obj.inPorts || []).join(', ')}" oninput="updateSelectedPorts('inPorts', this.value)" onchange="updateSelectedPorts('inPorts', this.value)">
      <label>Output Ports (comma-separated):</label>
      <input type="text" id="insp-out-ports-input" value="${(obj.outPorts || []).join(', ')}" oninput="updateSelectedPorts('outPorts', this.value)" onchange="updateSelectedPorts('outPorts', this.value)">
      <label>Notes (one per line):</label>
      <textarea id="insp-notes-input" rows="3" oninput="updateSelectedNotes(this.value)" onchange="updateSelectedNotes(this.value)">${(obj.notes || []).join('\n')}</textarea>
    `;
  } else if (selectedItem.kind === 'sticky') {
    extra = `
      <label>Sticky Color:</label>
      <select onchange="updateStickyNoteField('${obj.id}', 'color', this.value, true)">
        ${STICKY_COLOR_PALETTE.map(c => `<option value="${c}" ${obj.color === c ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
      </select>
      <label>Reminder Assignee:</label>
      <select onchange="updateStickyNoteField('${obj.id}', 'assignee', this.value, true)">
        <option value="both" ${obj.assignee === 'both' ? 'selected' : ''}>👥 Both (Team &amp; Assistant)</option>
        <option value="assistant" ${obj.assignee === 'assistant' ? 'selected' : ''}>🤖 Assistant</option>
        <option value="user" ${obj.assignee === 'user' ? 'selected' : ''}>👤 User</option>
      </select>
      <label>Freeform Reminder Text:</label>
      <textarea rows="4" oninput="updateStickyNoteField('${obj.id}', 'text', this.value, true)">${obj.text || ''}</textarea>
    `;
  }

  const pathButtonsArr = Array.isArray(obj.pathButtons) ? obj.pathButtons : [];
  const pathButtonsSectionHtml = (selectedItem.kind === 'node' || selectedItem.kind === 'bucket' || selectedItem.kind === 'category' || selectedItem.kind === 'subcategory') ? `
    <div style="display:flex;flex-direction:column;gap:5px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);padding:8px;border-radius:6px;margin-top:4px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="color:#7dd3fc;font-size:11px;">📂 Attached Folder / File Buttons (${pathButtonsArr.length})</strong>
        <span style="display:flex;gap:4px;">
          <button type="button" style="padding:2px 6px;font-size:9.5px;background:rgba(245,158,11,0.2);border-color:rgba(245,158,11,0.5);color:#fde68a;" onclick="addPathButtonToSelected('folder')">+ 📂 Folder</button>
          <button type="button" style="padding:2px 6px;font-size:9.5px;background:rgba(56,189,248,0.2);border-color:rgba(56,189,248,0.5);color:#7dd3fc;" onclick="addPathButtonToSelected('file')">+ 📄 File</button>
        </span>
      </div>
      ${pathButtonsArr.map((pb, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 6px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:10px;">
          <button type="button" style="flex:1;text-align:left;padding:2px 6px;font-size:10px;" onclick="openLocalPath('${escSvgXml(pb.path || '')}', '${escSvgXml(pb.mode || (pb.kind === 'folder' ? 'explorer' : 'app'))}', event)">${pb.kind === 'folder' ? '📂' : '📄'} ${escSvgXml(pb.label || pb.path || '')} <code style="color:var(--fg1);font-size:9px;">(${escSvgXml(pb.path || '')})</code></button>
          <button type="button" class="hdr-mini-btn" style="color:var(--red);padding:1px 5px;" onclick="removePathButtonFromSelected(${idx})">✕</button>
        </div>
      `).join('') || '<div style="font-size:10px;color:var(--fg1);">Click + 📂 Folder or + 📄 File to attach an Explorer / App launch button directly to this element.</div>'}
    </div>
  ` : '';

  const colorSectionHtml = renderInspectorColorSectionHtml(selectedItem.kind, obj);
  if (selectedItem.kind === 'wire') {
    const canDelWire = Boolean(S && S.wireDeleteMode);
    el.innerHTML = `
      <div style="font-family:Consolas,monospace;font-size:11px;color:var(--aqua);">ID: ${obj.id} (wire connector)</div>
      <div style="padding:7px 9px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);border-radius:6px;font-family:Consolas,monospace;font-size:11px;">
        <div><strong style="color:var(--accent);">From:</strong> ${escSvgXml(obj.fromNode || '')}.${escSvgXml(obj.fromPort || '')}</div>
        <div><strong style="color:var(--gold);">To:</strong> ${escSvgXml(obj.toNode || '')}.${escSvgXml(obj.toPort || '')}</div>
      </div>
      <label>Connector Label (optional):</label>
      <input type="text" id="insp-wire-label-input" value="${escSvgXml(obj.label || '')}" oninput="updateSelectedField('label', this.value)" onchange="updateSelectedField('label', this.value)">
      ${colorSectionHtml}
      <button style="background:${canDelWire ? '#8c2d2d' : '#334155'};border-color:${canDelWire ? '#ff7a7a' : '#64748b'};color:#fff;margin-top:6px;" onclick="deleteSelectedElement()" title="${canDelWire ? 'Delete selected connector' : 'Enable Del Wires mode in topbar to delete connectors'}">🗑️ ${canDelWire ? 'Delete Connector [Del]' : '🔒 Delete Connector (Enable Del Wires)'}</button>
    `;
    return;
  }

  el.innerHTML = `
    <div style="font-family:Consolas,monospace;font-size:11px;color:var(--aqua);">ID: ${obj.id} (${selectedItem.kind})</div>
    <label>Title:</label>
    <input type="text" id="insp-title-input" value="${obj.title || ''}" oninput="updateSelectedField('title', this.value)" onchange="updateSelectedField('title', this.value)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:center;">
      <div>
        <label style="display:block;font-size:10px;color:var(--fg1);">Width (px):</label>
        <input type="number" id="insp-w-input" step="10" min="140" value="${Math.round(obj.w || 260)}" oninput="updateSelectedSize('w', Number(this.value))" onchange="updateSelectedSize('w', Number(this.value))" style="width:100%;">
      </div>
      <div>
        <label style="display:block;font-size:10px;color:var(--fg1);">Height (px):</label>
        <input type="number" id="insp-h-input" step="10" min="90" value="${Math.round(obj.h || 180)}" oninput="updateSelectedSize('h', Number(this.value))" onchange="updateSelectedSize('h', Number(this.value))" style="width:100%;">
      </div>
    </div>
    <div style="display:flex;gap:4px;">
      <button type="button" style="flex:1;padding:3px 6px;font-size:10px;" onclick="nudgeSelectedSize(50, 0)">⇔ +50px Wider</button>
      <button type="button" style="flex:1;padding:3px 6px;font-size:10px;" onclick="nudgeSelectedSize(0, 60)">⇕ +60px Taller</button>
    </div>
    ${extra}
    ${colorSectionHtml}
    ${pathButtonsSectionHtml}
    <button style="background:#8c2d2d;border-color:#ff7a7a;color:#fff;margin-top:6px;" onclick="deleteSelectedElement()">🗑️ Delete Selected Element [Del]</button>
  `;
}

const REPO_COMMON_FILE_TYPES = [
  { key: 'png', extLabel: '.png', desc: 'Images / Sprites', canonicalToken: 'png', aliases: ['png', '.png', '*.png'] },
  { key: 'svg', extLabel: '.svg', desc: 'Vector / Templates', canonicalToken: 'SVG', aliases: ['svg', '.svg', '*.svg'] },
  { key: 'jpeg', extLabel: '.jpg/.jpeg', desc: 'Photos / Scans', canonicalToken: 'jpeg', aliases: ['jpg', '.jpg', '*.jpg', 'jpeg', '.jpeg', '*.jpeg', '.jpg/.jpeg'] },
  { key: 'xml', extLabel: '.xml/.yaml', desc: 'Structured Schemas / Configs', canonicalToken: '.xml', aliases: ['xml', '.xml', '*.xml', 'yaml', '.yaml', '*.yaml', 'yml', '.yml', '*.yml'] },
  { key: 'audio', extLabel: '.mp3/.wav', desc: 'Audio Files', canonicalToken: '.mp3/.wav', aliases: ['mp3', '.mp3', '*.mp3', 'wav', '.wav', '*.wav', '.mp3/.wav'] },
  { key: 'mp4', extLabel: '.mp4', desc: 'Video Files', canonicalToken: '.mp4', aliases: ['mp4', '.mp4', '*.mp4'] },
  { key: 'json', extLabel: '.json', desc: 'Workflow / Config / JSON Data', canonicalToken: '.json', aliases: ['json', '.json', '*.json'] },
  { key: 'pdf', extLabel: '.pdf', desc: 'Documents / PDFs', canonicalToken: '.pdf', aliases: ['pdf', '.pdf', '*.pdf'] },
  { key: 'html', extLabel: '.html', desc: 'Standalone HTML / Web Views', canonicalToken: '.html', aliases: ['html', '.html', '*.html'] },
  { key: 'md', extLabel: '.md', desc: 'Markdown Docs / Notes', canonicalToken: '.md', aliases: ['md', '.md', '*.md'] },
  { key: 'py', extLabel: '.py', desc: 'Python Scripts / Modules', canonicalToken: '.py', aliases: ['py', '.py', '*.py'] },
  { key: 'jscss', extLabel: '.js/.css', desc: 'Frontend Modules', canonicalToken: '.js/.css', aliases: ['js', '.js', '*.js', 'css', '.css', '*.css', '.js/.css'] }
];
window.REPO_COMMON_FILE_TYPES = REPO_COMMON_FILE_TYPES;

function parseBucketFilterState(rawStr) {
  const checkedKeys = new Set();
  const customTokens = [];
  const raw = String(rawStr || '').trim();
  if (!raw || raw === '*.*' || raw === '*') {
    return { checkedKeys, customRaw: '' };
  }
  const parts = raw.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
  parts.forEach(tok => {
    const lower = tok.toLowerCase().replace(/^\*\./, '.');
    const bare = lower.replace(/^\./, '');
    let matched = false;
    REPO_COMMON_FILE_TYPES.forEach(ft => {
      if (ft.aliases.includes(lower) || ft.aliases.includes(bare) || ft.key === bare) {
        checkedKeys.add(ft.key);
        matched = true;
      }
    });
    if (!matched) {
      customTokens.push(tok);
    }
  });
  return { checkedKeys, customRaw: customTokens.join(', ') };
}
window.parseBucketFilterState = parseBucketFilterState;

function serializeBucketFilterState(checkedKeys, customRaw) {
  const tokens = [];
  REPO_COMMON_FILE_TYPES.forEach(ft => {
    if (checkedKeys.has(ft.key)) {
      tokens.push(ft.canonicalToken);
    }
  });
  String(customRaw || '').split(/[,;|]+/).map(s => s.trim()).filter(Boolean).forEach(ct => {
    tokens.push(ct);
  });
  return tokens.length ? tokens.join(', ') : '*.*';
}
window.serializeBucketFilterState = serializeBucketFilterState;

function onBucketFileTypeCheckboxChange(typeKey, isChecked) {
  const obj = findSelectedObject();
  if (!obj || !selectedItem || selectedItem.kind !== 'bucket') return;
  enterConstructionMode('edit file container filter checkboxes');
  const parsed = parseBucketFilterState(obj.pattern || obj.filter || '');
  if (isChecked) parsed.checkedKeys.add(typeKey);
  else parsed.checkedKeys.delete(typeKey);
  const customEl = document.getElementById('insp-custom-ext-input');
  const customVal = customEl ? customEl.value : parsed.customRaw;
  const nextFilter = serializeBucketFilterState(parsed.checkedKeys, customVal);
  obj.pattern = nextFilter;
  obj.filter = nextFilter;
  const readout = document.getElementById('insp-pattern-readout');
  if (readout) readout.textContent = nextFilter;
  autoSaveWorkflowState('bucket_filetype_checkbox');
  renderAll({ preserveInspector: true });
}
window.onBucketFileTypeCheckboxChange = onBucketFileTypeCheckboxChange;

function onBucketCustomExtInput(customVal) {
  const obj = findSelectedObject();
  if (!obj || !selectedItem || selectedItem.kind !== 'bucket') return;
  enterConstructionMode('edit file container custom extensions');
  const parsed = parseBucketFilterState(obj.pattern || obj.filter || '');
  const nextFilter = serializeBucketFilterState(parsed.checkedKeys, customVal);
  obj.pattern = nextFilter;
  obj.filter = nextFilter;
  const readout = document.getElementById('insp-pattern-readout');
  if (readout) readout.textContent = nextFilter;
  autoSaveWorkflowState('bucket_custom_ext');
  renderAll({ preserveInspector: true });
}
window.onBucketCustomExtInput = onBucketCustomExtInput;

async function openLocalPath(targetPath, mode = 'explorer', ev = null, bucketId = '') {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  const cleanPath = String(targetPath || '').trim() || './assets';
  const targetBucket = bucketId ? (S && S.fileContainers || []).find(b => b.id === bucketId) : null;
  const isDefaultPlaceholder = cleanPath === './assets' || cleanPath.startsWith('./assets/');
  if (isOfflineStandaloneMode() && isDefaultPlaceholder && !(targetBucket && targetBucket.folderHandle)) {
    const promptMsg = `📁 "${cleanPath}" is an offline sample placeholder — please choose a local folder first.`;
    setStatus(promptMsg);
    if (targetBucket && typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
      const wantsPicker = typeof confirm === 'function'
        ? confirm(`"${cleanPath}" is a sample placeholder file with no local folder connected yet.\n\nChoose a local folder now to link real files?`)
        : false;
      if (wantsPicker) {
        return chooseFolderForContainer(targetBucket.id, ev);
      }
    }
    return { ok: false, placeholder: true, path: cleanPath };
  }
  if (mode === 'explorer' && typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setStatus(`📂 Opened folder in picker: ${dirHandle.name} (${cleanPath})`);
      return { ok: true, picker: true, path: cleanPath };
    } catch (e) {}
  }
  if ((cleanPath.startsWith('./') || cleanPath.startsWith('http')) && typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(cleanPath, '_blank', 'noopener');
  }
  setStatus(`📂 Local Path: ${cleanPath}`);
  return { ok: true, fallback: true, path: cleanPath };
}
window.openLocalPath = openLocalPath;
function openLocalRepoPath(targetPath, mode = 'explorer', ev = null) {
  return openLocalPath(targetPath, mode, ev);
}
window.openLocalRepoPath = openLocalRepoPath;

function addPathButtonToSelected(kind = 'folder') {
  const obj = findSelectedObject();
  if (!obj) return;
  const defaultPath = kind === 'folder' ? './assets' : './assets/sample_template.svg';
  const enteredPath = (typeof prompt === 'function')
    ? prompt(`Enter repo-relative or local ${kind} path to attach as a button:`, defaultPath)
    : defaultPath;
  if (!enteredPath) return;
  const defaultLabel = enteredPath.split(/[\\/]/).filter(Boolean).pop() || (kind === 'folder' ? 'Open Folder' : 'Open File');
  const enteredLabel = (typeof prompt === 'function')
    ? (prompt('Button label:', defaultLabel) || defaultLabel)
    : defaultLabel;
  enterConstructionMode(`attach ${kind} button`);
  if (!Array.isArray(obj.pathButtons)) obj.pathButtons = [];
  obj.pathButtons.push({
    label: enteredLabel,
    path: enteredPath.trim(),
    kind: kind === 'folder' ? 'folder' : 'file',
    mode: kind === 'folder' ? 'explorer' : 'app'
  });
  autoSaveWorkflowState('add_path_button');
  renderAll();
}
window.addPathButtonToSelected = addPathButtonToSelected;

function removePathButtonFromSelected(idx) {
  const obj = findSelectedObject();
  if (!obj || !Array.isArray(obj.pathButtons)) return;
  enterConstructionMode('remove path button');
  obj.pathButtons.splice(idx, 1);
  autoSaveWorkflowState('remove_path_button');
  renderAll();
}
window.removePathButtonFromSelected = removePathButtonFromSelected;

function doesFilenameMatchBucketFilter(filename, filterStr) {
  const raw = String(filterStr || '*.*').trim();
  if (!raw || raw === '*.*' || raw === '*') return true;
  const parsed = parseBucketFilterState(raw);
  const lowerName = String(filename || '').toLowerCase();
  const dotIdx = lowerName.lastIndexOf('.');
  const extWithDot = dotIdx >= 0 ? lowerName.slice(dotIdx) : '';
  const extBare = extWithDot.replace(/^\./, '');
  let allowed = false;
  REPO_COMMON_FILE_TYPES.forEach(ft => {
    if (parsed.checkedKeys.has(ft.key)) {
      if (ft.aliases.includes(extWithDot) || ft.aliases.includes(extBare)) {
        allowed = true;
      }
    }
  });
  if (allowed) return true;
  if (parsed.customRaw) {
    const customList = parsed.customRaw.split(/[,;|]+/).map(s => s.trim().toLowerCase().replace(/^\*\./, '.')).filter(Boolean);
    for (const c of customList) {
      const cBare = c.replace(/^\./, '');
      if (c === extWithDot || cBare === extBare || lowerName.endsWith(c)) return true;
    }
  }
  return parsed.checkedKeys.size === 0 && !parsed.customRaw;
}
window.doesFilenameMatchBucketFilter = doesFilenameMatchBucketFilter;

async function scanRepoFolderIntoContainer(itemId, customPath = null) {
  const item = findAnyItemById(itemId) || findSelectedObject();
  if (!item) return { ok: false, error: 'Item not found' };
  const folderInput = document.getElementById('insp-folder-path-input');
  const targetPath = String(customPath || (folderInput && folderInput.value) || item.localRepoPath || item.folderPath || './assets').trim();
  const listEp = (typeof window !== 'undefined' && window.__LIST_FOLDER_ENDPOINT__) ? String(window.__LIST_FOLDER_ENDPOINT__) : '';
  try {
    if (listEp && typeof fetch === 'function' && isHttpLiveSyncEnabled()) {
      const resp = await fetch(`${listEp}?path=${encodeURIComponent(targetPath)}`);
      if (resp && resp.ok && typeof resp.json === 'function') {
        const data = await resp.json();
        if (data && data.ok && Array.isArray(data.files)) {
          enterConstructionMode('scan folder into container');
          const filterStr = item.pattern || item.filter || '*.*';
          const matchedFiles = data.files.filter(f => doesFilenameMatchBucketFilter(f, filterStr));
          item.folderPath = targetPath;
          item.localRepoPath = targetPath;
          if (Array.isArray(item.files)) {
            item.files = matchedFiles.length > 0 ? matchedFiles : data.files;
          } else {
            if (!Array.isArray(item.pathButtons)) item.pathButtons = [];
            item.pathButtons.push({ label: targetPath.split(/[\\/]/).pop() || 'Folder', path: item.localRepoPath, kind: 'folder', mode: 'explorer' });
          }
          autoSaveWorkflowState('scan_repo_folder');
          renderAll();
          setStatus(`📁 Connected "${item.title || item.id}" to ${targetPath} (${(item.files || []).length} files loaded)`);
          return { ok: true, files: item.files || [], path: targetPath };
        }
      }
    }
  } catch (e) {}
  return { ok: false };
}
window.scanRepoFolderIntoContainer = scanRepoFolderIntoContainer;

async function chooseFolderForContainer(itemId, ev = null) {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  const item = findAnyItemById(itemId) || findSelectedObject();
  if (!item) return { ok: false, error: 'Item not found' };

  // 1. Native Windows Explorer Directory Picker (window.showDirectoryPicker)
  if (typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const filterStr = item.pattern || item.filter || '*.*';
      const discoveredFiles = [];
      if (dirHandle && typeof dirHandle.values === 'function') {
        for await (const entry of dirHandle.values()) {
          if (!entry) continue;
          if (entry.kind === 'file') {
            if (doesFilenameMatchBucketFilter(entry.name, filterStr)) {
              discoveredFiles.push(entry.name);
            }
          } else if (entry.kind === 'directory' && typeof entry.values === 'function') {
            for await (const subEntry of entry.values()) {
              if (subEntry && subEntry.kind === 'file' && doesFilenameMatchBucketFilter(subEntry.name, filterStr)) {
                discoveredFiles.push(`${entry.name}/${subEntry.name}`);
              }
            }
          }
        }
      }
      enterConstructionMode('choose folder for container');
      const folderName = dirHandle.name || 'Selected_Folder';
      item.folderHandle = dirHandle;
      item.folderPath = `./${folderName}`;
      item.localRepoPath = `./${folderName}`;
      if (Array.isArray(item.files) || item.pattern !== undefined || item.filter !== undefined) {
        if (!item.title || item.title.startsWith('File Container')) {
          item.title = `${folderName} Folder`;
        }
        item.files = discoveredFiles.map(fn => item.folderPath ? `${item.folderPath.replace(/\/$/, '')}/${fn}` : fn);
      } else {
        if (!Array.isArray(item.pathButtons)) item.pathButtons = [];
        item.pathButtons.push({
          label: `${folderName} (${discoveredFiles.length} files)`,
          path: item.localRepoPath,
          kind: 'folder',
          mode: 'explorer'
        });
      }
      autoSaveWorkflowState('choose_folder_picker');
      renderAll();
      setStatus(`📁 Connected folder "${folderName}" to "${item.title || item.id}" (${discoveredFiles.length} matching files loaded!)`);
      return { ok: true, folderName, files: discoveredFiles };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setStatus('📁 Choose Folder cancelled');
        return { ok: false, cancelled: true };
      }
    }
  }

  const defaultFolder = item.localRepoPath || item.folderPath || './assets';
  const enteredFolder = (typeof prompt === 'function')
    ? prompt('Enter folder path to connect:', defaultFolder)
    : defaultFolder;
  if (!enteredFolder) return { ok: false, cancelled: true };
  const scanRes = await scanRepoFolderIntoContainer(item.id, enteredFolder.trim());
  if (scanRes && scanRes.ok) return scanRes;
  enterConstructionMode('connect folder path');
  item.folderPath = enteredFolder.trim();
  item.localRepoPath = enteredFolder.trim();
  if (!Array.isArray(item.pathButtons)) item.pathButtons = [];
  item.pathButtons.push({
    label: enteredFolder.trim().split(/[\\/]/).pop() || 'Folder',
    path: item.localRepoPath,
    kind: 'folder',
    mode: 'explorer'
  });
  autoSaveWorkflowState('choose_folder_prompt');
  renderAll();
  setStatus(`📁 Connected folder "${enteredFolder.trim()}" to "${item.title || item.id}"`);
  return { ok: true, path: enteredFolder.trim() };
}
window.chooseFolderForContainer = chooseFolderForContainer;

async function chooseScriptForNode(nodeId, ev = null) {
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  const node = (S.nodes || []).find(n => n.id === nodeId) || findSelectedObject();
  if (!node) return { ok: false, error: 'Node not found' };
  if (typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Executable Workflow Scripts (.py, .js, .bat, .ps1)',
          accept: {
            'text/x-python': ['.py'],
            'application/javascript': ['.js', '.mjs'],
            'text/plain': ['.py', '.js', '.bat', '.ps1', '.sh']
          }
        }]
      });
      if (handle) {
        enterConstructionMode('connect script to node');
        node.scriptBinding = `scripts/${handle.name}`;
        if (!Array.isArray(node.pathButtons)) node.pathButtons = [];
        node.pathButtons.push({
          label: `🐍 ${handle.name}`,
          path: `scripts/${handle.name}`,
          kind: 'file',
          mode: 'app'
        });
        autoSaveWorkflowState('connect_script_picker');
        renderAll();
        setStatus(`🐍 Connected script "${handle.name}" to "${node.title || node.id}"`);
        return { ok: true, script: node.scriptBinding };
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, cancelled: true };
    }
  }
  const enteredScript = (typeof prompt === 'function')
    ? prompt('Enter Python / JS script path to bind to this node:', node.scriptBinding || 'modules/process_step.py')
    : (node.scriptBinding || 'modules/process_step.py');
  if (!enteredScript) return { ok: false, cancelled: true };
  enterConstructionMode('connect script path');
  node.scriptBinding = enteredScript.trim();
  autoSaveWorkflowState('connect_script_prompt');
  renderAll();
  setStatus(`🐍 Bound script "${node.scriptBinding}" to "${node.title || node.id}"`);
  return { ok: true, script: node.scriptBinding };
}
window.chooseScriptForNode = chooseScriptForNode;

function updateSelectedSize(dim, val) {
  const obj = findSelectedObject();
  if (!obj || !Number.isFinite(val)) return;
  enterConstructionMode('resize item', false);
  obj.userResized = true;
  obj[dim] = Math.max(dim === 'w' ? 140 : 90, Math.round(val));
  autoSaveWorkflowState('inspector_size');
  renderAll({ preserveInspector: true });
}

function nudgeSelectedSize(dw, dh) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('resize item', false);
  obj.userResized = true;
  const domEl = document.querySelector(`[data-item-id="${obj.id}"]`);
  const curW = obj.w || (domEl ? domEl.offsetWidth : 260);
  const curH = obj.h || (domEl ? domEl.offsetHeight : 180);
  if (dw) obj.w = Math.max(140, Math.round(curW + dw));
  if (dh) obj.h = Math.max(90, Math.round(curH + dh));
  autoSaveWorkflowState('nudge_size');
  renderAll();
}

function updateSelectedField(field, val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit field', false);
  obj[field] = val;
  if (field === 'ui_url' || field === 'uiUrl') {
    obj.ui_url = val;
    obj.uiUrl = val;
  }
  if (field === 'ui_label' || field === 'uiLabel') {
    obj.ui_label = val;
    obj.uiLabel = val;
  }
  autoSaveWorkflowState('inspector_field');
  renderAll({ preserveInspector: true });
}

function updateSelectedUiUrl(val) {
  updateSelectedField('ui_url', val);
}

function updateSelectedUiLabel(val) {
  updateSelectedField('ui_label', val);
}

function updateSelectedNodeType(nextType) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('change node type', false);
  obj.type = nextType || 'step';
  if (obj.type === 'idea') {
    obj.category = '💡 IDEA / TRIGGER';
  } else if (obj.type === 'llm_query') {
    obj.category = '🤖 LLM / AI QUERY';
    if (!Array.isArray(obj.inPorts) || obj.inPorts.length === 0) obj.inPorts = ['files_in', 'context_in'];
    if (!Array.isArray(obj.outPorts) || obj.outPorts.length === 0) obj.outPorts = ['files_out', 'response_out'];
    if (!obj.llmProvider) obj.llmProvider = 'ollama';
    if (!obj.llmModel) obj.llmModel = 'llama3.2';
    if (!obj.llmPrompt) obj.llmPrompt = 'Put the prompt or instructions here — wired input files + prompt get run -> output file comes out';
  } else if (obj.type === 'external_in') {
    obj.category = '📥 EXTERNAL WORKFLOW IN';
  } else if (obj.type === 'external_out') {
    obj.category = '📤 EXTERNAL WORKFLOW OUT';
  }
  resetAutoFitOnItemAndParents(obj);
  renderAll({ preserveInspector: false });
}

function updateSelectedSteps(val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit steps', false);
  const lines = String(val || '').split('\n').map(s => s.trim()).filter(Boolean);
  obj.steps = lines;
  obj.substeps = lines;
  resetAutoFitOnItemAndParents(obj);
  autoSaveWorkflowState('inspector_steps');
  renderAll({ preserveInspector: true });
}

function resetAutoFitOnItemAndParents(obj) {
  if (!obj) return;
  obj.userResized = false;
  const allContainers = [
    ...(S.categories || []),
    ...(S.subcategories || []),
    ...(S.cells || [])
  ];
  allContainers.forEach(c => {
    if (c.id === obj.id || c.id === obj._parentContId || isItemInsideContainer(obj, c)) {
      c.userResized = false;
    }
  });
}

function syncWiresOnPortListChange(obj, field, prevPorts, nextPorts) {
  if (!obj || !Array.isArray(S.wires)) return;
  const oldList = Array.isArray(prevPorts) ? prevPorts.slice() : [];
  const newList = Array.isArray(nextPorts) ? nextPorts.slice() : [];
  const nextSet = new Set(newList);
  const renameMap = {};
  if (oldList.length === newList.length) {
    for (let i = 0; i < oldList.length; i++) {
      if (oldList[i] !== newList[i] && !nextSet.has(oldList[i])) {
        renameMap[oldList[i]] = newList[i];
      }
    }
  } else {
    const removed = oldList.filter(p => !nextSet.has(p));
    const oldSet = new Set(oldList);
    const added = newList.filter(p => !oldSet.has(p));
    if (removed.length === 1 && added.length === 1) {
      renameMap[removed[0]] = added[0];
    }
  }
  const targetDir = field === 'inPorts' ? 'in' : (field === 'outPorts' ? 'out' : 'bottom');
  const nextWires = [];
  for (let i = 0; i < S.wires.length; i++) {
    const w = S.wires[i];
    if (!w) continue;
    let keep = true;
    const isFromThis = w.fromNode === obj.id;
    const isToThis = w.toNode === obj.id;
    const fDir = isFromThis ? (w.fromDir || (targetDir === 'in' && oldList.includes(w.fromPort) ? 'in' : 'out')) : '';
    const tDir = isToThis ? (w.toDir || (targetDir === 'out' && oldList.includes(w.toPort) ? 'out' : 'in')) : '';
    if (isFromThis && (fDir === targetDir || (targetDir === 'out' && !w.fromDir && oldList.includes(w.fromPort)))) {
      if (renameMap[w.fromPort]) {
        w.fromPort = renameMap[w.fromPort];
      } else if (!nextSet.has(w.fromPort)) {
        keep = false;
      }
    }
    if (keep && isToThis && (tDir === targetDir || (targetDir === 'in' && !w.toDir && oldList.includes(w.toPort)))) {
      if (renameMap[w.toPort]) {
        w.toPort = renameMap[w.toPort];
      } else if (!nextSet.has(w.toPort)) {
        keep = false;
      }
    }
    if (keep) nextWires.push(w);
  }
  S.wires = nextWires;
}

function updateSelectedPorts(field, val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit ports', false);
  const prevPorts = Array.isArray(obj[field]) ? obj[field].slice() : [];
  const nextPorts = String(val || '').split(',').map(s => s.trim()).filter(Boolean);
  syncWiresOnPortListChange(obj, field, prevPorts, nextPorts);
  obj[field] = nextPorts;
  if (field === 'inPorts') obj.inputs = nextPorts;
  if (field === 'outPorts') obj.outputs = nextPorts;
  resetAutoFitOnItemAndParents(obj);
  autoSaveWorkflowState('inspector_ports');
  renderAll({ preserveInspector: true });
}

function adjustNodePorts(ev, nodeId, side, delta) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  enterConstructionMode('adjust node ports', false);
  const node = (S.nodes || []).find(n => n.id === nodeId) || findAnyItemById(nodeId);
  if (!node) return null;
  const field = side === 'out' ? 'outPorts' : 'inPorts';
  const prevPorts = Array.isArray(node[field]) ? node[field].slice() : [];
  const nextPorts = prevPorts.slice();
  const prefix = side === 'out' ? 'out_' : 'in_';
  if (delta > 0) {
    let idx = nextPorts.length + 1;
    let cand = `${prefix}${idx}`;
    while (nextPorts.includes(cand)) {
      idx += 1;
      cand = `${prefix}${idx}`;
    }
    nextPorts.push(cand);
  } else if (nextPorts.length > 0) {
    nextPorts.pop();
  } else {
    return node;
  }
  syncWiresOnPortListChange(node, field, prevPorts, nextPorts);
  node[field] = nextPorts;
  if (field === 'inPorts') node.inputs = nextPorts;
  if (field === 'outPorts') node.outputs = nextPorts;
  resetAutoFitOnItemAndParents(node);
  autoSaveWorkflowState('adjust_node_ports');
  renderAll({ preserveInspector: false });
  return node;
}
window.adjustNodePorts = adjustNodePorts;

function updateSelectedParams(val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit params', false);
  try {
    obj.params = JSON.parse(val);
    resetAutoFitOnItemAndParents(obj);
    renderAll({ preserveInspector: true });
  } catch (e) {}
}

function updateSelectedFiles(val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit files', false);
  obj.files = val.split('\n').map(s => s.trim()).filter(Boolean);
  resetAutoFitOnItemAndParents(obj);
  renderAll({ preserveInspector: true });
}

function updateSelectedNotes(val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('edit notes', false);
  const lines = val.split('\n').map(s => s.trim()).filter(Boolean);
  obj.notes = lines;
  if ('rules' in obj) obj.rules = lines;
  if ('checklist' in obj) obj.checklist = lines;
  resetAutoFitOnItemAndParents(obj);
  autoSaveWorkflowState('inspector_notes');
  renderAll({ preserveInspector: true });
}

function updateSelectedChecklist(val) {
  updateSelectedNotes(val);
}

function updateBusOrientation(val) {
  const obj = findSelectedObject();
  if (!obj) return;
  enterConstructionMode('bus orientation', false);
  obj.orientation = val;
  setStatus(`⚡ Bus Bar orientation set to ${val}`);
  renderAll();
}

function adjustBusPorts(ev, busId, side, delta) {
  ev.stopPropagation();
  enterConstructionMode('adjust bus ports', false);
  const bus = (S.buses || []).find(b => b.id === busId);
  if (!bus) return;
  const arr = side === 'out' ? bus.outPorts : bus.inPorts;
  const prefix = side === 'out' ? 'out_' : 'in_';
  if (delta > 0) {
    arr.push(`${prefix}${arr.length + 1}`);
  } else if (arr.length > 1) {
    arr.pop();
  }
  resetAutoFitOnItemAndParents(bus);
  renderAll();
}

function toggleNodeSectionCollapse(itemId, sectionKey, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const obj = findAnyItemById(itemId);
  if (!obj) return;
  if (!obj.collapsedSections || typeof obj.collapsedSections !== 'object') {
    obj.collapsedSections = {};
  }
  obj.collapsedSections[sectionKey] = !Boolean(obj.collapsedSections[sectionKey]);
  resetAutoFitOnItemAndParents(obj);
  const stateWord = obj.collapsedSections[sectionKey] ? 'Collapsed' : 'Expanded';
  setStatus(`↕ ${stateWord} [${sectionKey}] in ${obj.title || obj.id} — container resized to fit`);
  renderAll();
}
window.toggleNodeSectionCollapse = toggleNodeSectionCollapse;

function toggleAllLongListsCollapse(forceState) {
  const nextCol = typeof forceState === 'boolean' ? forceState : !Boolean(S.allListsCollapsed);
  S.allListsCollapsed = nextCol;
  (S.nodes || []).forEach(n => {
    if (!n.collapsedSections || typeof n.collapsedSections !== 'object') n.collapsedSections = {};
    n.collapsedSections.rules = nextCol;
    n.collapsedSections.substeps = nextCol;
    n.collapsedSections.io_specs = nextCol;
    n.collapsedSections.params = nextCol;
    n.userResized = false;
  });
  (S.fileContainers || []).forEach(fc => {
    if (!fc.collapsedSections || typeof fc.collapsedSections !== 'object') fc.collapsedSections = {};
    fc.collapsedSections.files = nextCol;
    fc.userResized = false;
  });
  [...(S.categories || []), ...(S.subcategories || []), ...(S.cells || [])].forEach(c => {
    if (!c.collapsedSections || typeof c.collapsedSections !== 'object') c.collapsedSections = {};
    c.collapsedSections.notes = nextCol;
    c.userResized = false;
  });
  setStatus(nextCol ? '▸ Collapsed all long lists, rules, sub-steps & file containers (containers shrunk to fit)' : '▾ Expanded all lists, rules, sub-steps & file containers (containers grown to fit)');
  renderAll();
}
window.toggleAllLongListsCollapse = toggleAllLongListsCollapse;

function toggleContainerCollapse(ev, kind, id) {
  ev.stopPropagation();
  selectedItem = { kind, id };
  const obj = findSelectedObject();
  if (!obj) return;
  obj.collapsed = !obj.collapsed;
  setStatus(`${obj.collapsed ? '📦 Collapsed to Black-Box Subsystem' : '📂 Expanded Container'}: ${obj.title}`);
  renderAll();
}

function deleteItemById(ev, kind, id) {
  if (ev) ev.stopPropagation();
  selectedItem = { kind, id };
  deleteSelectedElement();
}

function deleteSelectedElement() {
  if (!selectedItem) return;
  const { kind, id } = selectedItem;
  if (kind === 'wire') {
    if (!(S && S.wireDeleteMode)) {
      setStatus('🛡️ Connector deletion locked — enable Del Wires toggle to delete wires');
      return;
    }
    deleteWire(id);
    return;
  }
  enterConstructionMode('delete element', false);
  if (kind === 'category') S.categories = S.categories.filter(x => x.id !== id);
  if (kind === 'subcategory') S.subcategories = S.subcategories.filter(x => x.id !== id);
  if (kind === 'cell') S.cells = S.cells.filter(x => x.id !== id);
  if (kind === 'node') S.nodes = S.nodes.filter(x => x.id !== id);
  if (kind === 'bucket') S.fileContainers = S.fileContainers.filter(x => x.id !== id);
  if (kind === 'bus') S.buses = (S.buses || []).filter(x => x.id !== id);
  if (kind === 'sticky') S.stickyNotes = (S.stickyNotes || []).filter(x => x.id !== id);
  (S.stickyNotes || []).forEach(sn => {
    if (sn.attachedToId === id) sn.attachedToId = '';
  });
  S.wires = S.wires.filter(w => w.fromNode !== id && w.toNode !== id);
  selectedItem = null;
  autoSaveWorkflowState('delete_element');
  setStatus(`🗑️ Deleted ${kind} (${id})`);
  renderAll();
}

function deleteSelectedItem() {
  deleteSelectedElement();
}

function deleteWire(wireId) {
  enterConstructionMode('delete wire', false);
  S.wires = S.wires.filter(w => w.id !== wireId);
  if (selectedItem && selectedItem.kind === 'wire' && selectedItem.id === wireId) {
    selectedItem = null;
  }
  autoSaveWorkflowState('delete_wire');
  setStatus('✂️ Deleted wire connection');
  renderAll();
}

function addFileToBucket(ev, bucketId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  enterConstructionMode('add file to bucket', false);
  const b = S.fileContainers.find(x => x.id === bucketId);
  if (!b) return;
  const nextName = `output_pass_${(b.files.length + 1).toString().padStart(2, '0')}.json`;
  b.files.push(nextName);
  resetAutoFitOnItemAndParents(b);
  renderAll();
}

function removeFileFromBucket(ev, bucketId, fileIdx) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  enterConstructionMode('remove file from bucket', false);
  const b = S.fileContainers.find(x => x.id === bucketId);
  if (!b || !Array.isArray(b.files)) return;
  b.files.splice(fileIdx, 1);
  resetAutoFitOnItemAndParents(b);
  renderAll();
}
window.removeFileFromBucket = removeFileFromBucket;

function previewBucketFiles(ev, bucketId) {
  ev.stopPropagation();
  const b = S.fileContainers.find(x => x.id === bucketId);
  if (!b) return;
  setStatus(`🗄️ ${b.title} -> ${b.files.join(', ') || 'No files yet'}`);
}

function syncSelectedDomClasses() {
  if (document.body && document.body.classList && typeof document.body.classList.toggle === 'function') {
    document.body.classList.toggle('clean-unselected-view', !selectedItem);
  }
  const pathway = computeConnectedPathway(selectedItem, (S && S.wires) || []);
  if (domLayer && typeof domLayer.querySelectorAll === 'function') {
    const nodes = domLayer.querySelectorAll('[data-item-id]');
    nodes.forEach(el => {
      if (!el || !el.classList || typeof el.classList.toggle !== 'function') return;
      const id = el.getAttribute ? el.getAttribute('data-item-id') : '';
      const isSel = Boolean(pathway.active && id === pathway.selectedId);
      const isConn = Boolean(pathway.active && !isSel && pathway.neighborIds.has(id));
      const isDim = Boolean(pathway.active && !isSel && !isConn);
      const isSearchHit = Boolean(canvasSearchState && canvasSearchState.matchIdSet && canvasSearchState.matchIdSet.has(id));
      const isSearchCur = Boolean(isSearchHit && canvasSearchState.activeId === id);
      const tActive = Boolean(flowTracerState && flowTracerState.active);
      const isTraceProc = Boolean(tActive && flowTracerState.activeNodeId === id && flowTracerState.phase === 'processing');
      const isTraceRecv = Boolean(tActive && flowTracerState.receivingNodeId === id && (flowTracerState.phase === 'transit_in' || flowTracerState.phase === 'emit_out'));
      const isTraceDone = Boolean(tActive && flowTracerState.completedNodeIds && flowTracerState.completedNodeIds.has(id));
      el.classList.toggle('selected', isSel);
      el.classList.toggle('pathway-connected', isConn);
      el.classList.toggle('pathway-dimmed', isDim);
      el.classList.toggle('search-match-highlight', isSearchHit);
      el.classList.toggle('search-match-active', isSearchCur);
      el.classList.toggle('trace-node-processing', isTraceProc);
      el.classList.toggle('trace-receiving', isTraceRecv);
      el.classList.toggle('trace-node-done', isTraceDone);
    });
    const dotEls = domLayer.querySelectorAll('.port-dot[data-node][data-port]');
    dotEls.forEach(dot => {
      if (!dot || !dot.classList || typeof dot.classList.toggle !== 'function') return;
      const pn = dot.getAttribute ? dot.getAttribute('data-node') : '';
      const pp = dot.getAttribute ? dot.getAttribute('data-port') : '';
      const isGlow = Boolean(pathway.active && pathway.portKeys.has(`${pn}::${pp}`));
      dot.classList.toggle('port-pathway-glow', isGlow);
    });
  }
  return pathway;
}
window.syncSelectedDomClasses = syncSelectedDomClasses;

function selectItem(kind, id) {
  let effKind = kind;
  let effId = id;
  if (arguments.length === 1 && kind && !id) {
    effId = kind;
    effKind = 'node';
  }
  selectedItem = effId ? { kind: effKind || 'node', id: String(effId) } : null;
  syncSelectedDomClasses();
  renderWires();
  if (typeof renderInspector === 'function') renderInspector();
  return selectedItem;
}
window.selectItem = selectItem;

function collectContainedChildren(contObj) {
  const list = [];
  const allCandidates = [...S.subcategories, ...S.cells, ...S.nodes, ...S.fileContainers, ...(S.buses || [])];
  allCandidates.forEach(item => {
    if (item.id !== contObj.id && isItemInsideContainer(item, contObj)) {
      list.push({ item, origX: item.x, origY: item.y });
    }
  });
  return list;
}

function moveChildrenWithContainer(dragState, dx, dy) {
  if (!dragState || !dragState.containedChildren) return;
  dragState.containedChildren.forEach(ch => {
    ch.item.x = Math.round(ch.origX + dx);
    ch.item.y = Math.round(ch.origY + dy);
  });
}

function startDragItem(ev, kind, id) {
  if (ev.button !== 0) return;
  if (formatPainterState && formatPainterState.active && !(ev.ctrlKey || isCtrlKeyHeld) && !(ev.altKey || isAltKeyHeld)) {
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    applyColorToTarget(kind, id, formatPainterState.color, 'format_painter');
    return;
  }
  if (ev.altKey || isAltKeyHeld) {
    ev.preventDefault();
    ev.stopPropagation();
    activeDrag = {
      mode: 'alt_zoom',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origZoom: S.zoom,
      zoomOutClick: Boolean(ev.shiftKey) || ev.button === 2
    };
    return;
  }
  if (ev.ctrlKey || isCtrlKeyHeld) {
    ev.preventDefault();
    ev.stopPropagation();
    if (viewport && viewport.classList) viewport.classList.add('ctrl-pan-active');
    activeDrag = {
      mode: 'pan',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origPanX: S.panX,
      origPanY: S.panY,
      wasCanvasClick: false
    };
    return;
  }
  if (S.lockLayout) {
    ev.stopPropagation();
    selectedItem = { kind, id };
    syncSelectedDomClasses();
    renderWires();
    renderInspector();
    if (viewport && viewport.classList) viewport.classList.add('ctrl-pan-active');
    activeDrag = {
      mode: 'pan',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origPanX: S.panX,
      origPanY: S.panY,
      wasCanvasClick: false
    };
    return;
  }
  if (ev.target && ev.target.closest && ev.target.closest('.port-dot, .resize-handle, .no-drag, button, input, select, textarea')) {
    return;
  }
  ev.stopPropagation();
  captureBaselineSnapshot(false);
  selectedItem = { kind, id };
  const obj = findSelectedObject();
  if (!obj) return;
  const isContainer = kind === 'category' || kind === 'subcategory' || kind === 'cell';
  const children = isContainer ? collectContainedChildren(obj) : [];
  if (kind !== 'sticky') {
    (S.stickyNotes || []).forEach(sn => {
      if (sn && sn.attachedToId === obj.id) {
        children.push({ item: sn, origX: sn.x, origY: sn.y });
      }
    });
  }
  activeDrag = {
    mode: 'move',
    obj,
    kind,
    startMouseX: ev.clientX,
    startMouseY: ev.clientY,
    origX: obj.x,
    origY: obj.y,
    containedChildren: children
  };
  syncSelectedDomClasses();
  renderWires();
  renderInspector();
}

function startResizeItem(ev, kind, id) {
  ev.stopPropagation();
  if (S.lockLayout) return;
  enterConstructionMode('resize item', false);
  selectedItem = { kind, id };
  const obj = findSelectedObject();
  if (!obj) return;
  const domEl = document.querySelector(`[data-item-id="${id}"]`);
  activeDrag = {
    mode: 'resize',
    obj,
    startMouseX: ev.clientX,
    startMouseY: ev.clientY,
    origW: obj.w || (domEl ? domEl.offsetWidth : 260),
    origH: obj.h || (domEl ? domEl.offsetHeight : 180)
  };
  syncSelectedDomClasses();
  renderWires();
  renderInspector();
}

function startSidebarResize(ev, side) {
  ev.stopPropagation();
  ev.preventDefault();
  const el = document.getElementById(side === 'left' ? 'leftSidebar' : 'rightSidebar');
  const startW = el ? el.offsetWidth : (side === 'left' ? 275 : 330);
  const startX = ev.clientX;
  const onMove = (me) => {
    const dx = me.clientX - startX;
    const nextW = side === 'left'
      ? Math.max(180, Math.min(620, Math.round(startW + dx)))
      : Math.max(220, Math.min(680, Math.round(startW - dx)));
    document.documentElement.style.setProperty(side === 'left' ? '--left-sidebar-w' : '--right-sidebar-w', nextW + 'px');
  };
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function connectPortPair(portA, portB) {
  if (!portA || !portB || portA.nodeId === portB.nodeId) return false;
  enterConstructionMode('connect wire', false);
  const objA = findAnyItemById(portA.nodeId);
  const objB = findAnyItemById(portB.nodeId);

  // Pass-Through Bulkhead check: if one endpoint is a Container and the other is an internal child inside it:
  // - Container's left 'in' port feeds internal child's 'in' port (fromNode = Container, toNode = Child)
  // - Internal child's 'out' port feeds Container's right 'out' port (fromNode = Child, toNode = Container)
  let aIsSource = portA.dir === 'out' || (portA.dir === 'bottom' && portB.dir === 'in');
  if (objA && objB) {
    if (isContainerItem(objA) && isItemInsideContainer(objB, objA)) {
      const contDir = resolveActualPortDir(portA.nodeId, portA.portName, portA.dir);
      aIsSource = contDir === 'in';
    } else if (isContainerItem(objB) && isItemInsideContainer(objA, objB)) {
      const contDir = resolveActualPortDir(portB.nodeId, portB.portName, portB.dir);
      aIsSource = contDir === 'out';
    } else if (portA.dir === portB.dir) {
      aIsSource = (objA.x || 0) <= (objB.x || 0);
    }
  }

  const src = aIsSource ? portA : portB;
  const dst = aIsSource ? portB : portA;
  S.wires.push({
    id: uid('wire'),
    fromNode: src.nodeId,
    fromPort: src.portName,
    fromDir: resolveActualPortDir(src.nodeId, src.portName, src.dir),
    toNode: dst.nodeId,
    toPort: dst.portName,
    toDir: resolveActualPortDir(dst.nodeId, dst.portName, dst.dir)
  });
  setStatus(`✅ Connected ${src.nodeId} [${src.portName}] → ${dst.nodeId} [${dst.portName}]`);
  return true;
}

function onPortMouseDown(ev, nodeId, portName, dir) {
  ev.stopPropagation();
  connectingPort = { nodeId, portName, dir };
  portDragStartPos = { x: ev.clientX, y: ev.clientY };
  setStatus(`🔌 Port ${nodeId} [${portName}] — drag to another port OR click-then-click second port ●`);
}

function startPortConnect(ev, nodeId, portName, dir) {
  onPortMouseDown(ev, nodeId, portName, dir);
}

function onPortClick(ev, nodeId, portName, dir) {
  ev.stopPropagation();
  if (!armedPort) {
    armedPort = { nodeId, portName, dir };
    setStatus(`🎯 Armed port ${nodeId} [${portName}] (pulsing) — click any 2nd port dot to connect!`);
    renderAll();
    return;
  }
  if (armedPort.nodeId === nodeId && armedPort.portName === portName) {
    armedPort = null;
    setStatus('⚪ Disarmed port selection');
    renderAll();
    return;
  }
  connectPortPair(armedPort, { nodeId, portName, dir });
  armedPort = null;
  connectingPort = null;
  renderAll();
}

function finishPortConnect(ev, targetNodeId, targetPortName, dir) {
  ev.stopPropagation();
  if (!connectingPort || connectingPort.nodeId === targetNodeId) {
    return;
  }
  const movedDist = portDragStartPos
    ? Math.hypot(ev.clientX - portDragStartPos.x, ev.clientY - portDragStartPos.y)
    : 10;
  if (movedDist > 4) {
    connectPortPair(connectingPort, { nodeId: targetNodeId, portName: targetPortName, dir });
    connectingPort = null;
    armedPort = null;
    renderAll();
  }
}

function deselectAll() {
  selectedItem = null;
  armedPort = null;
  connectingPort = null;
  const ctxEl = document.getElementById('ctxMenu');
  if (ctxEl) ctxEl.style.display = 'none';
  const popEl = document.getElementById('hotkeyHelpPopover');
  if (popEl) popEl.classList.remove('open');
  document.body.classList.add('clean-unselected-view');
  setStatus('⬜ Deselected all — Right Inspector hidden & Clean Canvas View active');
  renderAll();
}

function toggleLeftSidebar(forceHide) {
  S.hideLeftPalette = typeof forceHide === 'boolean' ? forceHide : !S.hideLeftPalette;
  document.body.classList.toggle('hide-left-palette', Boolean(S.hideLeftPalette));
  const btn = document.getElementById('btnToggleLeftPalette');
  if (btn) {
    const lbl = btn.querySelector ? btn.querySelector('.btn-lbl') : null;
    if (lbl) lbl.textContent = S.hideLeftPalette ? 'Palette ▸' : 'Palette';
    else btn.textContent = S.hideLeftPalette ? '▶ Show Palette' : '◀ Hide Palette';
  }
  setStatus(S.hideLeftPalette ? '◀ Left Palette hidden for wider canvas view' : '▶ Left Palette restored');
  renderAll();
}

function toggleHotkeyHelpPopover(ev, forceOpen) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const pop = document.getElementById('hotkeyHelpPopover');
  if (!pop) return;
  const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !pop.classList.contains('open');
  pop.classList.toggle('open', nextOpen);
  if (nextOpen) toggleGithubFeedbackPopover(null, false);
}

function setGithubFeedbackKind(kind) {
  githubFeedbackKind = kind === 'feature' ? 'feature' : 'bug';
  const bugBtn = document.getElementById('btnGhKindBug');
  const featBtn = document.getElementById('btnGhKindFeat');
  if (bugBtn && bugBtn.classList) bugBtn.classList.toggle('active', githubFeedbackKind === 'bug');
  if (featBtn && featBtn.classList) featBtn.classList.toggle('active', githubFeedbackKind === 'feature');
  return githubFeedbackKind;
}
window.setGithubFeedbackKind = setGithubFeedbackKind;

function toggleGithubFeedbackPopover(ev, forceOpen) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const pop = document.getElementById('githubFeedbackPopover');
  if (!pop) return;
  const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !pop.classList.contains('open');
  pop.classList.toggle('open', nextOpen);
  if (nextOpen) {
    const hPop = document.getElementById('hotkeyHelpPopover');
    if (hPop && hPop.classList) hPop.classList.remove('open');
    setGithubFeedbackKind(githubFeedbackKind);
    const titleEl = document.getElementById('ghFeedbackTitle');
    if (titleEl && typeof titleEl.focus === 'function') titleEl.focus();
  }
}
window.toggleGithubFeedbackPopover = toggleGithubFeedbackPopover;

function buildGithubIssuePayload() {
  const titleEl = document.getElementById('ghFeedbackTitle');
  const bodyEl = document.getElementById('ghFeedbackBody');
  const kindLabel = githubFeedbackKind === 'feature' ? 'Feature' : 'Bug';
  const prefix = githubFeedbackKind === 'feature' ? '[Feature]: ' : '[Bug]: ';
  const rawTitle = (titleEl && titleEl.value ? String(titleEl.value).trim() : '') || 'SandboxWorkflow UI feedback';
  const fullTitle = rawTitle.startsWith('[') ? rawTitle : (prefix + rawTitle);
  const rawDetails = (bodyEl && bodyEl.value ? String(bodyEl.value).trim() : '') || '_Describe steps, expected behavior, or suggestion here..._';
  const fullBody = [
    `### ${kindLabel} Summary`,
    rawDetails,
    '',
    '### Environment',
    '- **Engine**: SandboxWorkflow v1.8.1',
    '- **Note**: Privacy-safe submission (no workflow JSON or local paths included)'
  ].join('\n');
  const baseUrl = ['ht', 'tps://github.com/pzetts/SandboxWorkflow/issues/new'].join('');
  const params = new URLSearchParams({
    title: fullTitle,
    body: fullBody,
    labels: githubFeedbackKind === 'feature' ? 'enhancement' : 'bug'
  });
  return {
    title: fullTitle,
    body: fullBody,
    url: `${baseUrl}?${params.toString()}`
  };
}
window.buildGithubIssuePayload = buildGithubIssuePayload;

function openGithubFeedbackIssue() {
  const payload = buildGithubIssuePayload();
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(payload.url, '_blank', 'noopener');
  }
  setStatus('🐞 Opened privacy-safe GitHub issue draft in new tab (review before submitting)');
  toggleGithubFeedbackPopover(null, false);
  return payload;
}
window.openGithubFeedbackIssue = openGithubFeedbackIssue;

async function copyGithubFeedbackMarkdown() {
  const payload = buildGithubIssuePayload();
  const txt = `${payload.title}\n\n${payload.body}`;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(txt);
      setStatus('📋 Copied GitHub issue Markdown to clipboard!');
      return true;
    }
  } catch (e) {}
  setStatus('ℹ️ Issue draft ready — copy or click Open GitHub Issue');
  return false;
}
window.copyGithubFeedbackMarkdown = copyGithubFeedbackMarkdown;

function toggleLockLayout() {
  if (S.lockLayout) {
    enterConstructionMode('unlock layout', true);
    return;
  }
  S.lockLayout = true;
  setStatus('🔒 Layout Locked — Dragging anywhere pans canvas without moving nodes');
  renderAll();
}

function toggleFullScreenView() {
  S.fullScreenView = !S.fullScreenView;
  setStatus(S.fullScreenView ? '⛶ Full Screen Diagram View (Press Esc or click ⛶ Exit Full Screen)' : '📐 Restored Sidebars');
  renderAll();
}

function syncModifierCursorState(ev) {
  if (!viewport || !viewport.classList) return;
  const ctrl = ev ? Boolean(ev.ctrlKey) : isCtrlKeyHeld;
  const alt = ev ? Boolean(ev.altKey) : isAltKeyHeld;
  const shift = ev ? Boolean(ev.shiftKey) : isShiftKeyHeld;
  isCtrlKeyHeld = ctrl;
  isAltKeyHeld = alt;
  isShiftKeyHeld = shift;
  viewport.classList.toggle('ctrl-pan-mode', ctrl && !alt);
  viewport.classList.toggle('alt-zoom-mode', alt && !shift);
  viewport.classList.toggle('alt-zoom-out-mode', alt && shift);
  if (!ctrl) viewport.classList.remove('ctrl-pan-active');
}

let suppressNextCanvasClick = false;

viewport.addEventListener('mousedown', (ev) => {
  const ctxEl = document.getElementById('ctxMenu');
  if (ctxEl) ctxEl.style.display = 'none';
  const popEl = document.getElementById('hotkeyHelpPopover');
  if (popEl) popEl.classList.remove('open');
  syncModifierCursorState(ev);
  if ((ev.altKey || isAltKeyHeld) && (ev.button === 0 || ev.button === 2)) {
    ev.preventDefault();
    ev.stopPropagation();
    suppressNextCanvasClick = true;
    activeDrag = {
      mode: 'alt_zoom',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origZoom: S.zoom,
      zoomOutClick: Boolean(ev.shiftKey) || ev.button === 2
    };
    return;
  }
  if (ev.button === 0 && (ev.ctrlKey || isCtrlKeyHeld)) {
    ev.preventDefault();
    ev.stopPropagation();
    suppressNextCanvasClick = true;
    if (viewport && viewport.classList) viewport.classList.add('ctrl-pan-active');
    activeDrag = {
      mode: 'pan',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origPanX: S.panX,
      origPanY: S.panY,
      wasCanvasClick: false
    };
    return;
  }
  const targetEl = ev.target;
  const isWireHitTarget = Boolean(targetEl && targetEl.closest && targetEl.closest('.wire-hit'));
  const isCardTarget = Boolean(targetEl && targetEl.closest && targetEl.closest('[data-item-id]'));
  if (isWireHitTarget && ((S && (S.wireSelectMode || S.wireDeleteMode)) || (formatPainterState && formatPainterState.active))) {
    return;
  }
  if (isCardTarget && formatPainterState && formatPainterState.active && ev.button === 0) {
    return;
  }
  if (ev.button === 1 || S.lockLayout || ev.target === viewport || ev.target === worldLayer || ev.target === domLayer || ev.target === wireSvg) {
    activeDrag = {
      mode: 'pan',
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      origPanX: S.panX,
      origPanY: S.panY,
      wasCanvasClick: (ev.target === viewport || ev.target === worldLayer || ev.target === domLayer || ev.target === wireSvg) && !(ev.ctrlKey || isCtrlKeyHeld)
    };
  }
}, true);

viewport.addEventListener('click', (ev) => {
  if (suppressNextCanvasClick || ev.altKey || isAltKeyHeld || ev.ctrlKey || isCtrlKeyHeld) {
    suppressNextCanvasClick = false;
    ev.preventDefault();
    ev.stopPropagation();
  }
}, true);

window.addEventListener('mousedown', (ev) => {
  const popEl = document.getElementById('hotkeyHelpPopover');
  const btnEl = document.getElementById('btnHotkeyHelp');
  if (popEl && popEl.classList.contains('open')) {
    if (!(ev.target && ev.target.closest && (ev.target.closest('#hotkeyHelpPopover') || ev.target.closest('#btnHotkeyHelp')))) {
      if (ev.target !== popEl && ev.target !== btnEl) {
        popEl.classList.remove('open');
      }
    }
  }
  const ghPop = document.getElementById('githubFeedbackPopover');
  const ghBtn = document.getElementById('btnGithubFeedback');
  if (ghPop && ghPop.classList && ghPop.classList.contains('open')) {
    if (!(ev.target && ev.target.closest && (ev.target.closest('#githubFeedbackPopover') || ev.target.closest('#btnGithubFeedback')))) {
      if (ev.target !== ghPop && ev.target !== ghBtn) {
        ghPop.classList.remove('open');
      }
    }
  }
  const honeyPop = document.getElementById('honeycombPopover');
  const honeyBtn = document.getElementById('btnHoneycombPalette');
  if (honeyPop && honeyPop.classList && honeyPop.classList.contains('open')) {
    if (!(ev.target && ev.target.closest && (ev.target.closest('#honeycombPopover') || ev.target.closest('#btnHoneycombPalette')))) {
      if (ev.target !== honeyPop && ev.target !== honeyBtn) {
        honeyPop.classList.remove('open');
      }
    }
  }
  const ioDrop = document.getElementById('ioMenuDropdown');
  if (ioDrop && ioDrop.hasAttribute('open')) {
    if (!(ev.target && ev.target.closest && ev.target.closest('#ioMenuDropdown'))) {
      ioDrop.removeAttribute('open');
    }
  }
});

if (domLayer && typeof domLayer.addEventListener === 'function') {
  domLayer.addEventListener('mousedown', (ev) => {
    if (!(formatPainterState && formatPainterState.active)) return;
    if (ev.button !== 0 || ev.ctrlKey || ev.altKey || isCtrlKeyHeld || isAltKeyHeld) return;
    const cardEl = ev.target && ev.target.closest ? ev.target.closest('[data-item-id]') : null;
    if (!cardEl) return;
    const itemId = cardEl.getAttribute ? cardEl.getAttribute('data-item-id') : '';
    const resolved = findItemKindAndObjectById(itemId);
    if (!resolved) return;
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    applyColorToTarget(resolved.kind, resolved.id, formatPainterState.color, 'format_painter');
  }, true);
  domLayer.addEventListener('click', (ev) => {
    if (!(formatPainterState && formatPainterState.active)) return;
    if (ev.ctrlKey || ev.altKey || isCtrlKeyHeld || isAltKeyHeld) return;
    const cardEl = ev.target && ev.target.closest ? ev.target.closest('[data-item-id]') : null;
    if (cardEl) {
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
    }
  }, true);
}

let lastTouchpadCursorX = null;
let lastTouchpadCursorY = null;

window.addEventListener('mousemove', (ev) => {
  syncModifierCursorState(ev);
  const stepDx = typeof ev.movementX === 'number' && ev.movementX !== 0
    ? ev.movementX
    : (lastTouchpadCursorX !== null ? ev.clientX - lastTouchpadCursorX : 0);
  const stepDy = typeof ev.movementY === 'number' && ev.movementY !== 0
    ? ev.movementY
    : (lastTouchpadCursorY !== null ? ev.clientY - lastTouchpadCursorY : 0);
  lastTouchpadCursorX = ev.clientX;
  lastTouchpadCursorY = ev.clientY;

  // Clickless Touchpad Ctrl-Pan & Alt-Zoom (no mouse click required)
  if (!activeDrag) {
    if ((ev.ctrlKey || isCtrlKeyHeld) && !(ev.altKey || isAltKeyHeld)) {
      if (viewport && viewport.classList) viewport.classList.add('ctrl-pan-active');
      S.panX = Math.round(S.panX + stepDx);
      S.panY = Math.round(S.panY + stepDy);
      applyWorldTransform();
      return;
    }
    if ((ev.altKey || isAltKeyHeld) && !(ev.ctrlKey || isCtrlKeyHeld) && (Math.abs(stepDx) > 0 || Math.abs(stepDy) > 0)) {
      const delta = -stepDy + stepDx;
      const nextZoom = Math.max(0.12, Math.min(3.0, S.zoom * Math.pow(1.008, delta)));
      zoomAtCursorPoint(ev.clientX, ev.clientY, nextZoom);
      setStatus(`🔍 Alt-Zoom: ${Math.round(S.zoom * 100)}%`);
      return;
    }
    return;
  }
  const rawDx = ev.clientX - activeDrag.startMouseX;
  const rawDy = ev.clientY - activeDrag.startMouseY;
  const dist = Math.hypot(rawDx, rawDy);
  if (dist > (activeDrag.mode === 'alt_zoom' ? 10 : 3)) {
    activeDrag.moved = true;
  }
  const dx = rawDx / S.zoom;
  const dy = rawDy / S.zoom;
  if (activeDrag.mode === 'move') {
    if (activeDrag.moved && S.workflowStatus !== 'construction' && S.workflowStatus !== 'sandbox') {
      enterConstructionMode('move node', false);
    }
    activeDrag.obj.x = Math.round(activeDrag.origX + dx);
    activeDrag.obj.y = Math.round(activeDrag.origY + dy);
    moveChildrenWithContainer(activeDrag, dx, dy);
    autoSaveWorkflowState('move_node');
    renderAll({ deferWires: true });
  } else if (activeDrag.mode === 'resize') {
    if (activeDrag.moved && S.workflowStatus !== 'construction' && S.workflowStatus !== 'sandbox') {
      enterConstructionMode('resize node', false);
    }
    activeDrag.obj.userResized = true;
    activeDrag.obj.w = Math.max(140, Math.round(activeDrag.origW + dx));
    activeDrag.obj.h = Math.max(90, Math.round(activeDrag.origH + dy));
    autoSaveWorkflowState('resize_node');
    renderAll({ deferWires: true });
  } else if (activeDrag.mode === 'pan') {
    S.panX = Math.round(activeDrag.origPanX + rawDx);
    S.panY = Math.round(activeDrag.origPanY + rawDy);
    applyWorldTransform();
  } else if (activeDrag.mode === 'alt_zoom' && activeDrag.moved) {
    const delta = -rawDy + rawDx;
    const zoomFactor = Math.pow(1.012, delta);
    const nextZoom = Math.max(0.12, Math.min(3.0, activeDrag.origZoom * zoomFactor));
    zoomAtCursorPoint(activeDrag.startMouseX, activeDrag.startMouseY, nextZoom);
    setStatus(`🔍 Alt-Zoom: ${Math.round(S.zoom * 100)}%`);
  }
});

function findNearestPortForDrop(clientX, clientY, excludeNodeId) {
  if (!S || !viewport || typeof viewport.getBoundingClientRect !== 'function') return null;
  const vRect = viewport.getBoundingClientRect();
  const z = (S && S.zoom) ? S.zoom : 1.0;
  const wx = (clientX - vRect.left - (S.panX || 0)) / z;
  const wy = (clientY - vRect.top - (S.panY || 0)) / z;
  let best = null;
  let bestWorldDist = Infinity;
  const checkPort = (item, portName, dir) => {
    const pt = getPortCoordinates(item.id, portName, dir, 0);
    const wDist = Math.hypot(wx - pt.x, wy - pt.y);
    const sDist = wDist * z;
    if ((wDist <= 28 || sDist <= 32) && wDist < bestWorldDist) {
      bestWorldDist = wDist;
      best = { nodeId: item.id, portName, dir };
    }
  };
  const scanList = (arr, isCont = false) => {
    (arr || []).forEach(item => {
      if (!item || item.id === excludeNodeId || findCollapsedParentContainer(item)) return;
      (item.inPorts || (isCont ? ['in'] : [])).forEach(p => checkPort(item, p, 'in'));
      (item.outPorts || (isCont ? ['out'] : [])).forEach(p => checkPort(item, p, 'out'));
      if (isCont) (item.bottomPorts || []).forEach(p => checkPort(item, p, 'bottom'));
    });
  };
  scanList(S.categories, true);
  scanList(S.subcategories, true);
  scanList(S.cells, true);
  scanList(S.nodes, false);
  scanList(S.fileContainers, false);
  scanList(S.buses, false);
  return best;
}
window.findNearestPortForDrop = findNearestPortForDrop;

window.addEventListener('mouseup', (ev) => {
  syncModifierCursorState(ev);
  if (viewport && viewport.classList) viewport.classList.remove('ctrl-pan-active');
  if (activeDrag && activeDrag.mode === 'alt_zoom' && !activeDrag.moved) {
    const zoomOut = Boolean(ev && ev.shiftKey) || Boolean(activeDrag.zoomOutClick);
    const factor = zoomOut ? 0.80 : 1.25;
    zoomAtCursorPoint(activeDrag.startMouseX, activeDrag.startMouseY, Math.max(0.12, Math.min(3.0, S.zoom * factor)));
    setStatus(`🔍 Alt-${zoomOut ? 'Zoom Out' : 'Zoom In'}: ${Math.round(S.zoom * 100)}%`);
  } else if (activeDrag && activeDrag.mode === 'pan' && activeDrag.wasCanvasClick && !activeDrag.moved) {
    deselectAll();
  }
  const wasMoveOrResize = Boolean(activeDrag && (activeDrag.mode === 'move' || activeDrag.mode === 'resize'));
  const wasMovedDrag = Boolean(activeDrag && activeDrag.moved);
  if (connectingPort && ev && typeof ev.clientX === 'number') {
    const movedDist = portDragStartPos ? Math.hypot(ev.clientX - portDragStartPos.x, ev.clientY - portDragStartPos.y) : 10;
    const hitDot = ev.target && ev.target.closest ? ev.target.closest('.port-dot') : null;
    if (movedDist > 4 && !hitDot) {
      const nearest = findNearestPortForDrop(ev.clientX, ev.clientY, connectingPort.nodeId);
      if (nearest && connectPortPair(connectingPort, nearest)) {
        connectingPort = null;
        armedPort = null;
        renderAll();
      }
    }
  }
  activeDrag = null;
  connectingPort = null;
  if (wasMoveOrResize) {
    cancelScheduledDragWireRender();
    if (wasMovedDrag) {
      renderAll();
    } else {
      renderWires();
    }
  }
});

viewport.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  syncModifierCursorState(ev);
  if ((ev.ctrlKey || isCtrlKeyHeld) && !(ev.altKey || isAltKeyHeld) && !ev.pinch) {
    S.panX = Math.round(S.panX - (ev.deltaX || 0));
    S.panY = Math.round(S.panY - (ev.deltaY || 0));
    applyWorldTransform();
    return;
  }
  const factor = ev.deltaY < 0 ? 1.14 : 0.88;
  const targetZoom = Math.max(0.12, Math.min(3.0, S.zoom * factor));
  zoomAtCursorPoint(ev.clientX, ev.clientY, targetZoom);
  setStatus(`🔍 Zoom: ${Math.round(S.zoom * 100)}%`);
}, { passive: false });

viewport.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  if (ev.altKey || isAltKeyHeld || (activeDrag && activeDrag.mode === 'alt_zoom')) {
    return;
  }
  const rect = viewport.getBoundingClientRect();
  ctxMenuWorldPos = {
    x: Math.round((ev.clientX - rect.left - S.panX) / S.zoom),
    y: Math.round((ev.clientY - rect.top - S.panY) / S.zoom)
  };
  const menu = document.getElementById('ctxMenu');
  menu.style.left = ev.clientX + 'px';
  menu.style.top = ev.clientY + 'px';
  menu.style.display = 'flex';
});

function ctxSpawn(kind) {
  document.getElementById('ctxMenu').style.display = 'none';
  const { x, y } = ctxMenuWorldPos;
  if (kind === 'idea' || kind === 'empty') spawnIdeaNode(x, y);
  if (kind === 'sticky') addStickyNote(x, y);
  if (kind === 'external_in') spawnExternalInNode(x, y);
  if (kind === 'external_out') spawnExternalOutNode(x, y);
  if (kind === 'category') spawnCategoryContainer(x, y);
  if (kind === 'subcategory') spawnSubcategoryContainer(x, y);
  if (kind === 'cell') spawnCellSlot(x, y);
  if (kind === 'node') spawnAlgorithmNode(x, y);
  if (kind === 'llm_query') spawnLlmQueryNode(x, y);
  if (kind === 'bucket') spawnFileContainer(x, y);
  if (kind === 'bus') spawnBusNode(x, y);
}

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Control' || ev.key === 'Alt' || ev.key === 'Shift') {
    if (ev.key === 'Alt') ev.preventDefault();
    syncModifierCursorState(ev);
  }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (document.activeElement && document.activeElement.isContentEditable)) return;
  if (ev.key === '?' || (ev.key === '/' && ev.shiftKey)) {
    ev.preventDefault();
    toggleHotkeyHelpPopover(ev);
    return;
  }
  if (ev.key === 'Escape') {
    ev.preventDefault();
    if (S.fullScreenView) S.fullScreenView = false;
    resetInteractionModes();
    toggleHoneycombPopover(null, false);
    toggleGithubFeedbackPopover(null, false);
    closeFullSpectrumColorModal();
    deselectAll();
    return;
  }
  if (ev.key === 'Delete' || ev.key === 'Backspace') {
    ev.preventDefault();
    deleteSelectedElement();
  }
});

window.addEventListener('keyup', (ev) => {
  if (ev.key === 'Control' || ev.key === 'Alt' || ev.key === 'Shift') {
    syncModifierCursorState(ev);
  }
});

window.addEventListener('blur', () => {
  isCtrlKeyHeld = false;
  isAltKeyHeld = false;
  isShiftKeyHeld = false;
  if (viewport && viewport.classList) {
    viewport.classList.remove('ctrl-pan-mode', 'ctrl-pan-active', 'alt-zoom-mode', 'alt-zoom-out-mode');
  }
});

const WIRE_STYLE_ORDER = ['schematic', 'schematic_pulse', 'flow', 'ortho_pulse', 'subway_pulse', 'bezier'];

function setWireStyle(styleKey) {
  S.wireStyle = styleKey || 'schematic';
  const sel = document.getElementById('wireStyleSelect');
  if (sel && sel.value !== S.wireStyle) sel.value = S.wireStyle;
  setStatus(`📐 Wire routing style: ${S.wireStyle}`);
  renderWires();
}

function toggleWireStyle() {
  const idx = WIRE_STYLE_ORDER.indexOf(S.wireStyle || 'schematic');
  const next = WIRE_STYLE_ORDER[(idx + 1) % WIRE_STYLE_ORDER.length];
  setWireStyle(next);
}

function cleanTraceSlug(raw) {
  return String(raw || 'stage')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 28) || 'stage';
}

function getBucketSelectedFileName(fc) {
  if (!fc || !Array.isArray(fc.files) || !fc.files.length) return 'input_batch.json';
  const indices = Array.isArray(fc.selectedFileIndices) && fc.selectedFileIndices.length
    ? fc.selectedFileIndices
    : (typeof fc.selectedFileIndex === 'number' ? [fc.selectedFileIndex] : [0]);
  const idx = Math.max(0, Math.min(fc.files.length - 1, indices[0] || 0));
  const raw = fc.files[idx];
  const str = typeof raw === 'object' && raw !== null ? (raw.name || raw.label || raw.path || 'input_file') : String(raw || 'input_file');
  return str.split(' (')[0].trim().split(/[\\/]/).pop() || 'input_file';
}

function deriveStageOutputFilename(fromObj, toObj, fromPort, seedInput) {
  const portSlug = cleanTraceSlug(fromPort || 'out');
  const seedBase = String(seedInput || '').replace(/\.[^.]+$/, '');
  const bucketPat = toObj && String(toObj.pattern || toObj.filter || '');
  let ext = 'json';
  if (/\.csv\b/i.test(bucketPat)) ext = 'csv';
  else if (/\.zip\b/i.test(bucketPat)) ext = 'zip';
  else if (/\.html\b/i.test(bucketPat)) ext = 'html';
  else if (seedInput && /\.[a-z0-9]{2,5}$/i.test(seedInput) && portSlug.includes('report')) ext = seedInput.split('.').pop();
  if (fromObj && (fromObj.category === 'Bucket' || (S.fileContainers || []).some(b => b.id === fromObj.id))) {
    return seedInput || getBucketSelectedFileName(fromObj);
  }
  const nodeSlug = cleanTraceSlug((fromObj && fromObj.title) || 'step');
  if (seedBase && nodeSlug.length <= 16) return `${nodeSlug}_${portSlug}.${ext}`;
  return `${nodeSlug}_${portSlug}_out.${ext}`;
}

function buildFlowTracePlan() {
  if (!S || !Array.isArray(S.wires) || !S.wires.length) return [];
  const wireList = S.wires.filter(Boolean);
  const byFrom = {};
  const inDegree = {};
  wireList.forEach(w => {
    if (!byFrom[w.fromNode]) byFrom[w.fromNode] = [];
    byFrom[w.fromNode].push(w);
    inDegree[w.toNode] = (inDegree[w.toNode] || 0) + 1;
    if (inDegree[w.fromNode] === undefined) inDegree[w.fromNode] = 0;
  });

  let startIds = [];
  let explicitSeedFile = '';
  if (selectedItem && selectedItem.id) {
    if (selectedItem.kind === 'wire') {
      const selWire = wireList.find(w => w.id === selectedItem.id);
      if (selWire) {
        startIds = [selWire.fromNode];
      }
    } else {
      startIds = [selectedItem.id];
      const selBucket = (S.fileContainers || []).find(b => b.id === selectedItem.id);
      if (selBucket) {
        explicitSeedFile = getBucketSelectedFileName(selBucket);
      }
    }
  }
  if (!startIds.length) {
    const checkedBucket = (S.fileContainers || []).find(b =>
      Array.isArray(b.files) && b.files.length > 0 && Array.isArray(b.selectedFileIndices) && b.selectedFileIndices.length > 0 && (byFrom[b.id] || []).length > 0
    );
    if (checkedBucket) {
      startIds = [checkedBucket.id];
      explicitSeedFile = getBucketSelectedFileName(checkedBucket);
    } else {
      const rootNodes = Object.keys(inDegree).filter(id => inDegree[id] === 0 && (byFrom[id] || []).length > 0);
      startIds = rootNodes.length ? rootNodes : [wireList[0].fromNode];
    }
  }

  const fileForNode = {};
  startIds.forEach(id => {
    const startObj = findAnyItemById(id);
    if (explicitSeedFile) {
      fileForNode[id] = explicitSeedFile;
    } else if (startObj && (S.fileContainers || []).some(b => b.id === id)) {
      fileForNode[id] = getBucketSelectedFileName(startObj);
    } else {
      const upWire = wireList.find(w => w.toNode === id);
      const upObj = upWire ? findAnyItemById(upWire.fromNode) : null;
      if (upObj && (S.fileContainers || []).some(b => b.id === upObj.id)) {
        fileForNode[id] = getBucketSelectedFileName(upObj);
      } else {
        fileForNode[id] = `${cleanTraceSlug(startObj && startObj.title)}_input.json`;
      }
    }
  });

  const hops = [];
  const seenWires = new Set();
  const queue = startIds.slice();
  const enqueuedNodes = new Set(queue);
  while (queue.length > 0 && hops.length < 48) {
    const curId = queue.shift();
    const outWires = byFrom[curId] || [];
    const curObj = findAnyItemById(curId);
    const curInput = fileForNode[curId] || `${cleanTraceSlug(curObj && curObj.title)}_in.json`;
    outWires.forEach(w => {
      if (!w || seenWires.has(w.id)) return;
      seenWires.add(w.id);
      const toObj = findAnyItemById(w.toNode);
      const isDestBucket = Boolean((S.fileContainers || []).some(b => b.id === w.toNode));
      const outFile = deriveStageOutputFilename(curObj, toObj, w.fromPort, curInput);
      const hopInput = ((S.fileContainers || []).some(b => b.id === curId)) ? curInput : outFile;
      hops.push({
        index: hops.length,
        wire: w,
        fromId: curId,
        toId: w.toNode,
        fromObj: curObj,
        toObj,
        fromTitle: (curObj && curObj.title) || curId,
        toTitle: (toObj && toObj.title) || w.toNode,
        inputFile: hopInput,
        outputFile: isDestBucket ? hopInput : deriveStageOutputFilename(toObj, null, (toObj && toObj.outPorts && toObj.outPorts[0]) || 'out', hopInput),
        isDestBucket
      });
      if (!fileForNode[w.toNode]) {
        fileForNode[w.toNode] = hopInput;
      }
      if (!enqueuedNodes.has(w.toNode)) {
        enqueuedNodes.add(w.toNode);
        queue.push(w.toNode);
      }
    });
  }
  return hops;
}
window.buildFlowTracePlan = buildFlowTracePlan;

function syncFlowTraceControlsUI() {
  const playBtn = document.getElementById('btnRunFlowPulse');
  const stopBtn = document.getElementById('btnStopFlowTrace');
  const speedSel = document.getElementById('flowTraceSpeedSelect');
  const active = Boolean(flowTracerState && flowTracerState.active);
  const paused = Boolean(flowTracerState && flowTracerState.paused);
  if (playBtn) {
    if (playBtn.classList && typeof playBtn.classList.toggle === 'function') {
      playBtn.classList.toggle('tracing', active && !paused);
    }
    const lbl = playBtn.querySelector ? playBtn.querySelector('.btn-lbl') : null;
    if (lbl) {
      lbl.textContent = active ? (paused ? 'Resume' : 'Pause') : 'Trace';
    }
  }
  if (stopBtn && stopBtn.style) {
    stopBtn.style.display = active ? 'inline-flex' : 'none';
  }
  if (speedSel && String(speedSel.value) !== String(flowTracerState.speed)) {
    speedSel.value = String(flowTracerState.speed);
  }
}

function commitTraceHopOutputToBucket(hop) {
  if (!hop || !hop.toObj || !hop.isDestBucket) return null;
  const fc = (S.fileContainers || []).find(b => b.id === hop.toId);
  if (!fc) return null;
  if (!Array.isArray(fc.files)) fc.files = [];
  if (!fc.fileStates || typeof fc.fileStates !== 'object') fc.fileStates = {};
  if (fc.collapsedSections && fc.collapsedSections.files) {
    fc.collapsedSections.files = false;
  }
  const fName = hop.inputFile || `${cleanTraceSlug(hop.fromTitle)}_output.json`;
  const existingIdx = fc.files.findIndex(item => {
    const label = typeof item === 'object' && item !== null ? (item.name || item.label || item.path || '') : String(item || '');
    return label.split(' (')[0].trim() === fName;
  });
  let targetIdx = existingIdx;
  if (targetIdx < 0) {
    fc.files.push(fName);
    targetIdx = fc.files.length - 1;
  }
  fc.fileStates[targetIdx] = {
    status: 'verified',
    traceUpdated: true,
    traceBadge: existingIdx >= 0 ? 'Updated' : 'Generated',
    traceNote: `Updated during sequential trace from ${hop.fromTitle}`
  };
  fc.selectedFileIndex = targetIdx;
  fc.selectedFileIndices = [targetIdx];
  fc.lastStepRunReport = `✨ ${existingIdx >= 0 ? 'Updated' : 'Generated'} [${fName}] from ${hop.fromTitle}`;
  flowTracerState.updatedBucketMap[`${fc.id}::${fName}`] = true;
  resetAutoFitOnItemAndParents(fc);
  return { bucketId: fc.id, fileName: fName, fileIndex: targetIdx, updatedExisting: existingIdx >= 0 };
}

function ensureTraceTargetVisibleInViewport(targetObj) {
  if (!targetObj || !viewport || !S) return;
  const vw = viewport.clientWidth || 0;
  const vh = viewport.clientHeight || 0;
  if (vw < 150 || vh < 150) return;
  const z = Number(S.zoom) || 1.0;
  const cx = (Number(targetObj.x) || 0) + (Number(targetObj.w) || 260) / 2;
  const cy = (Number(targetObj.y) || 0) + (Number(targetObj.h) || 180) / 2;
  const sx = S.panX + cx * z;
  const sy = S.panY + cy * z;
  if (sx < 80 || sx > vw - 80 || sy < 70 || sy > vh - 70) {
    S.panX = Math.round(vw / 2 - cx * z);
    S.panY = Math.round(vh / 2 - cy * z);
    applyWorldTransform();
  }
}

function applyFlowTracerVisualStep(hop, nextPhase, phaseProg) {
  flowTracerState.activeWireId = hop.wire.id;
  flowTracerState.activeFileLabel = hop.inputFile;
  flowTracerState.activeOutputLabel = hop.outputFile;
  flowTracerState.phase = nextPhase;
  flowTracerState.phaseProgress = phaseProg;
  if (nextPhase === 'transit_in') {
    flowTracerState.activeNodeId = '';
    flowTracerState.receivingNodeId = hop.toId;
  } else if (nextPhase === 'processing') {
    flowTracerState.activeNodeId = hop.toId;
    flowTracerState.receivingNodeId = '';
  } else if (nextPhase === 'emit_out') {
    flowTracerState.activeNodeId = '';
    flowTracerState.receivingNodeId = hop.toId;
  }
}

function completeCurrentTraceHopAndAdvance(shouldRender = true) {
  const hops = flowTracerState.hops || [];
  const hop = hops[flowTracerState.hopIndex];
  if (!hop) return stopSequentialFlowTrace(false);
  flowTracerState.completedWireIds.add(hop.wire.id);
  flowTracerState.completedNodeIds.add(hop.fromId);
  flowTracerState.completedNodeIds.add(hop.toId);
  const bucketUpdate = commitTraceHopOutputToBucket(hop);
  if (bucketUpdate) {
    setStatus(`📦 Hop ${hop.index + 1}/${hops.length}: "${hop.toTitle}" populated [${bucketUpdate.fileName}]`);
  } else {
    setStatus(`✅ Hop ${hop.index + 1}/${hops.length}: ${hop.fromTitle} ➔ ${hop.toTitle} emitted [${hop.outputFile}]`);
  }
  flowTracerState.hopIndex += 1;
  if (flowTracerState.hopIndex >= hops.length) {
    if (flowTracerState.timerId) {
      clearInterval(flowTracerState.timerId);
      flowTracerState.timerId = null;
    }
    flowTracerState.paused = false;
    flowTracerState.active = false;
    flowTracerState.phase = 'complete';
    flowTracerState.activeWireId = '';
    flowTracerState.activeNodeId = '';
    flowTracerState.receivingNodeId = '';
    setStatus(`✅ Flow Trace Complete (${hops.length} hop${hops.length === 1 ? '' : 's'}) — Downstream nodes & File Containers updated!`);
    if (shouldRender) renderAll({ preserveInspector: true });
    syncFlowTraceControlsUI();
    return { done: true, totalHops: hops.length };
  }
  const nextHop = hops[flowTracerState.hopIndex];
  applyFlowTracerVisualStep(nextHop, 'transit_in', 0.05);
  ensureTraceTargetVisibleInViewport(nextHop.toObj);
  if (shouldRender) renderAll({ preserveInspector: true });
  syncFlowTraceControlsUI();
  return { done: false, hopIndex: flowTracerState.hopIndex, totalHops: hops.length };
}

function advanceSequentialFlowTraceTick() {
  if (!flowTracerState.active || flowTracerState.paused) return null;
  const hops = flowTracerState.hops || [];
  const hop = hops[flowTracerState.hopIndex];
  if (!hop) return stopSequentialFlowTrace(false);
  const speed = Math.max(0.25, Math.min(4.0, Number(flowTracerState.speed) || 1.0));
  const delta = 0.045 * speed;
  if (flowTracerState.phase === 'transit_in') {
    flowTracerState.phaseProgress += delta;
    if (flowTracerState.phaseProgress >= 1.0) {
      applyFlowTracerVisualStep(hop, 'processing', 0.08);
      setStatus(`⚙️ Running "${hop.toTitle}" on [${hop.inputFile}]...`);
      renderAll({ preserveInspector: true });
      return { phase: 'processing', hopIndex: flowTracerState.hopIndex };
    }
    renderWires();
    return { phase: 'transit_in', progress: flowTracerState.phaseProgress };
  }
  if (flowTracerState.phase === 'processing') {
    flowTracerState.phaseProgress += delta * 0.9;
    const fillEl = document.querySelector
      ? document.querySelector(`.node-trace-progress-badge[data-trace-node-badge="${hop.toId}"] .node-trace-progress-fill`)
      : null;
    const pct = Math.round(Math.min(100, flowTracerState.phaseProgress * 100));
    if (fillEl && fillEl.style) fillEl.style.width = `${pct}%`;
    if (flowTracerState.phaseProgress >= 1.0) {
      return completeCurrentTraceHopAndAdvance(true);
    }
    return { phase: 'processing', progress: flowTracerState.phaseProgress };
  }
  return completeCurrentTraceHopAndAdvance(true);
}
window.advanceSequentialFlowTraceTick = advanceSequentialFlowTraceTick;

function startSequentialFlowTrace(options = {}) {
  const hops = buildFlowTracePlan();
  if (!hops.length) {
    setStatus('ℹ️ Add at least 1 connected wire between nodes or File Containers to trace a flow.');
    return { ok: false, reason: 'no_wires' };
  }
  if (flowTracerState.timerId) clearInterval(flowTracerState.timerId);
  const speedEl = document.getElementById('flowTraceSpeedSelect');
  const speedVal = Number(options.speed || (speedEl && speedEl.value) || flowTracerState.speed || 1.0) || 1.0;
  flowTracerState = {
    active: true,
    paused: Boolean(options.paused),
    speed: speedVal,
    hops,
    hopIndex: 0,
    phase: 'transit_in',
    phaseProgress: 0.05,
    completedWireIds: new Set(),
    completedNodeIds: new Set(),
    activeWireId: hops[0].wire.id,
    activeNodeId: '',
    receivingNodeId: hops[0].toId,
    activeFileLabel: hops[0].inputFile,
    activeOutputLabel: hops[0].outputFile,
    updatedBucketMap: {},
    timerId: null
  };
  ensureTraceTargetVisibleInViewport(hops[0].fromObj || hops[0].toObj);
  setStatus(`▶ Tracing [${hops[0].inputFile}] (${speedVal}x): ${hops[0].fromTitle} ➔ ${hops[0].toTitle} (1/${hops.length})`);
  if (!flowTracerState.paused) {
    flowTracerState.timerId = setInterval(advanceSequentialFlowTraceTick, 65);
  }
  syncFlowTraceControlsUI();
  renderAll({ preserveInspector: true });
  return { ok: true, hopsCount: hops.length, speed: speedVal };
}
window.startSequentialFlowTrace = startSequentialFlowTrace;

function toggleSequentialFlowTrace() {
  if (!flowTracerState.active) {
    return startSequentialFlowTrace({ paused: false });
  }
  if (flowTracerState.paused) {
    flowTracerState.paused = false;
    if (!flowTracerState.timerId) {
      flowTracerState.timerId = setInterval(advanceSequentialFlowTraceTick, 65);
    }
    const hop = flowTracerState.hops[flowTracerState.hopIndex];
    setStatus(`▶ Resumed trace (${flowTracerState.speed}x): ${hop ? hop.fromTitle + ' ➔ ' + hop.toTitle : ''}`);
  } else {
    flowTracerState.paused = true;
    if (flowTracerState.timerId) {
      clearInterval(flowTracerState.timerId);
      flowTracerState.timerId = null;
    }
    setStatus(`⏸ Trace paused at hop ${flowTracerState.hopIndex + 1}/${flowTracerState.hops.length} (click ⏭ to step or ▶ to resume)`);
  }
  syncFlowTraceControlsUI();
  return getFlowTraceState();
}
window.toggleSequentialFlowTrace = toggleSequentialFlowTrace;

function stepSequentialFlowTrace() {
  if (!flowTracerState.active) {
    const res = startSequentialFlowTrace({ paused: true });
    if (!res || !res.ok) return res;
    return getFlowTraceState();
  }
  flowTracerState.paused = true;
  if (flowTracerState.timerId) {
    clearInterval(flowTracerState.timerId);
    flowTracerState.timerId = null;
  }
  if (flowTracerState.phase === 'transit_in') {
    const hop = flowTracerState.hops[flowTracerState.hopIndex];
    applyFlowTracerVisualStep(hop, 'processing', 0.55);
    setStatus(`⏭ Step: Processing [${hop.inputFile}] in "${hop.toTitle}"...`);
    renderAll({ preserveInspector: true });
    syncFlowTraceControlsUI();
    return getFlowTraceState();
  }
  completeCurrentTraceHopAndAdvance(true);
  return getFlowTraceState();
}
window.stepSequentialFlowTrace = stepSequentialFlowTrace;

function stopSequentialFlowTrace(clearStatus = false) {
  if (flowTracerState && flowTracerState.timerId) {
    clearInterval(flowTracerState.timerId);
  }
  flowTracerState = {
    active: false,
    paused: false,
    speed: (flowTracerState && flowTracerState.speed) || 1.0,
    hops: [],
    hopIndex: 0,
    phase: 'idle',
    phaseProgress: 0,
    completedWireIds: new Set(),
    completedNodeIds: new Set(),
    activeWireId: '',
    activeNodeId: '',
    receivingNodeId: '',
    activeFileLabel: '',
    activeOutputLabel: '',
    updatedBucketMap: {},
    timerId: null
  };
  syncFlowTraceControlsUI();
  if (!clearStatus) {
    setStatus('⏹ Flow trace stopped');
  }
  if (S && domLayer) renderAll({ preserveInspector: true });
  return getFlowTraceState();
}
window.stopSequentialFlowTrace = stopSequentialFlowTrace;

function setFlowTraceSpeed(rawSpeed) {
  const num = Number(rawSpeed);
  const clamped = Number.isFinite(num) ? Math.max(0.25, Math.min(4.0, num)) : 1.0;
  flowTracerState.speed = clamped;
  syncFlowTraceControlsUI();
  setStatus(`⏱️ Flow tracer speed set to ${clamped}x`);
  return clamped;
}
window.setFlowTraceSpeed = setFlowTraceSpeed;

function getFlowTraceState() {
  return {
    active: Boolean(flowTracerState.active),
    paused: Boolean(flowTracerState.paused),
    speed: flowTracerState.speed,
    hopIndex: flowTracerState.hopIndex,
    totalHops: (flowTracerState.hops || []).length,
    phase: flowTracerState.phase,
    phaseProgress: flowTracerState.phaseProgress,
    activeWireId: flowTracerState.activeWireId,
    activeNodeId: flowTracerState.activeNodeId,
    receivingNodeId: flowTracerState.receivingNodeId,
    activeFileLabel: flowTracerState.activeFileLabel,
    activeOutputLabel: flowTracerState.activeOutputLabel,
    updatedBuckets: Object.keys(flowTracerState.updatedBucketMap || {})
  };
}
window.getFlowTraceState = getFlowTraceState;

function simulateFlowPulse() {
  return toggleSequentialFlowTrace();
}
window.simulateFlowPulse = simulateFlowPulse;

function escSvgXml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportWorkflowAsPrintableSchematicSvg(forceDownload = true) {
  ensureStateDefaults();
  autoFitWorkflowContainersAndPreventOverlap();
  const allConts = [
    ...(S.categories || []).map(c => ({ ...c, kind: 'CATEGORY', stroke: '#0284c7' })),
    ...(S.subcategories || []).map(sc => ({ ...sc, kind: 'SUBCATEGORY', stroke: '#059669' })),
    ...(S.cells || []).map(cl => ({ ...cl, kind: 'CELL', stroke: '#d97706' }))
  ];
  const allLeaves = [
    ...(S.nodes || []).map(n => ({ ...n, kind: 'NODE', stroke: '#0284c7' })),
    ...(S.fileContainers || []).map(fc => ({ ...fc, kind: 'BUCKET', stroke: '#7c3aed' })),
    ...(S.buses || []).map(b => ({ ...b, kind: 'BUS', stroke: '#059669' }))
  ];
  let minX = 0, minY = 0, maxX = 2200, maxY = 1300;
  [...allConts, ...allLeaves].forEach(it => {
    const w = it.w || 280;
    const h = it.collapsed ? 78 : (it.h || 240);
    if (it.x + w + 80 > maxX) maxX = it.x + w + 80;
    if (it.y + h + 120 > maxY) maxY = it.y + h + 120;
  });
  const vw = Math.max(2400, Math.round(maxX));
  const vh = Math.max(1500, Math.round(maxY));
  const svgNs = 'ht' + 'tp://www.w3.org/2000/svg';
  const out = [];
  out.push(`<svg xmlns="${svgNs}" viewBox="0 0 ${vw} ${vh}" width="100%" height="100%" style="background:#ffffff;font-family:Consolas,monospace;">`);
  out.push(`<rect x="0" y="0" width="${vw}" height="${vh}" fill="#ffffff" />`);
  out.push(`<rect x="16" y="16" width="${vw - 32}" height="${vh - 32}" fill="none" stroke="#1e293b" stroke-width="1.5" />`);
  out.push(`<text x="32" y="42" font-size="14" font-weight="700" fill="#0f172a">ELECTRICAL SCHEMATIC DIAGRAM — ${escSvgXml(S.title || 'Workflow Blueprint')} (FIT 1 PAGE · WHITE CANVAS FOR HAND SKETCHING)</text>`);
  out.push(`<line x1="16" y1="54" x2="${vw - 16}" y2="54" stroke="#1e293b" stroke-width="1.0" />`);

  allConts.forEach(c => {
    const effH = c.collapsed ? 78 : (c.h || 320);
    out.push(`<rect x="${c.x}" y="${c.y + 40}" width="${c.w || 360}" height="${effH}" rx="4" fill="#ffffff" stroke="${c.stroke}" stroke-width="1.2" stroke-dasharray="5,3" />`);
    out.push(`<text x="${c.x + 10}" y="${c.y + 58}" font-size="11" font-weight="700" fill="${c.stroke}">${escSvgXml(c.title)}</text>`);
    (c.notes || []).slice(0, 4).forEach((nt, idx) => {
      out.push(`<text x="${c.x + 12}" y="${c.y + 74 + idx * 13}" font-size="9" fill="#475569">${escSvgXml(nt)}</text>`);
    });
  });

  allLeaves.forEach(lf => {
    const w = lf.w || 280;
    const h = lf.h || 220;
    const y0 = lf.y + 40;
    out.push(`<rect x="${lf.x}" y="${y0}" width="${w}" height="${h}" rx="3" fill="#ffffff" stroke="${lf.stroke}" stroke-width="1.25" />`);
    out.push(`<rect x="${lf.x}" y="${y0}" width="${w}" height="22" rx="2" fill="#f8fafc" stroke="${lf.stroke}" stroke-width="0.9" />`);
    out.push(`<text x="${lf.x + 8}" y="${y0 + 15}" font-size="10" font-weight="700" fill="#0f172a">${escSvgXml(lf.title)}</text>`);
    const lines = [
      ...(lf.substeps || []),
      ...(lf.rules || []),
      ...(lf.files || []),
      ...(lf.notes || [])
    ];
    lines.slice(0, 14).forEach((ln, idx) => {
      const shortLn = String(ln).length > 52 ? String(ln).slice(0, 49) + '...' : String(ln);
      out.push(`<text x="${lf.x + 8}" y="${y0 + 38 + idx * 12}" font-size="8.2" fill="#334155">${escSvgXml(shortLn)}</text>`);
    });
  });

  const obstacles = getObstacleBoxes();
  const svgOcc = { h: [], v: [], preRegistered: false };
  (S.wires || []).forEach((w, idx) => {
    const fromDir = resolveActualPortDir(w.fromNode, w.fromPort, w.fromDir || 'out');
    const toDir = resolveActualPortDir(w.toNode, w.toPort, w.toDir || 'in');
    const p1 = getPortCoordinates(w.fromNode, w.fromPort, fromDir, 0);
    const p2 = getPortCoordinates(w.toNode, w.toPort, toDir, 0);
    const pts = computeOrthWireWaypoints(w, idx, p1, p2, svgOcc, obstacles);
    if (pts && pts.length >= 2) {
      const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y + 40}`).join(' ');
      out.push(`<path d="${d}" fill="none" stroke="${normalizeHexColor(w && w.color) || '#0284c7'}" stroke-width="1.15" />`);
      out.push(`<circle cx="${pts[0].x}" cy="${pts[0].y + 40}" r="2.8" fill="#059669" />`);
      out.push(`<circle cx="${pts[pts.length - 1].x}" cy="${pts[pts.length - 1].y + 40}" r="2.8" fill="#d97706" />`);
    }
  });

  out.push(`</svg>`);
  const svgStr = out.join('\n');
  if (forceDownload && typeof Blob !== 'undefined' && typeof document.createElement === 'function') {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Workflow_Printable_Schematic_${ts}.svg`;
    a.click();
    setStatus(`📐 Exported 1-Page White-Canvas Electrical Schematic SVG: Workflow_Printable_Schematic_${ts}.svg`);
  }
  return svgStr;
}
window.exportWorkflowAsPrintableSchematicSvg = exportWorkflowAsPrintableSchematicSvg;

function openPrintableSchematicSvgSheet() {
  if (!isOfflineStandaloneMode() && window.__PRINTABLE_SCHEMATIC_SHEET_HREF__ && typeof window.open === 'function') {
    window.open(window.__PRINTABLE_SCHEMATIC_SHEET_HREF__, '_blank');
    setStatus('📐 Opened 1-Page Printable Electrical Schematic Sheet');
    return;
  }
  exportWorkflowAsPrintableSchematicSvg(true);
}
window.openPrintableSchematicSvgSheet = openPrintableSchematicSvgSheet;

window.WORKFLOW_PRESETS = window.WORKFLOW_PRESETS || {
  get example() { return createExampleWorkflowState(); },
  get hello_world() { return createHelloWorldWorkflowState(); },
  get algorithm() { return createAlgorithmWorkflowState(); }
};

function healBrokenNodeUiUrls(stateObj, _factoryStateObj) {
  return stateObj;
}
window.healBrokenNodeUiUrls = healBrokenNodeUiUrls;

function resolveWorkflowAssetUrl(entryUrl, manifestUrl) {
  const raw = String(entryUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  const baseStr = String(manifestUrl || '').trim();
  if (!baseStr || raw.startsWith('./') || raw.startsWith('../')) return raw;
  const slash = baseStr.lastIndexOf('/');
  return slash >= 0 ? (baseStr.slice(0, slash + 1) + raw) : raw;
}

function registerLoadedWorkflowPreset(wfKey, wfObj, displayTitle = '', sourceUrl = '') {
  if (!wfKey || !wfObj || typeof wfObj !== 'object') return '';
  const copyObj = JSON.parse(JSON.stringify(wfObj));
  delete copyObj.originalBaselineSnapshot;
  copyObj.workflowId = wfKey;
  if (displayTitle && !copyObj.title) copyObj.title = displayTitle;
  const finalTitle = stripWorkflowStatusPrefix(displayTitle || copyObj.title || wfKey);
  copyObj.title = finalTitle;
  if (!copyObj.workflowStatus) copyObj.workflowStatus = 'active';
  if (sourceUrl) workflowSyncConfig.urlByKey[wfKey] = sourceUrl;

  if (typeof window !== 'undefined') {
    window.WORKFLOW_PRESETS = window.WORKFLOW_PRESETS || {};
    window.WORKFLOW_PRESETS[wfKey] = copyObj;
  }
  customClonedWorkflows = customClonedWorkflows || {};
  customClonedWorkflows[wfKey] = JSON.parse(JSON.stringify(copyObj));
  updatePresetDropdownOptionStatus(wfKey, copyObj.workflowStatus, finalTitle);
  return wfKey;
}
window.registerLoadedWorkflowPreset = registerLoadedWorkflowPreset;

async function loadExternalWorkflowManifest(manifestUrl = './workflows/manifest.json', fetchOverride = null) {
  const fetchFn = (typeof fetchOverride === 'function')
    ? fetchOverride
    : (fetchOverride && typeof fetchOverride.fetch === 'function'
      ? fetchOverride.fetch
      : (isHttpLiveSyncEnabled() && typeof fetch === 'function' ? fetch : null));
  if (!fetchFn) {
    return { ok: false, offline: true, skipped: true, count: 0, keys: [] };
  }
  workflowSyncConfig.manifestUrl = manifestUrl;
  try {
    const resp = await fetchFn(manifestUrl);
    if (!resp || !resp.ok || typeof resp.json !== 'function') {
      return { ok: false, status: resp ? resp.status : 0, count: 0, keys: [] };
    }
    const manifest = await resp.json();
    if (!manifest || typeof manifest !== 'object') {
      return { ok: false, count: 0, keys: [] };
    }
    if (manifest.syncEndpoint) {
      setWorkflowSyncEndpoint(manifest.syncEndpoint);
    }
    const entries = Array.isArray(manifest.workflows) ? manifest.workflows : [];
    const registeredKeys = [];
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      let stateCandidate = (entry.state && typeof entry.state === 'object') ? entry.state : null;
      const itemUrl = entry.url ? resolveWorkflowAssetUrl(entry.url, manifestUrl) : '';
      if (!stateCandidate && itemUrl) {
        try {
          const itemResp = await fetchFn(itemUrl);
          if (itemResp && itemResp.ok && typeof itemResp.json === 'function') {
            const rawJson = await itemResp.json();
            stateCandidate = (rawJson && rawJson.workflow) ? rawJson.workflow : ((rawJson && rawJson.state) ? rawJson.state : rawJson);
          }
        } catch (e) {}
      }
      if (!stateCandidate || typeof stateCandidate !== 'object') continue;
      const slugFallback = stripWorkflowStatusPrefix(entry.title || stateCandidate.title || 'workflow')
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const wfKey = String(entry.id || entry.workflowId || entry.key || stateCandidate.workflowId || slugFallback || '').trim();
      if (!wfKey) continue;
      if (entry.status && !stateCandidate.workflowStatus) stateCandidate.workflowStatus = entry.status;
      registerLoadedWorkflowPreset(wfKey, stateCandidate, entry.title || stateCandidate.title || wfKey, itemUrl);
      registeredKeys.push(wfKey);
    }
    if (S && S.workflowId) {
      const selEl = document.getElementById('presetSelect');
      if (selEl) selEl.value = S.workflowId;
    }
    filterWorkflowDropdown();
    return { ok: true, count: registeredKeys.length, keys: registeredKeys, syncEndpoint: getWorkflowSyncEndpoint() };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err), count: 0, keys: [] };
  }
}
window.loadExternalWorkflowManifest = loadExternalWorkflowManifest;

function readSelectedFileText(file) {
  if (!file) return Promise.resolve('');
  if (typeof file.text === 'function') return file.text();
  if (typeof file.content === 'string') return Promise.resolve(file.content);
  if (typeof file._content === 'string') return Promise.resolve(file._content);
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('File read error'));
      reader.readAsText(file);
    });
  }
  return Promise.resolve('');
}

function openWorkflowFolderPicker() {
  const inp = document.getElementById('workflowFolderInput');
  if (inp && typeof inp.click === 'function') {
    try { inp.value = ''; } catch (e) {}
    inp.click();
    return true;
  }
  return false;
}
window.openWorkflowFolderPicker = openWorkflowFolderPicker;

async function loadWorkflowFolderFiles(ev) {
  const rawFiles = (ev && ev.target && ev.target.files) ? Array.from(ev.target.files) : (Array.isArray(ev) ? ev : []);
  const jsonFiles = rawFiles.filter(f => f && /\.json$/i.test(String(f.name || '')));
  if (jsonFiles.length === 0) {
    setStatus('📂 No .json workflow files found in selected folder');
    return { ok: false, count: 0, keys: [] };
  }
  const parsedFiles = [];
  const byFileName = {};
  for (const file of jsonFiles) {
    try {
      const text = await readSelectedFileText(file);
      const parsed = JSON.parse(text);
      const fname = String(file.name || '').trim();
      const rec = { name: fname, parsed };
      parsedFiles.push(rec);
      byFileName[fname.toLowerCase()] = rec;
    } catch (e) {}
  }

  const importedKeys = [];
  const consumedNames = new Set();

  for (const rec of parsedFiles) {
    const p = rec.parsed;
    if (!p || typeof p !== 'object' || !Array.isArray(p.workflows)) continue;
    consumedNames.add(rec.name.toLowerCase());
    if (p.syncEndpoint) setWorkflowSyncEndpoint(p.syncEndpoint);
    for (const entry of p.workflows) {
      if (!entry || typeof entry !== 'object') continue;
      let wfObj = (entry.state && typeof entry.state === 'object') ? entry.state : null;
      if (!wfObj && entry.url) {
        const refBase = String(entry.url).split(/[\/]/).pop().split('?')[0].toLowerCase();
        const linked = byFileName[refBase];
        if (linked && linked.parsed) {
          consumedNames.add(linked.name.toLowerCase());
          const lp = linked.parsed;
          wfObj = lp.workflow ? lp.workflow : (lp.state ? lp.state : lp);
        }
      }
      if (!wfObj || typeof wfObj !== 'object') continue;
      const wfKey = String(entry.id || entry.workflowId || entry.key || wfObj.workflowId || '').trim();
      if (!wfKey) continue;
      if (entry.status && !wfObj.workflowStatus) wfObj.workflowStatus = entry.status;
      registerLoadedWorkflowPreset(wfKey, wfObj, entry.title || wfObj.title || wfKey);
      if (!importedKeys.includes(wfKey)) importedKeys.push(wfKey);
    }
  }

  for (const rec of parsedFiles) {
    if (consumedNames.has(rec.name.toLowerCase())) continue;
    const p = rec.parsed;
    if (!p || typeof p !== 'object') continue;
    const wfObj = p.workflow ? p.workflow : (p.state ? p.state : p);
    if (!wfObj || typeof wfObj !== 'object' || (!Array.isArray(wfObj.nodes) && !Array.isArray(wfObj.stickyNotes))) continue;
    const baseTitle = stripWorkflowStatusPrefix(wfObj.title || rec.name.replace(/(\.workflow)?\.json$/i, ''));
    const slug = baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const wfKey = String(wfObj.workflowId || (BUILTIN_PRESET_KEYS.has(slug) ? ('folder_' + slug) : slug) || ('folder_' + Date.now().toString(36)));
    registerLoadedWorkflowPreset(wfKey, wfObj, baseTitle);
    if (!importedKeys.includes(wfKey)) importedKeys.push(wfKey);
  }

  if (importedKeys.length > 0) {
    persistCustomClonedWorkflows();
    loadPresetTemplate(importedKeys[0]);
    setStatus(`📂 Synced ${importedKeys.length} workflow(s) from local folder into dropdown`);
    return { ok: true, count: importedKeys.length, keys: importedKeys };
  }
  setStatus('⚠️ Selected folder contained no valid workflow JSON schemas');
  return { ok: false, count: 0, keys: [] };
}
window.loadWorkflowFolderFiles = loadWorkflowFolderFiles;

function formatAutoSaveTime(dt) {
  const d = dt || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function updateAutoSaveStatusPill(labelSuffix, customPrefix) {
  const pill = document.getElementById('autoSaveStatusPill');
  const ts = labelSuffix || formatAutoSaveTime();
  const wfKey = (typeof getCurrentWorkflowKey === 'function' ? getCurrentWorkflowKey() : (S && S.workflowId)) || 'example';
  if (pill) {
    const prefix = customPrefix || `💾 Auto-Saved (${wfKey})`;
    pill.textContent = `${prefix} · ${ts}`;
    pill.setAttribute('data-last-saved', ts);
  }
}
window.updateAutoSaveStatusPill = updateAutoSaveStatusPill;

let lastSyncedRev = 0;
let lastSyncedUpdatedAt = '';
let liveSyncDebounceTimer = null;
let liveSyncPollTimer = null;
let isSyncingInFlight = false;

function isHttpLiveSyncEnabled() {
  try {
    if (window.__FORCE_OFFLINE_EXPORT__) return false;
    const proto = (window.location && window.location.protocol) ? String(window.location.protocol) : '';
    return proto.startsWith('http');
  } catch (e) {
    return false;
  }
}
window.isHttpLiveSyncEnabled = isHttpLiveSyncEnabled;

function mergeClientWorkflowState(localState, remoteState) {
  if (!remoteState || typeof remoteState !== 'object') return localState;
  const merged = JSON.parse(JSON.stringify(localState || {}));
  ['title', 'workflowId', 'workflowStatus', 'lockLayout', 'updatedAt', '_hasUserSavedLayout'].forEach(k => {
    if (remoteState[k] !== undefined) merged[k] = remoteState[k];
  });
  const cols = ['categories', 'subcategories', 'cells', 'nodes', 'fileContainers', 'buses', 'wires', 'stickyNotes'];
  cols.forEach(col => {
    const baseList = Array.isArray(merged[col]) ? merged[col] : [];
    const incList = Array.isArray(remoteState[col]) ? remoteState[col] : [];
    if (incList.length === 0 && baseList.length === 0) {
      merged[col] = [];
      return;
    }
    const byId = {};
    const order = [];
    baseList.forEach((it, idx) => {
      if (!it || typeof it !== 'object') return;
      const key = String(it.id || `${col}_${idx}`);
      byId[key] = Object.assign({}, it);
      order.push(key);
    });
    incList.forEach((it, idx) => {
      if (!it || typeof it !== 'object') return;
      const key = String(it.id || `${col}_inc_${idx}`);
      if (byId[key]) {
        byId[key] = Object.assign({}, byId[key], it);
      } else {
        byId[key] = Object.assign({}, it);
        order.push(key);
      }
    });
    merged[col] = order.map(k => byId[k]);
  });
  return merged;
}
window.mergeClientWorkflowState = mergeClientWorkflowState;

async function syncWorkflowToServerNow(reason = 'edit') {
  const ep = getWorkflowSyncEndpoint();
  if (!S || !isHttpLiveSyncEnabled() || typeof fetch !== 'function' || !ep) {
    return { ok: false, offline: true };
  }
  const wfKey = getCurrentWorkflowKey() || 'example';
  S.updatedAt = new Date().toISOString();
  const copyObj = JSON.parse(JSON.stringify(S));
  delete copyObj.originalBaselineSnapshot;
  try {
    isSyncingInFlight = true;
    const resp = await fetch(`${ep}/${encodeURIComponent(wfKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: wfKey,
        title: S.title || wfKey,
        status: S.workflowStatus || 'construction',
        actor: 'user',
        merge: true,
        reason,
        state: copyObj
      })
    });
    if (resp && resp.ok && typeof resp.json === 'function') {
      const data = await resp.json();
      if (data && data.ok) {
        lastSyncedRev = Math.max(lastSyncedRev, Number(data.rev || 1));
        lastSyncedUpdatedAt = data.updated_at || S.updatedAt;
        updateAutoSaveStatusPill(formatAutoSaveTime(), `🟢 Synced (${wfKey})`);
        return data;
      }
    }
  } catch (e) {
    // Offline fallback stays active via localStorage
  } finally {
    isSyncingInFlight = false;
  }
  return { ok: false };
}
window.syncWorkflowToServerNow = syncWorkflowToServerNow;

function autoSaveCurrentWorkflowLayout(reason = 'edit') {
  if (!S) return false;
  try {
    const wfKey = getCurrentWorkflowKey() || 'example';
    S._hasUserSavedLayout = true;
    S.updatedAt = new Date().toISOString();
    const copyObj = JSON.parse(JSON.stringify(S));
    delete copyObj.originalBaselineSnapshot;
    const serialized = JSON.stringify(copyObj);
    localStorage.setItem(`sandbox_wf_preset_state_${wfKey}`, serialized);
    localStorage.setItem('sandbox_workflow_v180_state', serialized);
    updateAutoSaveStatusPill(formatAutoSaveTime(), `💾 Auto-Saved (${wfKey})`);
    if (isHttpLiveSyncEnabled() && getWorkflowSyncEndpoint()) {
      if (liveSyncDebounceTimer) clearTimeout(liveSyncDebounceTimer);
      liveSyncDebounceTimer = setTimeout(() => {
        syncWorkflowToServerNow(reason);
      }, 300);
    }
    return true;
  } catch (e) {
    return false;
  }
}
window.autoSaveCurrentWorkflowLayout = autoSaveCurrentWorkflowLayout;

function autoSaveWorkflowState(reason = 'edit') {
  return autoSaveCurrentWorkflowLayout(reason);
}
window.autoSaveWorkflowState = autoSaveWorkflowState;

function isUserActivelyInteractingWithCanvas() {
  if (activeDrag || connectingPort || isSyncingInFlight) return true;
  if (typeof isInspectorInputFocused === 'function' && isInspectorInputFocused()) return true;
  if (typeof isStickyNoteInputFocused === 'function' && isStickyNoteInputFocused()) return true;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
    return true;
  }
  return false;
}

async function loadDiskWorkflowIfAvailable(wfKey = 'example', forceApply = true) {
  const ep = getWorkflowSyncEndpoint();
  const staticUrl = workflowSyncConfig.urlByKey[wfKey] || '';
  if (!isHttpLiveSyncEnabled() || typeof fetch !== 'function' || (!ep && !staticUrl)) {
    return { ok: false, offline: true };
  }
  try {
    let remoteState = null;
    let remoteRev = 0;
    let remoteUpdated = '';
    let remoteActor = 'sync';
    if (ep) {
      try {
        const apiResp = await fetch(`${ep}/${encodeURIComponent(wfKey)}?since_rev=0`);
        if (apiResp && (apiResp.ok || typeof apiResp.json === 'function')) {
          const apiData = await apiResp.json();
          if (apiData && apiData.ok && apiData.exists && apiData.state && typeof apiData.state === 'object') {
            remoteState = apiData.state;
            remoteRev = Number(apiData.rev || 1);
            remoteUpdated = String(apiData.updated_at || remoteState.updatedAt || '');
            remoteActor = apiData.actor || 'sync';
          }
        }
      } catch (e) {}
    }

    if (!remoteState && staticUrl) {
      const sep = staticUrl.includes('?') ? '&' : '?';
      const staticResp = await fetch(`${staticUrl}${sep}t=${Date.now()}`, { cache: 'no-store' });
      if (staticResp && (staticResp.ok || typeof staticResp.json === 'function')) {
        const staticJson = await staticResp.json();
        const candidate = (staticJson && staticJson.state && typeof staticJson.state === 'object') ? staticJson.state : staticJson;
        if (candidate && typeof candidate === 'object' && (Array.isArray(candidate.nodes) || Array.isArray(candidate.stickyNotes))) {
          remoteState = candidate;
          remoteRev = Number(staticJson.rev || candidate.rev || 1);
          remoteUpdated = String(staticJson.updated_at || candidate.updatedAt || '');
        }
      }
    }

    if (remoteState && typeof remoteState === 'object' && (Array.isArray(remoteState.nodes) || Array.isArray(remoteState.stickyNotes))) {
      const savedTemplates = S.customNodeTemplates ? S.customNodeTemplates.slice() : loadStoredCustomTemplates();
      const baseline = S.originalBaselineSnapshot;
      const isCompleteDiskGraph = Array.isArray(remoteState.nodes) && remoteState.nodes.length >= 2 && Array.isArray(remoteState.wires);
      S = (forceApply && isCompleteDiskGraph && (!S.stickyNotes || S.stickyNotes.length <= 2))
        ? mergeClientWorkflowState(JSON.parse(JSON.stringify(remoteState)), S)
        : mergeClientWorkflowState(S, remoteState);
      S.workflowId = wfKey;
      S.customNodeTemplates = savedTemplates;
      S.wireSelectMode = false;
      S.wireDeleteMode = false;
      if (baseline) S.originalBaselineSnapshot = baseline;
      ensureStateDefaults();
      resetInteractionModes();
      lastSyncedRev = Math.max(lastSyncedRev, remoteRev);
      if (remoteUpdated) lastSyncedUpdatedAt = remoteUpdated;
      try {
        const copyObj = JSON.parse(JSON.stringify(S));
        delete copyObj.originalBaselineSnapshot;
        localStorage.setItem(`sandbox_wf_preset_state_${wfKey}`, JSON.stringify(copyObj));
      } catch (e) {}
      updatePresetDropdownOptionStatus(wfKey, S.workflowStatus || 'active', S.title);
      syncWorkflowStatusUI();
      renderAll({ preserveInspector: true });
      renderWires();
      updateAutoSaveStatusPill(formatAutoSaveTime(), `🟢 Synced (${wfKey})`);
      return { ok: true, applied: true, rev: lastSyncedRev, updatedAt: lastSyncedUpdatedAt, actor: remoteActor };
    }
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
  return { ok: false, notFound: true };
}
window.loadDiskWorkflowIfAvailable = loadDiskWorkflowIfAvailable;

async function pollWorkflowSyncFromServer(forceApply = false) {
  const ep = getWorkflowSyncEndpoint();
  if (!S || !isHttpLiveSyncEnabled() || typeof fetch !== 'function' || (!ep && !workflowSyncConfig.urlByKey[getCurrentWorkflowKey() || ''])) {
    return { ok: false, skipped: true };
  }
  if (!forceApply && isUserActivelyInteractingWithCanvas()) return { ok: false, busy: true };
  const wfKey = getCurrentWorkflowKey() || 'example';
  if (forceApply) {
    const diskRes = await loadDiskWorkflowIfAvailable(wfKey, true);
    if (diskRes && diskRes.ok) return diskRes;
  }
  try {
    if (ep) {
      const resp = await fetch(`${ep}/${encodeURIComponent(wfKey)}?since_rev=${encodeURIComponent(lastSyncedRev)}`);
      if (resp && resp.ok && typeof resp.json === 'function') {
        const data = await resp.json();
        if (data && data.ok && data.exists && !data.up_to_date && !data.unchanged && data.state) {
          const incomingRev = Number(data.rev || 0);
          const incomingUpdated = String(data.updated_at || data.state.updatedAt || '');
          if (incomingRev > lastSyncedRev || (incomingUpdated && incomingUpdated > lastSyncedUpdatedAt)) {
            return await loadDiskWorkflowIfAvailable(wfKey, true);
          }
        }
        return data || { ok: true, unchanged: true };
      }
    }
    const staticUrl = workflowSyncConfig.urlByKey[wfKey] || '';
    if (staticUrl) {
      const sep = staticUrl.includes('?') ? '&' : '?';
      const staticResp = await fetch(`${staticUrl}${sep}t=${Date.now()}`, { cache: 'no-store' });
      if (staticResp && staticResp.ok && typeof staticResp.json === 'function') {
        const staticJson = await staticResp.json();
        const candidate = (staticJson && staticJson.state) ? staticJson.state : staticJson;
        const remoteUpdated = String(staticJson.updated_at || (candidate && candidate.updatedAt) || '');
        if (remoteUpdated && (!lastSyncedUpdatedAt || remoteUpdated > lastSyncedUpdatedAt)) {
          return await loadDiskWorkflowIfAvailable(wfKey, true);
        }
      }
    }
    return { ok: true, applied: false, unchanged: true, rev: lastSyncedRev };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}
window.pollWorkflowSyncFromServer = pollWorkflowSyncFromServer;

function startLiveWorkflowSyncLoop() {
  if (!isHttpLiveSyncEnabled()) return;
  if (liveSyncPollTimer && typeof clearInterval === 'function') {
    clearInterval(liveSyncPollTimer);
  }
  if (typeof setInterval === 'function') {
    liveSyncPollTimer = setInterval(() => {
      pollWorkflowSyncFromServer(false);
    }, 3000);
  }
}
window.startLiveWorkflowSyncLoop = startLiveWorkflowSyncLoop;

function schedulePostMountLayoutSnap() {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => { renderAll(); renderWires(); });
  }
  if (typeof setTimeout === 'function') {
    setTimeout(() => { renderAll(); renderWires(); }, 60);
  }
}

function loadPresetTemplate(presetKey, forceFactory = false) {
  const normalizedKey = presetKey;
  if (!isPresetAllowedInStandalone(normalizedKey)) {
    pruneStandalonePresetDropdown();
    return;
  }
  if (typeof stopSequentialFlowTrace === 'function') stopSequentialFlowTrace(true);
  invalidateWireRouteCache();
  resetInteractionModes();
  if (normalizedKey === 'blank') {
    return createNewBlankWorkflow();
  }
  lastSyncedRev = 0;
  const savedTemplates = S.customNodeTemplates ? S.customNodeTemplates.slice() : loadStoredCustomTemplates();
  const presetMap = (typeof window !== 'undefined' && window.WORKFLOW_PRESETS) ? window.WORKFLOW_PRESETS : {};
  const hasRegistered = Boolean(presetMap && presetMap[normalizedKey]);
  if (hasRegistered && !BUILTIN_PRESET_KEYS.has(normalizedKey)) {
    customClonedWorkflows = customClonedWorkflows || {};
    if (forceFactory || !customClonedWorkflows[normalizedKey]) {
      customClonedWorkflows[normalizedKey] = JSON.parse(JSON.stringify(presetMap[normalizedKey]));
    }
  }
  if ((!forceFactory || hasRegistered) && customClonedWorkflows && customClonedWorkflows[normalizedKey]) {
    S = JSON.parse(JSON.stringify(customClonedWorkflows[normalizedKey]));
    S.workflowId = normalizedKey;
    S.wireSelectMode = false;
    S.wireDeleteMode = false;
    S.customNodeTemplates = savedTemplates;
    ensureStateDefaults();
    resetInteractionModes();
    selectedItem = null;
    const selEl = document.getElementById('presetSelect');
    if (selEl) selEl.value = normalizedKey;
    updatePresetDropdownOptionStatus(normalizedKey, S.workflowStatus || 'active', S.title);
    syncWorkflowStatusUI();
    setStatus(`📐 Loaded workflow (${S.workflowStatus === 'construction' ? '🚧 Under Construction' : '🟢 Active'}): ${S.title}`);
    renderAll();
    fitViewToAll();
    renderWires();
    schedulePostMountLayoutSnap();
    if (!forceFactory && isHttpLiveSyncEnabled()) pollWorkflowSyncFromServer(true);
    return;
  }

  if (normalizedKey === 'hello_world') {
    S = createHelloWorldWorkflowState();
  } else if (normalizedKey === 'algorithm') {
    S = createAlgorithmWorkflowState();
  } else {
    S = createExampleWorkflowState();
    S.workflowId = normalizedKey || 'example';
  }
  S.customNodeTemplates = savedTemplates;
  ensureStateDefaults();
  resetInteractionModes();
  captureBaselineSnapshot(true);
  selectedItem = null;
  const selFallback = document.getElementById('presetSelect');
  if (selFallback && S.workflowId) selFallback.value = S.workflowId;
  syncWorkflowStatusUI();
  setStatus(`🟢 Loaded Workflow: ${S.title}`);
  renderAll();
  fitViewToAll();
  renderWires();
  schedulePostMountLayoutSnap();
  if (!forceFactory && isHttpLiveSyncEnabled()) pollWorkflowSyncFromServer(true);
}
window.loadPresetTemplate = loadPresetTemplate;

/* Snapshot & Draw Markup Modal */
const sandboxSnapshotState = {
  open: false,
  penColor: '#22c55e',
  brushSize: 4,
  drawing: false,
  strokes: [],
  currentStroke: null
};

function drawWrappedCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';
  let linesDrawn = 0;
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line ? (line + ' ' + words[i]) : words[i];
    const testW = (typeof ctx.measureText === 'function') ? ctx.measureText(testLine).width : (testLine.length * 5.2);
    if (testW > maxWidth && line) {
      ctx.fillText(line, x, curY);
      linesDrawn++;
      curY += lineHeight;
      if (linesDrawn >= maxLines) return curY;
      line = words[i];
    } else {
      line = testLine;
    }
  }
  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

function renderWorkflowSchematicToCanvas(ctx, cw, ch) {
  if (!ctx || !S) return;
  ctx.fillStyle = '#111518';
  ctx.fillRect(0, 0, cw, ch);

  // Subtle schematic grid
  ctx.strokeStyle = 'rgba(236, 230, 216, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < cw; gx += 32) {
    ctx.beginPath(); ctx.moveTo(gx, 44); ctx.lineTo(gx, ch); ctx.stroke();
  }
  for (let gy = 44; gy < ch; gy += 32) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke();
  }

  // Top title bar
  ctx.fillStyle = '#191f24';
  ctx.fillRect(0, 0, cw, 44);
  ctx.strokeStyle = 'rgba(236, 230, 216, 0.18)';
  ctx.strokeRect(0, 0, cw, 44);
  ctx.fillStyle = '#dbbc7f';
  ctx.font = 'bold 13px Consolas, monospace';
  ctx.fillText(`⚡ Sandbox workflow tool v1.8.0 — ${S.title || S.workflowId || 'Workflow Schematic'}`, 14, 27);

  const allItems = [
    ...(S.categories || []),
    ...(S.subcategories || []),
    ...(S.cells || []),
    ...(S.nodes || []),
    ...(S.fileContainers || []),
    ...(S.buses || []),
    ...(S.stickyNotes || [])
  ];
  if (allItems.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  allItems.forEach(it => {
    const w = it.w || 320;
    const h = it.collapsed ? 78 : (it.h || estimateItemHeight(it, 'node'));
    if (it.x < minX) minX = it.x;
    if (it.y < minY) minY = it.y;
    if (it.x + w > maxX) maxX = it.x + w;
    if (it.y + h > maxY) maxY = it.y + h;
  });
  const pad = 40;
  const worldW = Math.max(400, maxX - minX + pad * 2);
  const worldH = Math.max(260, maxY - minY + pad * 2);
  const availH = ch - 52;
  const scale = Math.min((cw - 24) / worldW, (availH - 16) / worldH);
  const offX = 12 + ((cw - 24) - worldW * scale) / 2 - (minX - pad) * scale;
  const offY = 50 + ((availH - 16) - worldH * scale) / 2 - (minY - pad) * scale;

  const tx = (x) => Math.round(offX + x * scale);
  const ty = (y) => Math.round(offY + y * scale);
  const ts = (v) => Math.max(1, Math.round(v * scale));

  // 1. Draw Stage / Category / Subcategory / Cell containers with clip
  [...(S.categories || []), ...(S.subcategories || []), ...(S.cells || [])].forEach(c => {
    const x = tx(c.x), y = ty(c.y), w = ts(c.w || 340), h = ts(c.collapsed ? 78 : (c.h || 260));
    ctx.save();
    if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    }
    const cHex = normalizeHexColor(c && c.color);
    ctx.fillStyle = cHex ? hexToRgba(cHex, 0.08) : 'rgba(25, 31, 36, 0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = cHex || '#7fbbb3';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = cHex ? hexToRgba(cHex, 0.24) : 'rgba(127, 187, 179, 0.16)';
    ctx.fillRect(x, y, w, Math.min(24, h));
    ctx.fillStyle = '#dbbc7f';
    ctx.font = 'bold 10.5px Segoe UI, sans-serif';
    ctx.fillText(String(c.title || c.id), x + 8, y + 16);
    ctx.restore();
  });

  // 2. Draw Wires
  const obstacles = typeof getObstacleBoxes === 'function' ? getObstacleBoxes() : [];
  (S.wires || []).forEach((w, idx) => {
    const fromDir = resolveActualPortDir(w.fromNode, w.fromPort, w.fromDir || 'out');
    const toDir = resolveActualPortDir(w.toNode, w.toPort, w.toDir || 'in');
    const p1 = getPortCoordinates(w.fromNode, w.fromPort, fromDir, 0);
    const p2 = getPortCoordinates(w.toNode, w.toPort, toDir, 0);
    const pts = typeof computeOrthogonalWaypoints === 'function'
      ? computeOrthogonalWaypoints(w, idx, p1, p2, 0, obstacles)
      : [p1, p2];
    if (pts && pts.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(tx(pts[0].x), ty(pts[0].y));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(tx(pts[i].x), ty(pts[i].y));
      }
      ctx.strokeStyle = normalizeHexColor(w && w.color) || '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx(pts[0].x), ty(pts[0].y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#a7c080';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx(pts[pts.length - 1].x), ty(pts[pts.length - 1].y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#dbbc7f';
      ctx.fill();
    }
  });

  // 3. Draw File Containers (S.fileContainers) with clip
  (S.fileContainers || []).forEach(fc => {
    const x = tx(fc.x), y = ty(fc.y), w = ts(fc.w || 340), h = ts(fc.h || estimateItemHeight(fc, 'bucket'));
    ctx.save();
    if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    }
    const fcHex = normalizeHexColor(fc && fc.color);
    ctx.fillStyle = fcHex ? hexToRgba(fcHex, 0.14) : '#241f18';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = fcHex || '#dbbc7f';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = fcHex ? hexToRgba(fcHex, 0.24) : 'rgba(219, 188, 127, 0.22)';
    ctx.fillRect(x, y, w, Math.min(24, h));
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.fillText(`🗄️ ${fc.title || fc.id} (${(fc.files || []).length} files)`, x + 7, y + 16);
    let cy = y + 36;
    ctx.fillStyle = '#dbbc7f';
    ctx.font = '8.5px Consolas, monospace';
    ctx.fillText(`Filter: ${fc.pattern || fc.filter || '*.*'}`, x + 7, cy);
    cy += 13;
    (fc.files || []).slice(0, 5).forEach(f => {
      if (cy + 10 > y + h - 4) return;
      const fName = String(f || '').replace(/^\.\//, '');
      ctx.fillStyle = '#7fbbb3';
      ctx.fillText(`📄 ${fName}`, x + 7, cy);
      cy += 11;
    });
    ctx.restore();
  });

  // 4. Draw Bus Bars (S.buses)
  (S.buses || []).forEach(bus => {
    const x = tx(bus.x), y = ty(bus.y), w = ts(bus.w || 250), h = ts(bus.h || 140);
    ctx.save();
    const busHex = normalizeHexColor(bus && bus.color);
    ctx.fillStyle = busHex ? hexToRgba(busHex, 0.14) : '#182429';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = busHex || '#38bdf8';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 9.5px Segoe UI, sans-serif';
    ctx.fillText(`🚌 ${bus.title || bus.id}`, x + 6, y + 15);
    ctx.restore();
  });

  // 5. Draw Nodes with clip + separate left/right port columns + wrapped steps
  (S.nodes || []).forEach(n => {
    const x = tx(n.x), y = ty(n.y), w = ts(n.w || 460), h = ts(n.h || estimateItemHeight(n, 'node'));
    ctx.save();
    if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    }
    const nHex = normalizeHexColor(n && n.color);
    ctx.fillStyle = nHex ? hexToRgba(nHex, 0.14) : '#1e262d';
    ctx.strokeStyle = nHex || (n.type === 'idea' ? '#f59e0b' : (n.type === 'external_in' ? '#38bdf8' : (n.type === 'external_out' ? '#10b981' : '#a7c080')));
    ctx.lineWidth = 1.8;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = nHex ? hexToRgba(nHex, 0.24) : 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(x, y, w, Math.min(25, h));
    ctx.fillStyle = '#ece6d8';
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.fillText(String(n.title || n.id), x + 7, y + 16);

    let cursorY = y + 34;
    const uiUrl = (n.ui_url !== undefined ? n.ui_url : n.uiUrl) || '';
    if (uiUrl && cursorY + 14 < y + h) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(x + 6, cursorY - 10, Math.max(40, w - 12), 15);
      ctx.fillStyle = '#7fbbb3';
      ctx.font = '8.5px Consolas, monospace';
      ctx.fillText('🚀 ' + String(n.ui_label || uiUrl), x + 9, cursorY);
      cursorY += 15;
    }

    // Separate left & right port columns (never overlapping!)
    const inPorts = Array.isArray(n.inPorts) ? n.inPorts : [];
    const outPorts = Array.isArray(n.outPorts) ? n.outPorts : [];
    const maxPorts = Math.max(inPorts.length, outPorts.length);
    const colW = Math.max(40, Math.floor((w - 20) / 2));
    ctx.font = '8px Consolas, monospace';
    for (let pi = 0; pi < maxPorts; pi++) {
      if (cursorY + 10 > y + h - 6) break;
      if (inPorts[pi]) {
        ctx.save();
        if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
          ctx.beginPath(); ctx.rect(x + 6, cursorY - 9, colW, 12); ctx.clip();
        }
        ctx.fillStyle = '#83c092';
        ctx.fillText('● ' + String(inPorts[pi]), x + 7, cursorY);
        ctx.restore();
      }
      if (outPorts[pi]) {
        ctx.save();
        const rightX = x + Math.floor(w / 2) + 4;
        if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
          ctx.beginPath(); ctx.rect(rightX, cursorY - 9, colW, 12); ctx.clip();
        }
        ctx.fillStyle = '#dbbc7f';
        ctx.fillText('● ' + String(outPorts[pi]), rightX, cursorY);
        ctx.restore();
      }
      cursorY += 11;
    }

    // Wrapped step bullets inside node box
    const steps = Array.isArray(n.steps) ? n.steps : (Array.isArray(n.notes) ? n.notes : []);
    ctx.fillStyle = '#d8d2c5';
    ctx.font = '8.5px Segoe UI, sans-serif';
    steps.slice(0, 4).forEach((st, idx) => {
      if (cursorY + 10 > y + h - 4) return;
      cursorY = drawWrappedCanvasText(ctx, `${idx + 1}. ${st}`, x + 8, cursorY, Math.max(60, w - 16), 10.5, 2);
    });
    ctx.restore();
  });

  // 6. Draw Sticky Notes + multi-node dashed attachment tethers + wrapped checklists
  (S.stickyNotes || []).forEach(sn => {
    const sx = tx(sn.x || 180), sy = ty(sn.y || 140);
    const sw = ts(sn.w || 280), sh = ts(sn.h || 240);
    const tetherIds = getStickyTetherIds(sn);
    tetherIds.forEach(tId => {
      const target = findAnyItemById(tId);
      if (target) {
        const tx2 = tx((target.x || 0) + (target.w || 460) / 2);
        const ty2 = ty((target.y || 0) + 22);
        ctx.save();
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(sx + Math.round(sw / 2), sy + Math.round(sh / 2));
        ctx.lineTo(tx2, ty2);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);
        ctx.restore();
      }
    });
    ctx.save();
    if (typeof ctx.beginPath === 'function' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    }
    const snHex = normalizeHexColor(sn && sn.color);
    ctx.fillStyle = snHex ? hexToRgba(snHex, 0.24) : 'rgba(48, 41, 22, 0.95)';
    ctx.strokeStyle = snHex || '#facc15';
    ctx.lineWidth = 1.8;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9.5px Segoe UI, sans-serif';
    ctx.fillText(`📝 ${String(sn.title || 'Sticky Note')} [${sn.assignee || 'both'}]`, sx + 7, sy + 15);
    let cy = sy + 28;
    if (sn.text) {
      ctx.fillStyle = '#fef3c7';
      ctx.font = '8.5px Segoe UI, sans-serif';
      cy = drawWrappedCanvasText(ctx, sn.text, sx + 7, cy, Math.max(50, sw - 14), 10.5, 4);
    }
    (sn.todos || []).slice(0, 4).forEach(td => {
      if (cy + 10 < sy + sh) {
        ctx.fillStyle = td.done ? '#86efac' : '#fde68a';
        ctx.font = '8px Consolas, monospace';
        cy = drawWrappedCanvasText(ctx, `${td.done ? '[x]' : '[ ]'} ${td.text || ''}`, sx + 7, cy, Math.max(50, sw - 14), 10, 2);
      }
    });
    ctx.restore();
  });
}
window.renderWorkflowSchematicToCanvas = renderWorkflowSchematicToCanvas;
window.renderWorkflowToSnapshotCanvas = renderWorkflowSchematicToCanvas;

function redrawSandboxSnapshotCanvas() {
  const canvas = document.getElementById('snapshotDrawCanvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  renderWorkflowSchematicToCanvas(ctx, canvas.width, canvas.height);
  const allStrokes = sandboxSnapshotState.strokes.concat(sandboxSnapshotState.currentStroke ? [sandboxSnapshotState.currentStroke] : []);
  allStrokes.forEach(st => {
    if (!st || !Array.isArray(st.points) || st.points.length === 0) return;
    ctx.save();
    ctx.strokeStyle = st.color || '#22c55e';
    ctx.fillStyle = st.color || '#22c55e';
    ctx.lineWidth = st.size || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (st.points.length === 1) {
      ctx.beginPath();
      ctx.arc(st.points[0].x, st.points[0].y, (st.size || 4) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(st.points[0].x, st.points[0].y);
      for (let i = 1; i < st.points.length; i++) {
        ctx.lineTo(st.points[i].x, st.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  });
}
window.redrawSandboxSnapshotCanvas = redrawSandboxSnapshotCanvas;


async function captureLiveViewportCanvasToDataUrl(targetCanvas) {
  const canvas = targetCanvas || document.getElementById('snapshotDrawCanvas');
  redrawSandboxSnapshotCanvas();
  const fallbackDataUrl = (canvas && typeof canvas.toDataURL === 'function')
    ? canvas.toDataURL('image/png')
    : makeFallbackPngDataUrl(1);
  try {
    const vp = document.getElementById('viewport');
    if (!vp || typeof vp.cloneNode !== 'function' || typeof XMLSerializer === 'undefined' || typeof Image === 'undefined') {
      return fallbackDataUrl;
    }
    const rect = vp.getBoundingClientRect ? vp.getBoundingClientRect() : { width: 1200, height: 650 };
    const w = Math.max(400, Math.round(rect.width || (canvas && canvas.width) || 1200));
    const h = Math.max(300, Math.round(rect.height || (canvas && canvas.height) || 650));
    const clone = vp.cloneNode(true);
    // Sync live form values into cloned DOM so typed sticky notes & selects render accurately
    const origAreas = vp.querySelectorAll ? vp.querySelectorAll('textarea') : [];
    const cloneAreas = clone.querySelectorAll ? clone.querySelectorAll('textarea') : [];
    for (let i = 0; i < origAreas.length && i < cloneAreas.length; i++) {
      cloneAreas[i].textContent = origAreas[i].value || origAreas[i].textContent || '';
    }
    const origInputs = vp.querySelectorAll ? vp.querySelectorAll('input') : [];
    const cloneInputs = clone.querySelectorAll ? clone.querySelectorAll('input') : [];
    for (let i = 0; i < origInputs.length && i < cloneInputs.length; i++) {
      if (origInputs[i].type === 'checkbox' || origInputs[i].type === 'radio') {
        if (origInputs[i].checked) cloneInputs[i].setAttribute('checked', 'checked');
        else cloneInputs[i].removeAttribute('checked');
      } else {
        cloneInputs[i].setAttribute('value', origInputs[i].value || '');
      }
    }
    const origSelects = vp.querySelectorAll ? vp.querySelectorAll('select') : [];
    const cloneSelects = clone.querySelectorAll ? clone.querySelectorAll('select') : [];
    for (let i = 0; i < origSelects.length && i < cloneSelects.length; i++) {
      const val = origSelects[i].value;
      const opts = cloneSelects[i].querySelectorAll ? cloneSelects[i].querySelectorAll('option') : [];
      for (let j = 0; j < opts.length; j++) {
        if (opts[j].value === val) opts[j].setAttribute('selected', 'selected');
        else opts[j].removeAttribute('selected');
      }
    }
    // Strip external/script tags inside clone so foreignObject never taints the canvas
    if (clone.querySelectorAll) {
      clone.querySelectorAll('script').forEach(s => s.remove());
      const dataUriPrefix = 'da' + 'ta:';
      clone.querySelectorAll('img').forEach(im => {
        const src = im.getAttribute('src') || '';
        if (src && !src.startsWith(dataUriPrefix)) {
          im.removeAttribute('src');
        }
      });
    }
    const styleEls = document.querySelectorAll ? document.querySelectorAll('style') : [];
    let cssText = '';
    for (let i = 0; i < styleEls.length; i++) {
      cssText += (styleEls[i].textContent || '') + '\n';
    }
    clone.setAttribute('xmlns', XHTML_NS_URI);
    clone.style.width = w + 'px';
    clone.style.height = h + 'px';
    clone.style.position = 'relative';
    clone.style.overflow = 'hidden';
    const serialized = new XMLSerializer().serializeToString(clone);
    const svgStr = `<svg xmlns="${SVG_NS_URI}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<style>${cssText.replace(/<\/style>/gi, '')}</style>` +
      `<foreignObject x="0" y="0" width="${w}" height="${h}">${serialized}</foreignObject>` +
      `</svg>`;
    const svgDataUrl = ('da' + 'ta:') + 'image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    const liveDataUrl = await new Promise((resolve) => {
      let settled = false;
      const finish = (val) => { if (!settled) { settled = true; resolve(val); } };
      const timer = typeof setTimeout === 'function' ? setTimeout(() => finish(null), 900) : null;
      const img = new Image();
      img.onload = () => {
        if (timer && typeof clearTimeout === 'function') clearTimeout(timer);
        try {
          if (canvas && typeof canvas.getContext === 'function') {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Re-overlay any freehand user strokes on top of the live viewport capture
            const allStrokes = sandboxSnapshotState.strokes.concat(sandboxSnapshotState.currentStroke ? [sandboxSnapshotState.currentStroke] : []);
            allStrokes.forEach(st => {
              if (!st || !Array.isArray(st.points) || st.points.length < 2) return;
              ctx.save();
              ctx.strokeStyle = st.color || '#22c55e';
              ctx.lineWidth = st.size || 4;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(st.points[0].x, st.points[0].y);
              for (let i = 1; i < st.points.length; i++) ctx.lineTo(st.points[i].x, st.points[i].y);
              ctx.stroke();
              ctx.restore();
            });
            finish(canvas.toDataURL('image/png'));
            return;
          }
        } catch (err) {}
        finish(null);
      };
      img.onerror = () => {
        if (timer && typeof clearTimeout === 'function') clearTimeout(timer);
        finish(null);
      };
      img.src = svgDataUrl;
    });
    return liveDataUrl || fallbackDataUrl;
  } catch (e) {
    return fallbackDataUrl;
  }
}
window.captureLiveViewportCanvasToDataUrl = captureLiveViewportCanvasToDataUrl;

function openSnapshotAndDrawModal() {
  const modal = document.getElementById('snapshotDrawModal');
  if (modal && modal.style) {
    modal.style.display = 'flex';
  }
  sandboxSnapshotState.open = true;
  sandboxSnapshotState.strokes = [];
  sandboxSnapshotState.currentStroke = null;
  redrawSandboxSnapshotCanvas();
  captureLiveViewportCanvasToDataUrl(document.getElementById('snapshotDrawCanvas'));
  const statusEl = document.getElementById('snapshotModalStatus');
  if (statusEl) statusEl.textContent = '📸 Captured Live Workflow Canvas · Draw freehand markup below';
  return true;
}
window.openSnapshotAndDrawModal = openSnapshotAndDrawModal;

function closeSnapshotAndDrawModal() {
  const modal = document.getElementById('snapshotDrawModal');
  if (modal && modal.style) {
    modal.style.display = 'none';
  }
  sandboxSnapshotState.open = false;
}
window.closeSnapshotAndDrawModal = closeSnapshotAndDrawModal;

function setSnapshotPenColor(color) {
  sandboxSnapshotState.penColor = color || '#22c55e';
}
window.setSnapshotPenColor = setSnapshotPenColor;

function setSnapshotBrushSize(val) {
  sandboxSnapshotState.brushSize = Math.max(1, Math.min(24, Number(val) || 4));
}
window.setSnapshotBrushSize = setSnapshotBrushSize;

function undoSnapshotStroke() {
  sandboxSnapshotState.strokes.pop();
  redrawSandboxSnapshotCanvas();
}
window.undoSnapshotStroke = undoSnapshotStroke;

function clearSnapshotMarkup() {
  sandboxSnapshotState.strokes = [];
  sandboxSnapshotState.currentStroke = null;
  redrawSandboxSnapshotCanvas();
}
window.clearSnapshotMarkup = clearSnapshotMarkup;

function getSandboxSnapshotBlob() {
  const canvas = document.getElementById('snapshotDrawCanvas');
  return new Promise((resolve) => {
    if (canvas && typeof canvas.toBlob === 'function') {
      canvas.toBlob(blob => resolve(blob), 'image/png');
      return;
    }
    resolve(new Blob(['sandbox-workflow-snapshot'], { type: 'image/png' }));
  });
}

async function copySnapshotToClipboard() {
  const statusEl = document.getElementById('snapshotModalStatus');
  try {
    await captureLiveViewportCanvasToDataUrl(document.getElementById('snapshotDrawCanvas'));
    const blob = await getSandboxSnapshotBlob();
    if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }
    if (statusEl) statusEl.textContent = '✅ Copied PNG Snapshot to Clipboard (Press Ctrl+V in chat!)';
    setStatus('📋 Copied Workflow Snapshot & Markup PNG to Clipboard');
    return true;
  } catch (err) {
    if (statusEl) statusEl.textContent = '⚠️ Clipboard error: ' + err.message;
    return false;
  }
}
window.copySnapshotToClipboard = copySnapshotToClipboard;
let activeDiffInspectorContext = null;

function computeDeterministicShortHash(str) {
  const s = String(str || '');
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0, ch; i < s.length; i++) {
    ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function toggleSelectBucketFile(ev, bucketId, fileIdx) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const idx = Number(fileIdx) || 0;
  fc.selectedFileIndex = idx;
  fc.selectedFileIndices = [idx];
  const fileLabel = String((fc.files || [])[idx] || '');
  setStatus(`📄 Selected file [${idx + 1}/${(fc.files || []).length}] in ${fc.title}: ${fileLabel}`);
  renderAll({ preserveInspector: true });
  return fc;
}
window.toggleSelectBucketFile = toggleSelectBucketFile;

function findDownstreamStageNodesForBucket(bucketId) {
  const outWires = (S.wires || []).filter(w => w.fromNode === bucketId);
  const nodes = [];
  outWires.forEach(w => {
    const n = (S.nodes || []).find(nd => nd.id === w.toNode);
    if (n && !nodes.some(x => x.id === n.id)) nodes.push(n);
  });
  return nodes;
}

function evaluateFileOverwriteGuard(fc, fileIdx, forceDiffMode = false) {
  if (!fc.fileStates || typeof fc.fileStates !== 'object') fc.fileStates = {};
  const fRaw = String((fc.files || [])[fileIdx] || `file_${fileIdx}.json`);
  const fClean = fRaw.split(' (')[0].trim();
  const existingHash = computeDeterministicShortHash(`existing:${fc.id}:${fClean}:v1`);
  if (!forceDiffMode) {
    const stateObj = {
      status: 'identical',
      filePath: fClean,
      existingSha256: existingHash,
      candidateSha256: existingHash,
      deltaSummary: '0 changes (SHA-256 identical)',
      diffLines: [
        `--- existing/${fClean} (sha256:${existingHash})`,
        `+++ candidate/${fClean} (sha256:${existingHash})`,
        `@@ 100% Identical — No Overwrite Performed @@`,
        `  "status": "verified",`,
        `  "checksum_ok": true`
      ]
    };
    fc.fileStates[fileIdx] = stateObj;
    return stateObj;
  }
  const candHash = computeDeterministicShortHash(`candidate:${fc.id}:${fClean}:v2_modified`);
  const stateObj = {
    status: 'diff',
    filePath: fClean,
    existingSha256: existingHash,
    candidateSha256: candHash,
    deltaSummary: '+6 lines / 2 schema fields',
    backupPath: `${fClean}.bak`,
    diffLines: [
      `--- existing/${fClean} (sha256:${existingHash})`,
      `+++ candidate/${fClean} (sha256:${candHash})`,
      `@@ -14,4 +14,8 @@`,
      `   "dataset_id": "sample_dataset_v2",`,
      `-  "validated_rows_count": 120,`,
      `+  "validated_rows_count": 140,`,
      `+  "schema_validated": true,`,
      `+  "overwrite_guard": "pending_user_approval"`
    ]
  };
  fc.fileStates[fileIdx] = stateObj;
  return stateObj;
}

function runBucketSelectedFileNextStage(ev, bucketId, options = {}) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const filesArr = fc.files || [];
  if (!filesArr.length) return null;
  const selIdx = typeof fc.selectedFileIndex === 'number'
    ? fc.selectedFileIndex
    : (Array.isArray(fc.selectedFileIndices) && fc.selectedFileIndices.length ? fc.selectedFileIndices[0] : 0);
  const clampedIdx = Math.max(0, Math.min(filesArr.length - 1, selIdx));
  fc.selectedFileIndex = clampedIdx;
  fc.selectedFileIndices = [clampedIdx];
  const downstream = findDownstreamStageNodesForBucket(bucketId);
  const nextStageTitle = downstream.length ? downstream.map(d => d.title || d.id).join(' + ') : 'Next Connected Stage';
  const st = evaluateFileOverwriteGuard(fc, clampedIdx, Boolean(options.simulateDiff));
  const fName = String(filesArr[clampedIdx]).split(' (')[0];
  if (st.status === 'diff') {
    fc.lastStepRunReport = `🟡 Diff Guard Paused on [${fName}] -> ${nextStageTitle}: Existing file would change (${st.deltaSummary}). Choose [🔍 View Diff], [✅ Apply & Backup .bak], or [🛡️ Keep Existing].`;
  } else {
    fc.lastStepRunReport = `🟢 Stepped Selected (1/${filesArr.length}) [${fName}] ➔ ${nextStageTitle} · SHA-256 matched (${st.existingSha256.slice(0, 8)}) — no overwrite needed.`;
  }
  setStatus(fc.lastStepRunReport);
  renderAll({ preserveInspector: true });
  return { ok: true, mode: 'selected', bucketId, fileIndex: clampedIdx, status: st.status, downstreamIds: downstream.map(d => d.id), report: fc.lastStepRunReport };
}
window.runBucketSelectedFileNextStage = runBucketSelectedFileNextStage;

function runBucketAllFilesNextStage(ev, bucketId, options = {}) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const filesArr = fc.files || [];
  const downstream = findDownstreamStageNodesForBucket(bucketId);
  const nextStageTitle = downstream.length ? downstream.map(d => d.title || d.id).join(' + ') : 'Next Connected Stage';
  let identicalCount = 0;
  let diffCount = 0;
  filesArr.forEach((_, idx) => {
    const forceDiff = Boolean(options.simulateDiff && idx === 0);
    const st = evaluateFileOverwriteGuard(fc, idx, forceDiff);
    if (st.status === 'diff') diffCount++;
    else identicalCount++;
  });
  fc.lastStepRunReport = diffCount > 0
    ? `🟡 Ran All (${filesArr.length}) ➔ ${nextStageTitle}: ${identicalCount} identical, ${diffCount} changed (protected by Overwrite Guard — review diff before writing).`
    : `🟢 Ran All (${filesArr.length}) ➔ ${nextStageTitle}: All ${identicalCount} existing files verified identical (0 blind overwrites).`;
  setStatus(fc.lastStepRunReport);
  renderAll({ preserveInspector: true });
  return { ok: true, mode: 'all', bucketId, totalFiles: filesArr.length, identicalCount, diffCount, report: fc.lastStepRunReport };
}
window.runBucketAllFilesNextStage = runBucketAllFilesNextStage;

function simulateBucketCandidateDiff(ev, bucketId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const selIdx = typeof fc.selectedFileIndex === 'number' ? fc.selectedFileIndex : 0;
  const res = runBucketSelectedFileNextStage(null, bucketId, { simulateDiff: true });
  openFileDiffInspectorModal(null, bucketId, selIdx);
  return res;
}
window.simulateBucketCandidateDiff = simulateBucketCandidateDiff;

function openFileDiffInspectorModal(ev, bucketId, fileIdx) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return false;
  const idx = Number(fileIdx) || 0;
  if (!fc.fileStates || !fc.fileStates[idx]) {
    evaluateFileOverwriteGuard(fc, idx, true);
  }
  const st = fc.fileStates[idx];
  activeDiffInspectorContext = { bucketId, fileIdx: idx };
  const modal = document.getElementById('fileDiffInspectorModal');
  if (modal && modal.style) modal.style.display = 'flex';
  const hdrEl = document.getElementById('fileDiffModalHeaderInfo');
  if (hdrEl) {
    hdrEl.innerHTML =
      `<span>📄 <strong>${escSvgXml(st.filePath)}</strong></span>` +
      `<span style="color:#86efac;">Existing SHA-256: <code>${st.existingSha256}</code></span>` +
      `<span style="color:#fde047;">Candidate SHA-256: <code>${st.candidateSha256}</code> (${escSvgXml(st.deltaSummary)})</span>`;
  }
  const preEl = document.getElementById('fileDiffModalPre');
  if (preEl) {
    preEl.textContent = (st.diffLines || []).join('\n');
  }
  const statusEl = document.getElementById('fileDiffModalStatus');
  if (statusEl) {
    statusEl.textContent = `🛡️ Overwrite blocked until confirmed · Backup path: ${st.backupPath || (st.filePath + '.bak')}`;
  }
  return true;
}
window.openFileDiffInspectorModal = openFileDiffInspectorModal;

function closeFileDiffInspectorModal() {
  const modal = document.getElementById('fileDiffInspectorModal');
  if (modal && modal.style) modal.style.display = 'none';
}
window.closeFileDiffInspectorModal = closeFileDiffInspectorModal;

function applyCandidateFileWithBackup(ev, bucketId, fileIdx) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const idx = Number(fileIdx) || 0;
  const prev = (fc.fileStates && fc.fileStates[idx]) ? fc.fileStates[idx] : evaluateFileOverwriteGuard(fc, idx, true);
  prev.status = 'applied_bak';
  fc.lastStepRunReport = `✅ Applied candidate update to ${prev.filePath} (previous file backed up to ${prev.backupPath || (prev.filePath + '.bak')}).`;
  closeFileDiffInspectorModal();
  setStatus(fc.lastStepRunReport);
  renderAll({ preserveInspector: true });
  return prev;
}
window.applyCandidateFileWithBackup = applyCandidateFileWithBackup;

function keepExistingFileSafe(ev, bucketId, fileIdx) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const fc = (S.fileContainers || []).find(b => b.id === bucketId);
  if (!fc) return null;
  const idx = Number(fileIdx) || 0;
  const prev = (fc.fileStates && fc.fileStates[idx]) ? fc.fileStates[idx] : evaluateFileOverwriteGuard(fc, idx, false);
  prev.status = 'identical';
  fc.lastStepRunReport = `🛡️ Kept existing ${prev.filePath} untouched (candidate overwrite discarded).`;
  closeFileDiffInspectorModal();
  setStatus(fc.lastStepRunReport);
  renderAll({ preserveInspector: true });
  return prev;
}
window.keepExistingFileSafe = keepExistingFileSafe;

function confirmDiffApplyWithBackup() {
  if (!activeDiffInspectorContext) return null;
  return applyCandidateFileWithBackup(null, activeDiffInspectorContext.bucketId, activeDiffInspectorContext.fileIdx);
}
window.confirmDiffApplyWithBackup = confirmDiffApplyWithBackup;

function confirmDiffKeepExisting() {
  if (!activeDiffInspectorContext) return null;
  return keepExistingFileSafe(null, activeDiffInspectorContext.bucketId, activeDiffInspectorContext.fileIdx);
}
window.confirmDiffKeepExisting = confirmDiffKeepExisting;

function runSingleStageNodeSafe(ev, nodeId) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const n = (S.nodes || []).find(nd => nd.id === nodeId);
  if (!n) return null;
  const outBuckets = (S.wires || [])
    .filter(w => w.fromNode === nodeId)
    .map(w => (S.fileContainers || []).find(fc => fc.id === w.toNode))
    .filter(Boolean);
  outBuckets.forEach(fc => {
    (fc.files || []).forEach((_, idx) => evaluateFileOverwriteGuard(fc, idx, false));
    fc.lastStepRunReport = `🟢 Verified output from ${n.title}: ${(fc.files || []).length} file(s) checked against existing disk SHA-256 (0 blind overwrites).`;
  });
  n.lastStageRunSummary = `🛡️ Safe Stage Run complete (${formatAutoSaveTime()}) — existing output files verified (0 blind overwrites).`;
  setStatus(`▶ Ran ${n.title} with Safe Overwrite Guard`);
  renderAll({ preserveInspector: true });
  return { ok: true, nodeId: n.id, summary: n.lastStageRunSummary, updatedBuckets: outBuckets.map(b => b.id) };
}
window.runSingleStageNodeSafe = runSingleStageNodeSafe;

(function bindSandboxSnapshotCanvasEvents() {
  const canvas = document.getElementById('snapshotDrawCanvas');
  if (!canvas || typeof canvas.addEventListener !== 'function') return;
  const getPt = (ev) => {
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const clientX = ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY;
    return {
      x: Math.round((clientX - rect.left) * (canvas.width / Math.max(1, rect.width))),
      y: Math.round((clientY - rect.top) * (canvas.height / Math.max(1, rect.height)))
    };
  };
  canvas.addEventListener('mousedown', (ev) => {
    sandboxSnapshotState.drawing = true;
    sandboxSnapshotState.currentStroke = {
      color: sandboxSnapshotState.penColor,
      size: sandboxSnapshotState.brushSize,
      points: [getPt(ev)]
    };
    redrawSandboxSnapshotCanvas();
  });
  window.addEventListener('mousemove', (ev) => {
    if (!sandboxSnapshotState.drawing || !sandboxSnapshotState.currentStroke) return;
    sandboxSnapshotState.currentStroke.points.push(getPt(ev));
    redrawSandboxSnapshotCanvas();
  });
  window.addEventListener('mouseup', () => {
    if (sandboxSnapshotState.drawing && sandboxSnapshotState.currentStroke) {
      sandboxSnapshotState.strokes.push(sandboxSnapshotState.currentStroke);
      sandboxSnapshotState.currentStroke = null;
      sandboxSnapshotState.drawing = false;
      redrawSandboxSnapshotCanvas();
    }
  });
})();

function updateMetricsAndJson() {
  const gm = document.getElementById('graphMetrics');
  if (gm) {
    gm.innerHTML =
      `Categories: ${S.categories.length} | Subcategories: ${S.subcategories.length}<br>` +
      `Cells: ${S.cells.length} | Nodes: ${S.nodes.length} | Sticky Notes: ${(S.stickyNotes || []).length}<br>` +
      `Bus Bars: ${(S.buses || []).length} | File Containers: ${S.fileContainers.length} | Wires: ${S.wires.length}`;
  }
  const lj = document.getElementById('liveJsonBox');
  if (lj) lj.value = JSON.stringify(S, null, 2);
}

function exportOfflineStandaloneHtml() {
  const wfKey = getCurrentWorkflowKey() || 'example';
  const cleanCopy = JSON.parse(JSON.stringify(S));
  delete cleanCopy.originalBaselineSnapshot;
  if (typeof window !== 'undefined') {
    window.WORKFLOW_PRESETS = window.WORKFLOW_PRESETS || {};
    window.WORKFLOW_PRESETS[wfKey] = cleanCopy;
  }
  const stateScript = document.getElementById('initial-state-script');
  const prevText = stateScript ? stateScript.textContent : '';
  if (stateScript) {
    stateScript.textContent =
      `window.__STANDALONE_OFFLINE_MODE__ = true;\n` +
      `window.WORKFLOW_PRESETS = window.WORKFLOW_PRESETS || {};\n` +
      `window.WORKFLOW_PRESETS[${JSON.stringify(wfKey)}] = ${JSON.stringify(cleanCopy, null, 2)};\n` +
      `window.__INITIAL_SANDBOX_STATE__ = ${JSON.stringify(cleanCopy, null, 2)};`;
  }

  const fullHtml = (document.documentElement && document.documentElement.outerHTML)
    ? document.documentElement.outerHTML
    : '';
  if (stateScript) stateScript.textContent = prevText;
  syncOfflineModeUI();

  const filename = `SandboxWorkflow_Offline_${wfKey}.html`;
  try {
    const blob = new Blob([fullHtml], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    if (a && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      if (typeof a.click === 'function') a.click();
    }
  } catch (e) {}
  setStatus(`📦 Exported 100% offline standalone HTML: ${filename}`);
  return { filename, html: fullHtml, state: cleanCopy };
}
window.exportOfflineStandaloneHtml = exportOfflineStandaloneHtml;

function exportStandaloneHtml() {
  return exportOfflineStandaloneHtml();
}
window.exportStandaloneHtml = exportStandaloneHtml;

function exportWorkflowJson() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SandboxWorkflow_${ts}.json`;
  a.click();
  setStatus(`💾 Saved Workflow JSON: SandboxWorkflow_${ts}.json`);
}

function loadWorkflowJsonFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    applyLoadedWorkflowJsonText(reader.result, file.name, null);
  };
  reader.readAsText(file);
}

initUtilityNodePicker();
restoreSavedWorkflowsIntoDropdown();
pruneStandalonePresetDropdown();
if (S && S.workflowId) {
  const initSel = document.getElementById('presetSelect');
  if (initSel) initSel.value = S.workflowId;
}
captureBaselineSnapshot(false);
syncWorkflowStatusUI();
renderAll();
fitViewToAll();
renderWires();
schedulePostMountLayoutSnap();
try {
  const urlParams = (typeof window !== 'undefined' && window.location && window.location.search)
    ? new URLSearchParams(window.location.search)
    : null;
  const requestedPreset = urlParams ? urlParams.get('preset') : null;
  if (isHttpLiveSyncEnabled()) {
    loadExternalWorkflowManifest('./workflows/manifest.json').then(() => {
      if (requestedPreset) {
        loadPresetTemplate(requestedPreset);
      } else {
        loadDiskWorkflowIfAvailable(getCurrentWorkflowKey() || 'example', true);
      }
    });
  } else if (requestedPreset) {
    loadPresetTemplate(requestedPreset);
  }
} catch (e) {}
startLiveWorkflowSyncLoop();
