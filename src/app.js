import { DSP } from './dsp.js';
import { NODE_DEFS, state } from './nodes.js';
import { I18N } from './i18n.js';

class App {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.sampleRate = 1000;
    this.probeData = new Map();
    this.chartVisibility = new Map();
    this.nodeCache = new Map(); // nodeId -> { portId -> data[] }

    this.canvasPanel = document.getElementById('canvasPanel');
    this.gridCanvas = document.getElementById('gridCanvas');
    this.gridCtx = this.gridCanvas.getContext('2d');
    this.svg = document.getElementById('connectionsSvg');
    this.viewport = document.getElementById('viewport');
    this.canvasFocusCrosshair = document.getElementById('canvasFocusCrosshair');
    this.chartScroll = document.getElementById('chartScroll');
    this.chartScrollbar = document.getElementById('chartScrollbar');
    this.chartScrollbarThumb = document.getElementById('chartScrollbarThumb');
    this.runProgress = document.getElementById('runProgress');
    this.runProgressFill = document.getElementById('runProgressFill');
    this.runProgressLabel = document.getElementById('runProgressLabel');

    this.draggingNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.connecting = null;
    this.selectedNode = null;
    this.selectedNodes = new Set();
    this.copiedNode = null;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.panning = false;
    this.panStart = { x: 0, y: 0 };
    this.panOffset = { x: 0, y: 0 };
    this.canvasZoom = 1;
    this._isRunning = false;
    this.sidebarDragType = null;
    this.lastCanvasMousePoint = null;
    this.marquee = null;
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'selection-box';
    this.canvasPanel.appendChild(this.selectionBox);

    this.initDivider();
    this.initChartScrollbar();
    this.initEvents();
    this.initSidebarDrag();
    this.resize();
    this.drawGrid();

    window.addEventListener('resize', () => { this.resize(); this.updateChartScrollbar(); });
  }

  // ---- Undo/Redo ----
  saveBlueprint() {
    const blueprint = {
      nodes: this.nodes.map(n => ({
        id: n.id, type: n.type, x: n.x, y: n.y,
        params: { ...n.params },
        data: n._data ? [...n._data] : null
      })),
      connections: this.connections.map(c => ({ ...c }))
    };
    return JSON.stringify(blueprint);
  }

  pushUndo() {
    const state = this.saveBlueprint();
    // Don't push if nothing changed
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) return;
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack = [];
  }

  restoreBlueprint(json) {
    const bp = JSON.parse(json);
    // Clear current nodes
    for (const n of this.nodes) { if (n.el) n.el.remove(); }
    this.nodes = [];
    this.connections = [];
    this.nodeCache.clear();
    this.probeData.clear();
    this.selectedNodes.clear();
    this.selectedNode = null;

    // Restore nodes
    for (const nd of bp.nodes) {
      const def = NODE_DEFS[nd.type];
      if (!def) continue;
      const node = { id: nd.id, type: nd.type, def, x: nd.x, y: nd.y, params: {}, _data: null, _label: nd.label || null, el: null };
      def.params.forEach(p => { node.params[p.id] = nd.params[p.id] !== undefined ? this.cloneParamValue(nd.params[p.id]) : this.cloneParamValue(p.default); });
      this.applyLegacyParamMigration(node, nd.params);
      if (nd.data) node._data = nd.data;
      if (nd.id >= state.nodeIdCounter) state.nodeIdCounter = nd.id + 1;
      this.nodes.push(node);
      this.renderNode(node);
      if (nd.data && nd.type === 'input') {
        const lbl = document.getElementById(`fileLabel-${node.id}`);
        if (lbl) lbl.textContent = `已加载 ${nd.data.length} 点`;
      }
    }

    // Restore connections
    this.connections = bp.connections || [];
    for (const node of this.nodes) this.updatePortPositions(node);
    this.renderConnections();
    this.updateEmptyHint();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const current = this.saveBlueprint();
    this.redoStack.push(current);
    const state = this.undoStack.pop();
    this.restoreBlueprint(state);
    this.scheduleSave();
    this.toast('撤销', 'info');
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const current = this.saveBlueprint();
    this.undoStack.push(current);
    const state = this.redoStack.pop();
    this.restoreBlueprint(state);
    this.scheduleSave();
    this.toast('重做', 'info');
  }

  // ---- Toast ----
  randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
  }

  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ---- Auto Run ----
  toggleAutoRun() {
    if (this._autoRunning) { this.stopAutoRun(); return; }
    const btn = document.getElementById('autoRunBtn');
    const bar = document.getElementById('autoBarFill');
    const sec = Math.max(0.1, parseFloat(document.getElementById('autoInterval').value) || 2);
    const ms = sec * 1000;
    this._autoRunning = true;
    btn.classList.add('active');
    btn.textContent = '⏸';
    bar.style.transition = `width ${sec}s linear`;

    const tick = () => {
      bar.style.transition = 'none';
      bar.style.width = '0%';
      bar.offsetHeight; // force reflow
      bar.style.transition = `width ${sec}s linear`;
      bar.style.width = '100%';
    };
    tick();
    this.run();
    this._autoRunTimer = setInterval(() => { tick(); this.run(); }, ms);
  }

  stopAutoRun() {
    this._autoRunning = false;
    clearInterval(this._autoRunTimer);
    this._autoRunTimer = null;
    const btn = document.getElementById('autoRunBtn');
    const bar = document.getElementById('autoBarFill');
    btn.classList.remove('active');
    btn.textContent = '⏱';
    bar.style.transition = 'none';
    bar.style.width = '0%';
  }

  // ---- Resize / Grid ----
  getGridDpr() {
    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  resize() {
    const rect = this.canvasPanel.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = this.getGridDpr();
    this.gridCanvas.width = w * dpr;
    this.gridCanvas.height = h * dpr;
    this.gridCanvas.style.width = w + 'px';
    this.gridCanvas.style.height = h + 'px';
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);
    this.svg.style.width = w + 'px';
    this.svg.style.height = h + 'px';
    this.drawGrid();
    this.updateSvgViewBox();
  }

  drawGrid() {
    const ctx = this.gridCtx;
    const dpr = this.getGridDpr();
    const w = this.gridCanvas.width, h = this.gridCanvas.height;
    const cssW = w / dpr, cssH = h / dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#1b2838';
    ctx.lineWidth = 1;
    const step = 30;
    const screenStep = step * this.canvasZoom;
    if (screenStep < 4) return;
    const offX = ((this.panOffset.x % screenStep) + screenStep) % screenStep;
    const offY = ((this.panOffset.y % screenStep) + screenStep) % screenStep;
    for (let x = offX; x < cssW; x += screenStep) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke(); }
    for (let y = offY; y < cssH; y += screenStep) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---- Divider drag ----
  initDivider() {
    const divider = document.getElementById('divider');
    divider.addEventListener('mousedown', (e) => {
      e.preventDefault();
      divider.classList.add('dragging');
      const startX = e.clientX;
      const cp = this.canvasPanel, tp = document.getElementById('chartPanel');
      const appEl = document.querySelector('.app');
      const totalW = appEl.getBoundingClientRect().width;
      const divW = divider.getBoundingClientRect().width;
      const usable = totalW - divW;
      const startL = cp.getBoundingClientRect().width;
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        let newL = startL + dx;
        if (newL < 250) newL = 250;
        if (newL > usable - 250) newL = usable - 250;
        const pct = (newL / usable) * 100;
        cp.style.flex = `0 0 ${pct}%`;
        tp.style.flex = `1 1 0%`;
        this.resize();
        this.renderConnections();
      };
      const onUp = () => {
        divider.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.scheduleSave();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ---- Events ----
  initEvents() {
    // Mouse wheel zoom on canvas - zoom entire viewport
    this.canvasPanel.addEventListener('wheel', (e) => {
      if (e.target.closest('.sidebar') || e.target.closest('.chart-panel')) return;
      if (e.target.closest('.node-body textarea, .node-body input, .node-body select, .param-select, .cm-editor, .cm-wrap')) return;
      e.preventDefault();
      const rect = this.canvasPanel.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const oldZoom = this.canvasZoom;
      this.canvasZoom = Math.max(0.2, Math.min(5, this.canvasZoom * zoomFactor));
      // Adjust pan offset to zoom towards mouse
      this.panOffset.x = mouseX - (mouseX - this.panOffset.x) * (this.canvasZoom / oldZoom);
      this.panOffset.y = mouseY - (mouseY - this.panOffset.y) * (this.canvasZoom / oldZoom);
      this.applyViewportTransform();
      this.scheduleSave();
    }, { passive: false });

    // Middle mouse button panning - move viewport
    this.canvasPanel.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // middle button
        e.preventDefault();
        this.panning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.canvasPanel.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      this.updateLastCanvasMousePoint(e);
      if (this.panning) {
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.panOffset.x += dx;
        this.panOffset.y += dy;
        this.applyViewportTransform();
      }
      if (this.connecting) {
        const rect = this.canvasPanel.getBoundingClientRect();
        this.drawTempConnection(e.clientX - rect.left, e.clientY - rect.top);
      }
      if (this.marquee) {
        this.updateMarqueeSelection(e);
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.param-select')) this.closeParamSelects();
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 1 && this.panning) {
        this.panning = false;
        this.canvasPanel.style.cursor = '';
        this.scheduleSave();
      }
      if (this.connecting) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('port-in')) {
          this.finishConnection(parseInt(target.dataset.nodeId), target.dataset.portId);
        } else {
          this.cancelConnection();
        }
      }
      if (this.marquee) {
        this.finishMarqueeSelection(e);
      }
    });

    this.canvasPanel.addEventListener('dragover', (e) => {
      if (!this.sidebarDragType) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this.canvasPanel.addEventListener('drop', (e) => {
      const type = this.sidebarDragType || e.dataTransfer.getData('application/x-node-type');
      if (!type || !NODE_DEFS[type]) return;
      e.preventDefault();
      const rect = this.canvasPanel.getBoundingClientRect();
      const point = this.panelToWorldPoint(e.clientX - rect.left, e.clientY - rect.top);
      this.lastCanvasMousePoint = point;
      const node = this.addNode(type, point.x, point.y);
      if (node) this.selectNode(node.id);
      this.sidebarDragType = null;
    });

    // Capture-phase handler: global shortcuts that override browser defaults
    window.addEventListener('keydown', function(e) {
      // F5 to run
      if (e.key === 'F5' || e.code === 'F5') {
        e.preventDefault();
        e.stopPropagation();
        app.run();
        return;
      }
      // Ctrl+S export project
      if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        app.exportProject();
        return;
      }
      // Escape deselect all / cancel running
      if (e.code === 'Escape') {
        e.preventDefault();
        if (app._isRunning && app._cancelToken) { app._cancelToken.abort(); return; }
        app.selectNodes([]);
        return;
      }
      // Ctrl+A select all nodes (only when not editing text)
      if (e.code === 'KeyA' && (e.ctrlKey || e.metaKey)) {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.closest('.cm-editor'))) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        app.selectNodes(app.nodes.map(function(n) { return n.id; }));
        return;
      }
    }, true); // capture phase — fires before the target input sees the event

    document.addEventListener('keydown', (e) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      // Delete selected node
      if (e.key === 'Delete' && this.selectedNodes.size > 0 && !inInput) {
        this.removeSelectedNodes();
      }
      // Space to reset view
      if (e.key === ' ' && !inInput) {
        e.preventDefault();
        this.resetView();
      }
      // Ctrl+Z undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !inInput) {
        e.preventDefault();
        this.undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !inInput) {
        e.preventDefault();
        this.redo();
      }
      // Ctrl+C copy node
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.selectedNodes.size > 0 && !inInput) {
        e.preventDefault();
        this.copySelectedNodes();
      }
      // Ctrl+V paste node
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && this.copiedNode && !inInput) {
        e.preventDefault();
        const pastePoint = this.lastCanvasMousePoint;
        this.pasteCopiedNodes(pastePoint);
      }
    });

    this.canvasPanel.addEventListener('mousedown', (e) => {
      if (e.button === 0 && (e.target === this.canvasPanel || e.target === this.viewport || e.target === this.gridCanvas || e.target === this.svg)) {
        this.blurActiveField();
        this.startMarqueeSelection(e);
      }
    });

    // Prevent context menu on middle click
    this.canvasPanel.addEventListener('contextmenu', (e) => {
      // allow right-click context menu
    });
  }

  initSidebarDrag() {
    document.querySelectorAll('.sidebar-item[onclick^="app.addNode"]').forEach(item => {
      const match = item.getAttribute('onclick').match(/app\.addNode\('([^']+)'\)/);
      if (!match) return;
      const type = match[1];
      item.draggable = true;
      item.dataset.nodeType = type;
      item.onclick = null;
      item.removeAttribute('onclick');
      item.addEventListener('dragstart', (e) => {
        this.sidebarDragType = type;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/x-node-type', type);
        e.dataTransfer.setData('text/plain', NODE_DEFS[type]?.title || type);
      });
      item.addEventListener('dragend', () => {
        this.sidebarDragType = null;
      });
    });
  }

  // ---- Viewport Transform ----
  applyViewportTransform() {
    this.viewport.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.canvasZoom})`;
    this.viewport.style.transformOrigin = '0 0';
    this.drawGrid();
    this.updateSvgViewBox();
  }

  updateSvgViewBox() {
    const rect = this.canvasPanel.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const topLeft = this.panelToWorldPoint(0, 0);
    const bottomRight = this.panelToWorldPoint(w, h);
    const vbX = topLeft.x;
    const vbY = topLeft.y;
    const vbW = bottomRight.x - topLeft.x;
    const vbH = bottomRight.y - topLeft.y;
    this.svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);
    this.svg.style.width = w + 'px';
    this.svg.style.height = h + 'px';
  }

  panelToWorldPoint(x, y) {
    return {
      x: (x - this.panOffset.x) / this.canvasZoom,
      y: (y - this.panOffset.y) / this.canvasZoom
    };
  }

  updateLastCanvasMousePoint(e) {
    const rect = this.canvasPanel.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    this.lastCanvasMousePoint = this.panelToWorldPoint(e.clientX - rect.left, e.clientY - rect.top);
  }

  blurActiveField() {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) active.blur();
  }

  // ---- Node Management ----
  addNode(type, x, y) {
    const def = NODE_DEFS[type];
    if (!def) return;
    this.pushUndo();
    const id = this.getNextNodeId();
    if (x === undefined) x = 60 + (this.nodes.length % 5) * 50;
    if (y === undefined) y = 80 + Math.floor(this.nodes.length / 5) * 40;
    const node = { id, type, def, x, y, params: {}, _data: null, _label: null, el: null };
    def.params.forEach(p => { node.params[p.id] = this.cloneParamValue(p.default); });
    this.nodes.push(node);
    this.renderNode(node);
    this.updateEmptyHint();
    this.scheduleSave();
    return node;
  }

  getNextNodeId() {
    const maxExistingId = this.nodes.reduce((max, node) => Math.max(max, node.id), 0);
    state.nodeIdCounter = Math.max(state.nodeIdCounter, maxExistingId) + 1;
    return state.nodeIdCounter;
  }

  cloneParamValue(value) {
    if (Array.isArray(value)) return [...value];
    if (value && typeof value === 'object') return { ...value };
    return value;
  }

  applyLegacyParamMigration(node, savedParams = {}) {
    if (node.type === 'normalizer' && savedParams.global === false && node.params.mode === '全部') node.params.mode = '窗口';
    if (node.type === 'probe' && savedParams.visible !== undefined && savedParams.enabled === undefined) node.params.enabled = savedParams.visible !== false;
    if (node.type === 'weighted' && savedParams.weight !== undefined && savedParams.alpha === undefined) node.params.alpha = 1 - savedParams.weight;
  }

  getMultiplexerPortCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.count || 1)));
  }

  getSplitterOutputCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.count || 2)));
  }

  getMultiplexerMode(node) {
    return node.params.mode === '一入多出' ? '一入多出' : '多入一出';
  }

  getSwitchPortCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.count || 1)));
  }

  getWeightedMixerInputCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.count || 2)));
  }

  getArgSelectorGroupCount(node) {
    return Math.max(2, Math.min(8, Math.floor(node.params.count || 2)));
  }

  getCustomInputCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.inputCount || 1)));
  }

  getCustomOutputCount(node) {
    return Math.max(1, Math.min(12, Math.floor(node.params.outputCount || 1)));
  }

  getCustomPortId(direction, index) {
    const base = direction === 'in' ? 'in' : 'out';
    return index === 0 ? base : `${base}${index + 1}`;
  }

  getCustomPortLabel(node, direction, portId, index) {
    const names = direction === 'in' ? node.params.inputNames : node.params.outputNames;
    const fallbackBase = direction === 'in' ? '输入' : '输出';
    const fallbackEn = direction === 'in' ? 'Input' : 'Output';
    const fallback = index === 0 ? fallbackBase : `${fallbackBase}${index + 1}`;
    const fallbackLabelEn = index === 0 ? fallbackEn : `${fallbackEn} ${index + 1}`;
    const value = names && typeof names === 'object' ? names[portId] : '';
    const hasCustom = value && String(value).trim();
    return {
      label: hasCustom ? String(value).trim() : fallback,
      labelEn: hasCustom ? null : fallbackLabelEn  // only translate fallback labels
    };
  }

  getCustomInputs(node) {
    const count = this.getCustomInputCount(node);
    return Array.from({ length: count }, (_, i) => {
      const id = this.getCustomPortId('in', i);
      const info = this.getCustomPortLabel(node, 'in', id, i);
      return { id, label: info.label, labelEn: info.labelEn };
    });
  }

  getCustomOutputs(node) {
    const count = this.getCustomOutputCount(node);
    return Array.from({ length: count }, (_, i) => {
      const id = this.getCustomPortId('out', i);
      const info = this.getCustomPortLabel(node, 'out', id, i);
      return { id, label: info.label, labelEn: info.labelEn };
    });
  }

  getNodeInputs(node) {
    if (node.type === 'custom') {
      return this.getCustomInputs(node);
    }
    if (node.type === 'switch') {
      const count = this.getSwitchPortCount(node);
      if (count === 1) return [{ id: 'in', label: '输入', labelEn: 'Input' }];
      return Array.from({ length: count }, (_, i) => ({ id: `in${i + 1}`, label: `输入${i + 1}`, labelEn: `Input ${i + 1}` }));
    }
    if (node.type === 'multiplexer') {
      const count = this.getMultiplexerPortCount(node);
      if (this.getMultiplexerMode(node) === '一入多出') return [{ id: 'in', label: '输入', labelEn: 'Input' }];
      return Array.from({ length: count }, (_, i) => ({ id: `in${i + 1}`, label: `输入${i + 1}`, labelEn: `Input ${i + 1}` }));
    }
    if (node.type === 'weightedmixer') {
      const count = this.getWeightedMixerInputCount(node);
      return Array.from({ length: count }, (_, i) => ({ id: `in${i + 1}`, label: `输入${i + 1}`, labelEn: `Input ${i + 1}` }));
    }
    if (node.type === 'argselector') {
      const count = this.getArgSelectorGroupCount(node);
      const ports = [];
      for (let i = 1; i <= count; i++) {
        ports.push({ id: `sig${i}`, label: `信号${i}`, labelEn: `Signal ${i}` });
        ports.push({ id: `cmp${i}`, label: `比较${i}`, labelEn: `Compare ${i}` });
      }
      return ports;
    }
    return node.def.inputs;
  }

  getNodeOutputs(node) {
    if (node.type === 'custom') {
      return this.getCustomOutputs(node);
    }
    if (node.type === 'splitter') {
      const count = this.getSplitterOutputCount(node);
      return Array.from({ length: count }, (_, i) => ({ id: `out${i + 1}`, label: `输出${i + 1}`, labelEn: `Output ${i + 1}` }));
    }
    if (node.type === 'switch') {
      const count = this.getSwitchPortCount(node);
      if (count === 1) return [{ id: 'out', label: '输出', labelEn: 'Output' }];
      return Array.from({ length: count }, (_, i) => ({ id: `out${i + 1}`, label: `输出${i + 1}`, labelEn: `Output ${i + 1}` }));
    }
    if (node.type === 'multiplexer') {
      const count = this.getMultiplexerPortCount(node);
      if (this.getMultiplexerMode(node) === '一入多出') return Array.from({ length: count }, (_, i) => ({ id: `out${i + 1}`, label: `输出${i + 1}`, labelEn: `Output ${i + 1}` }));
      return [{ id: 'out', label: '输出', labelEn: 'Output' }];
    }
    if (node.type === 'argselector') {
      return [{ id: 'out', label: '输出', labelEn: 'Output' }];
    }
    if (node.type === 'peakdetector') {
      const out = [
        { id: 'out', label: '峰值脉冲', labelEn: 'Peak Pulse' },
        { id: 'out2', label: '谷值脉冲', labelEn: 'Valley Pulse' }
      ];
      if (node.params.showBandIntervalSH !== false) {
        out.push({ id: 'out3', label: '峰峰间隔', labelEn: 'Peak-to-Peak' });
        out.push({ id: 'out4', label: '谷谷间隔', labelEn: 'Valley-to-Valley' });
      }
      if (node.params.showBandIntervalCompact !== false) {
        out.push({ id: 'out5', label: '峰峰间隔(紧凑)', labelEn: 'Peak-Peak (Compact)' });
        out.push({ id: 'out6', label: '谷谷间隔(紧凑)', labelEn: 'Valley-Valley (Compact)' });
      }
      if (node.params.showTrigInterval === true) {
        out.push({ id: 'out7', label: '触发峰间隔', labelEn: 'Trig Peak Interval' });
        out.push({ id: 'out8', label: '触发峰间隔(紧凑)', labelEn: 'Trig Peak Intvl (Compact)' });
        out.push({ id: 'out9', label: '触发谷间隔', labelEn: 'Trig Valley Interval' });
        out.push({ id: 'out10', label: '触发谷间隔(紧凑)', labelEn: 'Trig Valley Intvl (Compact)' });
      }
      return out;
    }
    return node.def.outputs;
  }

  getNodePortIds(node, direction) {
    return new Set((direction === 'in' ? this.getNodeInputs(node) : this.getNodeOutputs(node)).map(p => p.id));
  }

  pruneInvalidConnectionsForNode(node) {
    const inputIds = this.getNodePortIds(node, 'in');
    const outputIds = this.getNodePortIds(node, 'out');
    this.connections = this.connections.filter(c => {
      if (c.toNode === node.id && !inputIds.has(c.toPort)) return false;
      if (c.fromNode === node.id && !outputIds.has(c.fromPort)) return false;
      return true;
    });
  }

  rerenderNode(node) {
    this.pruneInvalidConnectionsForNode(node);
    // Destroy stale CodeMirror instances
    if (this._cmViews) {
      for (const [key, view] of this._cmViews) {
        if (key.startsWith(node.id + ':')) { view.destroy(); this._cmViews.delete(key); }
      }
    }
    if (node.el) node.el.remove();
    this.renderNode(node);
    this.updatePortPositions(node);
    this.updateSelectionClasses();
    this.renderConnections();
  }

  refreshDynamicPortNode(node) {
    this.pruneInvalidConnectionsForNode(node);
    if (node.el) node.el.remove();
    this.renderNode(node);
    this.updatePortPositions(node);
    this.updateSelectionClasses();
    this.renderConnections();
  }

  renderNode(node) {
    const def = node.def;
    const inputs = this.getNodeInputs(node);
    const outputs = this.getNodeOutputs(node);
    const el = document.createElement('div');
    el.className = `node node-${def.type}`;
    el.dataset.nodeId = node.id;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';

    // Header
    const header = document.createElement('div');
    header.className = 'node-header';
    const title = document.createElement('span');
    title.className = 'node-title';
    title.title = '双击重命名';
    title.innerHTML = this.getNodeTitle(node).replace(/ (#\d+)$/, ' <span style="opacity:0.55;font-weight:400;font-size:10px">$1</span>');
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.startTitleEdit(node, title);
    });
    header.appendChild(title);
    el.appendChild(header);

    // Delete button
    const del = document.createElement('button');
    del.className = 'node-delete';
    del.textContent = '×';
    del.onclick = (e) => { e.stopPropagation(); this.removeNode(node.id); };
    el.appendChild(del);

    // Body
    const body = document.createElement('div');
    body.className = 'node-body';
    const maxPorts = Math.max(inputs.length, outputs.length, 1);
    body.style.minHeight = (maxPorts * 28 + 12) + 'px';

    if (node.type === 'csvoutput') {
      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'node-action-button';
      exportBtn.textContent = '导出 CSV';
      exportBtn.onclick = (e) => {
        e.stopPropagation();
        this.exportCsvOutputNode(node.id);
      };
      body.appendChild(exportBtn);
    }

    def.params.forEach(p => {
      if (p.id === 'name' || p.id === 'note') return; // 改用双击标题重命名
      const label = document.createElement('label');
      label.textContent = I18N.tn(p.label, p.labelEn);
      this.markParamControl(label, p);
      body.appendChild(label);

      if (p.type === 'file') {
        const upload = document.createElement('div');
        upload.className = 'file-upload';
        const btn = document.createElement('span');
        btn.className = 'file-btn';
        btn.textContent = '📁 选择 CSV 文件';
        btn.id = `fileLabel-${node.id}`;
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.csv,.txt';
        inp.onchange = (e) => this.handleFileUpload(node, e);
        upload.appendChild(btn);
        upload.appendChild(inp);
        body.appendChild(upload);
      } else if (p.type === 'code') {
        // CodeMirror-enhanced editor for custom node JS code
        const wrap = document.createElement('div');
        wrap.className = 'cm-wrap';
        body.appendChild(wrap);
        // Fallback textarea (hidden when CM loads)
        const ta = document.createElement('textarea');
        ta.value = node.params[p.id];
        ta.spellcheck = false;
        ta.style.cssText = 'display:none;flex:1;min-height:80px;resize:none;';
        ta.oninput = () => { node.params[p.id] = ta.value; this.scheduleSave(); };
        wrap.appendChild(ta);
        // Async mount CodeMirror
        this._loadCodeMirror().then(cm => {
          if (cm && wrap.isConnected) {
            ta.style.display = 'none';
            const view = this._createCmEditor(wrap, node, p.id);
            if (view) {
              // Store for cleanup / external value sync
              if (!this._cmViews) this._cmViews = new Map();
              this._cmViews.set(node.id + ':' + p.id, view);
              // CM async load may change node height — refresh after layout settles
              setTimeout(() => {
                this.updatePortPositions(node);
                this.renderConnections();
              }, 250);
            } else {
              ta.style.display = ''; // fallback
            }
          } else {
            ta.style.display = ''; // offline fallback
          }
        });
        // Resize handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        let startX, startY, startW, startH, startZoom;
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startX = e.clientX;
          startY = e.clientY;
          startW = el.offsetWidth;
          startH = el.offsetHeight;
          startZoom = this.canvasZoom;
          const onMove = (ev) => {
            const dx = (ev.clientX - startX) / startZoom;
            const dy = (ev.clientY - startY) / startZoom;
            el.style.width = (startW + dx) + 'px';
            el.style.height = (startH + dy) + 'px';
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.updatePortPositions(node);
            this.renderConnections();
            this.scheduleSave();
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
        body.appendChild(handle);
      } else if (p.type === 'noteText') {
        const ta = document.createElement('textarea');
        ta.value = node.params[p.id];
        ta.rows = 5;
        ta.spellcheck = false;
        ta.oninput = () => { node.params[p.id] = ta.value; this.scheduleSave(); };
        body.appendChild(ta);
        // Resize handle for note nodes
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        let startX2, startY2, startW2, startH2, startZoom2;
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startX2 = e.clientX;
          startY2 = e.clientY;
          startW2 = el.offsetWidth;
          startH2 = el.offsetHeight;
          startZoom2 = this.canvasZoom;
          const onMove = (ev) => {
            const dx = (ev.clientX - startX2) / startZoom2;
            const dy = (ev.clientY - startY2) / startZoom2;
            el.style.width = (startW2 + dx) + 'px';
            el.style.height = (startH2 + dy) + 'px';
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.updatePortPositions(node);
            this.renderConnections();
            this.scheduleSave();
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
        body.appendChild(handle);
      } else if (p.type === 'number') {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.value = node.params[p.id];
        inp.min = p.min !== undefined ? p.min : 1;
        this.markParamControl(inp, p);
        inp.oninput = () => {
          if (p.optional && inp.value.trim() === '') { node.params[p.id] = ''; this.scheduleSave(); return; }
          node.params[p.id] = parseFloat(inp.value) || 0;
          if (p.affectsPorts) this.rerenderNode(node);
          this.scheduleSave();
        };
        body.appendChild(inp);
      } else if (p.type === 'color') {
        const inp = document.createElement('input');
        inp.type = 'color';
        inp.value = node.params[p.id] || this.randomColor();
        if (!node.params[p.id]) node.params[p.id] = inp.value;
        inp.style.width = '100%';
        inp.style.height = '28px';
        inp.style.border = 'none';
        inp.style.cursor = 'pointer';
        inp.oninput = () => { node.params[p.id] = inp.value; this.scheduleSave(); };
        body.appendChild(inp);
      } else if (p.type === 'checkbox') {
        const wrap = document.createElement('label');
        wrap.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:#ccc;margin-bottom:6px;';
        label.remove();
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.checked = node.params[p.id] === true;
        inp.style.width = 'auto';
        inp.style.margin = '0';
        inp.onchange = () => { node.params[p.id] = inp.checked; if (p.affectsPorts) this.rerenderNode(node); else this.renderConnections(); this.scheduleSave(); };
        wrap.appendChild(inp);
        wrap.appendChild(document.createTextNode(I18N.tn(p.label, p.labelEn)));
        body.appendChild(wrap);
      } else if (p.type === 'routeChecks') {
        this.renderRouteChecks(body, node, p);
      } else if (p.type === 'inputWeights') {
        this.renderInputWeights(body, node, p);
      } else if (p.type === 'portNames') {
        this.renderPortNameInputs(body, node, p);
      } else if (p.type === 'select') {
        this.renderParamSelect(body, node, p);
      } else if (p.type === 'info') {
        const div = document.createElement('div');
        div.style.cssText = 'font-size:10px;color:#888;padding:4px 0 6px;line-height:1.6;white-space:pre-line;word-break:break-all;overflow-wrap:break-word;max-width:220px;';
        div.innerHTML = I18N.tn(p.default, p.defaultEn);
        body.appendChild(div);
      } else {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = node.params[p.id];
        inp.placeholder = p.default || '';
        inp.oninput = () => {
          node.params[p.id] = inp.value;
          this.updateNodeTitle(node);
          this.scheduleSave();
        };
        body.appendChild(inp);
      }
    });
    this.syncParamControlStates(node, body);

    el.appendChild(body);

    // Input ports - positioned relative to body
    inputs.forEach((port, i) => {
      const p = document.createElement('div');
      p.className = 'port port-in';
      p.dataset.nodeId = node.id;
      p.dataset.portId = port.id;
      p.dataset.portIdx = i;
      p.dataset.portTotal = inputs.length;
      const lbl = document.createElement('span');
      lbl.className = 'port-label';
      lbl.textContent = I18N.tn(port.label, port.labelEn);
      p.appendChild(lbl);
      el.appendChild(p);
    });

    // Output ports - positioned relative to body
    outputs.forEach((port, i) => {
      const p = document.createElement('div');
      p.className = 'port port-out';
      p.dataset.nodeId = node.id;
      p.dataset.portId = port.id;
      p.dataset.portIdx = i;
      p.dataset.portTotal = outputs.length;
      const lbl = document.createElement('span');
      lbl.className = 'port-label';
      lbl.textContent = I18N.tn(port.label, port.labelEn);
      p.appendChild(lbl);

      p.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.startConnection(node.id, port.id);
      });

      el.appendChild(p);
    });

    // Drag
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('.node-title-input')) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        this.toggleNodeSelection(node.id);
        return;
      }
      this.draggingNode = node;
      const panelRect = this.canvasPanel.getBoundingClientRect();
      if (!this.selectedNodes.has(node.id)) this.selectNode(node.id);
      const dragStart = this.panelToWorldPoint(e.clientX - panelRect.left, e.clientY - panelRect.top);
      const movingNodes = this.getSelectedNodes().map(n => ({ node: n, x: n.x, y: n.y }));
      movingNodes.forEach(item => { if (item.node.el) item.node.el.style.zIndex = 20; });

      const onMove = (ev) => {
        const panelRect = this.canvasPanel.getBoundingClientRect();
        const point = this.panelToWorldPoint(ev.clientX - panelRect.left, ev.clientY - panelRect.top);
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        movingNodes.forEach(item => {
          item.node.x = item.x + dx;
          item.node.y = item.y + dy;
          item.node.el.style.left = item.node.x + 'px';
          item.node.el.style.top = item.node.y + 'px';
        });
        this.renderConnections();
      };
      const onUp = () => {
        this.draggingNode = null;
        movingNodes.forEach(item => { if (item.node.el) item.node.el.style.zIndex = 10; });
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.pushUndo();
        this.scheduleSave();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    this.viewport.appendChild(el);
    node.el = el;
    requestAnimationFrame(() => this.updatePortPositions(node));
    // Update port positions on resize
    const ro = new ResizeObserver(() => { this.updatePortPositions(node); this.renderConnections(); });
    ro.observe(el);
  }

  markParamControl(control, p) {
    control.dataset.paramId = p.id;
    return control;
  }

  syncParamControlStates(node, body) {
    for (const p of node.def.params) {
      const disabled = p.enabledWhen && node.params[p.enabledWhen.param] !== p.enabledWhen.value;
      body.querySelectorAll(`[data-param-id="${p.id}"]`).forEach(control => {
        control.disabled = disabled;
        control.style.opacity = disabled ? '0.45' : '';
      });
    }
  }

  closeParamSelects(scope = document) {
    scope.querySelectorAll('.param-select.open').forEach(select => select.classList.remove('open'));
  }

  renderParamSelect(body, node, p) {
    const wrap = document.createElement('div');
    wrap.className = 'param-select';
    this.markParamControl(wrap, p);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'param-select-button';
    button.textContent = I18N.tn(node.params[p.id], p.optionsEn ? p.optionsEn[p.options.indexOf(node.params[p.id])] : null);
    this.markParamControl(button, p);

    const menu = document.createElement('div');
    menu.className = 'param-select-menu';

    for (let oi = 0; oi < (p.options || []).length; oi++) {
      const opt = p.options[oi];
      const optEn = p.optionsEn ? p.optionsEn[oi] : null;
      const item = document.createElement('div');
      item.className = 'param-select-option' + (opt === node.params[p.id] ? ' selected' : '');
      item.textContent = I18N.tn(opt, optEn);
      item.onclick = (e) => {
        e.stopPropagation();
        node.params[p.id] = opt;
        this.closeParamSelects();
        if (p.affectsPorts) {
          this.rerenderNode(node);
        } else {
          button.textContent = I18N.tn(opt, optEn);
          menu.querySelectorAll('.param-select-option').forEach(option => option.classList.toggle('selected', option === item));
          this.syncParamControlStates(node, body);
        }
        this.scheduleSave();
      };
      menu.appendChild(item);
    }

    button.onclick = (e) => {
      e.stopPropagation();
      if (button.disabled) return;
      const wasOpen = wrap.classList.contains('open');
      this.closeParamSelects();
      wrap.classList.toggle('open', !wasOpen);
    };

    wrap.appendChild(button);
    wrap.appendChild(menu);
    body.appendChild(wrap);
  }

  renderRouteChecks(body, node, p) {
    if (!node.params[p.id] || typeof node.params[p.id] !== 'object') node.params[p.id] = {};
    const count = this.getMultiplexerPortCount(node);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:6px;';
    for (let i = 1; i <= count; i++) {
      const row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;color:#ccc;margin:0;';
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.checked = this.isMultiplexerRouteEnabled(node, i);
      inp.style.width = 'auto';
      inp.style.margin = '0';
      inp.onchange = () => {
        if (inp.checked) {
          this.setMultiplexerRoute(node, i);
          this.updateMultiplexerRouteChecks(wrap, node);
          this.renderConnections();
        } else {
          inp.checked = true;
        }
        this.scheduleSave();
      };
      row.appendChild(inp);
      row.appendChild(document.createTextNode(I18N.t('通道 {0}', i)));
      wrap.appendChild(row);
    }
    this.renderMultiplexerRouteButtons(body, node, wrap);
    body.appendChild(wrap);
  }

  renderInputWeights(body, node, p) {
    if (!node.params[p.id] || typeof node.params[p.id] !== 'object') node.params[p.id] = {};
    const ports = this.getNodeInputs(node);
    const wrap = document.createElement('div');
    wrap.className = 'port-name-list';
    this.markParamControl(wrap, p);

    ports.forEach((port, i) => {
      const row = document.createElement('div');
      row.className = 'port-name-row';
      const hint = document.createElement('span');
      hint.textContent = port.label;
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.001';
      inp.value = node.params[p.id][port.id] !== undefined ? node.params[p.id][port.id] : 1;
      this.markParamControl(inp, p);
      inp.oninput = () => {
        node.params[p.id][port.id] = parseFloat(inp.value) || 0;
        this.scheduleSave();
      };
      row.appendChild(hint);
      row.appendChild(inp);
      wrap.appendChild(row);
    });

    body.appendChild(wrap);
  }

  renderPortNameInputs(body, node, p) {
    if (!node.params[p.id] || typeof node.params[p.id] !== 'object') node.params[p.id] = {};
    const ports = p.direction === 'in' ? this.getNodeInputs(node) : this.getNodeOutputs(node);
    const wrap = document.createElement('div');
    wrap.className = 'port-name-list';
    this.markParamControl(wrap, p);

    ports.forEach((port, i) => {
      const row = document.createElement('div');
      row.className = 'port-name-row';
      const hint = document.createElement('span');
      hint.textContent = port.id;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = node.params[p.id][port.id] || '';
      inp.placeholder = p.direction === 'in' ? `输入${i + 1}` : `输出${i + 1}`;
      this.markParamControl(inp, p);
      inp.oninput = () => {
        node.params[p.id][port.id] = inp.value;
        this.updatePortLabels(node);
        this.scheduleSave();
      };
      row.appendChild(hint);
      row.appendChild(inp);
      wrap.appendChild(row);
    });

    body.appendChild(wrap);
  }

  updatePortLabels(node) {
    if (!node.el) return;
    const update = (ports, direction) => {
      ports.forEach((port, i) => {
        const label = node.el.querySelector(`.port-${direction}[data-port-id="${port.id}"] .port-label`);
        if (label) { const info = this.getCustomPortLabel(node, direction, port.id, i); label.textContent = I18N.tn(info.label, info.labelEn); }
      });
    };
    if (node.type === 'custom') {
      update(this.getNodeInputs(node), 'in');
      update(this.getNodeOutputs(node), 'out');
    }
  }

  renderMultiplexerRouteButtons(body, node, wrap) {
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;';
    const makeButton = (text, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'node-action-button';
      btn.textContent = text;
      btn.style.flex = '1';
      btn.style.padding = '4px 6px';
      btn.style.marginBottom = '0';
      btn.style.fontSize = '11px';
      btn.onclick = (e) => {
        e.stopPropagation();
        onClick();
      };
      bar.appendChild(btn);
      return btn;
    };
    const prevBtn = makeButton(I18N.t('上一个'), () => {
      const count = this.getMultiplexerPortCount(node);
      const current = this.getMultiplexerSelectedRoute(node);
      const prev = current === 1 ? count : current - 1;
      this.selectMultiplexerRoute(node, prev, wrap);
    });
    prevBtn.textContent = I18N.t('上一个');
    const nextBtn = makeButton(I18N.t('下一个'), () => {
      const count = this.getMultiplexerPortCount(node);
      const current = this.getMultiplexerSelectedRoute(node);
      const next = current === count ? 1 : current + 1;
      this.selectMultiplexerRoute(node, next, wrap);
    });
    nextBtn.textContent = I18N.t('下一个');
    const randomBtn = makeButton(I18N.t('随机'), () => {
      const route = this.getRandomDifferentMultiplexerRoute(node);
      this.selectMultiplexerRoute(node, route, wrap);
    });
    randomBtn.textContent = I18N.t('随机');
    randomBtn.onclick = (e) => {
      e.stopPropagation();
      const route = this.getRandomDifferentMultiplexerRoute(node);
      this.selectMultiplexerRoute(node, route, wrap);
    };
    body.appendChild(bar);
  }

  getRandomDifferentMultiplexerRoute(node) {
    const count = this.getMultiplexerPortCount(node);
    if (count <= 1) return 1;
    const current = this.getMultiplexerSelectedRoute(node);
    let route;
    do {
      route = Math.floor(Math.random() * count) + 1;
    } while (route === current);
    return route;
  }

  selectMultiplexerRoute(node, route, wrap) {
    this.setMultiplexerRoute(node, route);
    this.updateMultiplexerRouteChecks(wrap, node);
    this.renderConnections();
    this.scheduleSave();
  }

  updateMultiplexerRouteChecks(wrap, node) {
    wrap.querySelectorAll('input[type="checkbox"]').forEach((inp, index) => {
      inp.checked = this.isMultiplexerRouteEnabled(node, index + 1);
    });
  }

  getNodeTitle(node) {
    const id = `#${node.id}`;
    const title = I18N.tn(node.def.title, node.def.titleEn);
    if (node._label) return `${node._label} ${id}`;
    if (node.type === 'input' && node.params.note) return `${title} - ${node.params.note} ${id}`;
    if (node.type === 'probe' && node.params.name) return `${title} - ${node.params.name} ${id}`;
    if (node.type === 'csvoutput' && node.params.name) return `${title} - ${node.params.name} ${id}`;
    if (node.type === 'custom' && node.params.name) return `${node.params.name} ${id}`;
    return `${title} ${id}`;
  }

  updateNodeTitle(node) {
    if (!node.el) return;
    const title = node.el.querySelector('.node-title');
    if (title) title.innerHTML = this.getNodeTitle(node).replace(/ (#\d+)$/, ' <span style="opacity:0.55;font-weight:400;font-size:10px">$1</span>');
  }

  startTitleEdit(node, titleEl) {
    const currentLabel = node._label || node.params.note || node.params.name || node.def.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'node-title-input';
    input.value = currentLabel;
    input.style.cssText = 'width:100%;background:var(--vscode-input);color:var(--vscode-text);border:1px solid var(--vscode-accent);border-radius:2px;padding:1px 4px;font-size:12px;font-weight:600;outline:none;';
    titleEl.innerHTML = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const val = input.value.trim();
      if (val && val !== node.def.title) {
        node._label = val;
      } else if (val === node.def.title || val === '') {
        node._label = null;
      }
      this.updateNodeTitle(node);
      this.scheduleSave();
    };

    const cancel = () => {
      this.updateNodeTitle(node);
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
  }

  updatePortPositions(node) {
    const el = node.el;
    if (!el) return;
    const header = el.querySelector('.node-header');
    const body = el.querySelector('.node-body');
    const headerH = header.offsetHeight;
    const bodyH = body.offsetHeight;
    const ports = el.querySelectorAll('.port');
    ports.forEach(p => {
      const idx = parseInt(p.dataset.portIdx);
      const total = parseInt(p.dataset.portTotal);
      p.style.top = (headerH + bodyH / (total + 1) * (idx + 1) - 7) + 'px';
    });
  }

  getSelectedNodes() {
    return this.nodes.filter(n => this.selectedNodes.has(n.id));
  }

  updateSelectionClasses() {
    this.nodes.forEach(n => n.el && n.el.classList.toggle('selected', this.selectedNodes.has(n.id)));
  }

  selectNode(id) {
    this.selectedNodes.clear();
    if (id !== null && id !== undefined) this.selectedNodes.add(id);
    this.selectedNode = id || null;
    this.updateSelectionClasses();
  }

  selectNodes(ids) {
    this.selectedNodes = new Set(ids);
    this.selectedNode = ids.length > 0 ? ids[ids.length - 1] : null;
    this.updateSelectionClasses();
  }

  toggleNodeSelection(id) {
    if (this.selectedNodes.has(id)) {
      this.selectedNodes.delete(id);
    } else {
      this.selectedNodes.add(id);
    }
    const ids = [...this.selectedNodes];
    this.selectedNode = ids.length > 0 ? ids[ids.length - 1] : null;
    this.updateSelectionClasses();
  }

  removeNode(id) {
    this.pushUndo();
    this.connections = this.connections.filter(c => c.fromNode !== id && c.toNode !== id);
    const node = this.nodes.find(n => n.id === id);
    if (node && node.el) node.el.remove();
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.selectedNodes.delete(id);
    this.renderConnections();
    this.updateEmptyHint();
    if (this.selectedNode === id) this.selectedNode = null;
    this.scheduleSave();
  }

  removeSelectedNodes() {
    const ids = [...this.selectedNodes];
    if (ids.length === 0) return;
    this.pushUndo();
    const idSet = new Set(ids);
    this.connections = this.connections.filter(c => !idSet.has(c.fromNode) && !idSet.has(c.toNode));
    for (const node of this.nodes) {
      if (idSet.has(node.id) && node.el) node.el.remove();
    }
    this.nodes = this.nodes.filter(n => !idSet.has(n.id));
    this.selectedNodes.clear();
    this.selectedNode = null;
    this.renderConnections();
    this.updateEmptyHint();
    this.scheduleSave();
  }

  copySelectedNodes() {
    const selected = this.getSelectedNodes();
    if (!selected.length) return;
    const selectedIds = new Set(selected.map(n => n.id));
    this.copiedNode = {
      nodes: selected.map(n => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        params: Object.fromEntries(Object.entries(n.params).map(([key, value]) => [key, this.cloneParamValue(value)])),
        data: n._data ? [...n._data] : null
      })),
      connections: this.connections.filter(c => selectedIds.has(c.fromNode) && selectedIds.has(c.toNode)).map(c => ({ ...c })),
      centerX: selected.reduce((sum, n) => sum + n.x, 0) / selected.length,
      centerY: selected.reduce((sum, n) => sum + n.y, 0) / selected.length
    };
    this.toast(`已复制 ${selected.length} 个节点`, 'info');
  }

  pasteCopiedNodes(pastePoint) {
    if (!this.copiedNode || !this.copiedNode.nodes || !this.copiedNode.nodes.length) return;
    this.pushUndo();
    const target = pastePoint || { x: this.copiedNode.centerX + 30, y: this.copiedNode.centerY + 30 };
    const idMap = new Map();
    const pastedIds = [];
    for (const item of this.copiedNode.nodes) {
      const x = target.x + item.x - this.copiedNode.centerX;
      const y = target.y + item.y - this.copiedNode.centerY;
      const node = this.addNode(item.type, x, y);
      if (!node) continue;
      node.params = Object.fromEntries(Object.entries(item.params).map(([key, value]) => [key, this.cloneParamValue(value)]));
      if (item.data) node._data = [...item.data];
      if (node.def.params.some(p => p.affectsPorts)) this.refreshDynamicPortNode(node);
      else this.refreshNodeControls(node);
      this.updateNodeTitle(node);
      if (node.type === 'input' && node._data) {
        const lbl = document.getElementById(`fileLabel-${node.id}`);
        if (lbl) lbl.textContent = `已复制 ${node._data.length} 点`;
      }
      idMap.set(item.id, node.id);
      pastedIds.push(node.id);
    }
    for (const conn of this.copiedNode.connections) {
      if (idMap.has(conn.fromNode) && idMap.has(conn.toNode)) {
        this.connections.push({ fromNode: idMap.get(conn.fromNode), fromPort: conn.fromPort, toNode: idMap.get(conn.toNode), toPort: conn.toPort });
      }
    }
    for (const id of pastedIds) {
      const node = this.nodes.find(n => n.id === id);
      if (node) this.updatePortPositions(node);
    }
    this.renderConnections();
    this.selectNodes(pastedIds);
    this.scheduleSave();
    this.toast(`已粘贴 ${pastedIds.length} 个节点`, 'info');
  }

  refreshNodeControls(node) {
    if (!node.el) return;
    for (const p of node.def.params) {
      const controls = node.el.querySelectorAll(`[data-param-id="${p.id}"]`);
      controls.forEach(control => {
        if (control.tagName === 'INPUT') {
          if (control.type === 'checkbox') control.checked = node.params[p.id] === true;
          else if (control.type !== 'file') control.value = node.params[p.id];
        } else if (control.tagName === 'TEXTAREA' || control.tagName === 'SELECT') {
          control.value = node.params[p.id];
        }
      });
    }
    const body = node.el.querySelector('.node-body');
    if (body) this.syncParamControlStates(node, body);
  }

  startMarqueeSelection(e) {
    e.preventDefault();
    const rect = this.canvasPanel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.marquee = { startX: x, startY: y, active: false };
    this.selectionBox.style.left = x + 'px';
    this.selectionBox.style.top = y + 'px';
    this.selectionBox.style.width = '0px';
    this.selectionBox.style.height = '0px';
    this.selectionBox.style.display = 'block';
  }

  updateMarqueeSelection(e) {
    if (!this.marquee) return;
    const rect = this.canvasPanel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const left = Math.min(this.marquee.startX, x);
    const top = Math.min(this.marquee.startY, y);
    const width = Math.abs(x - this.marquee.startX);
    const height = Math.abs(y - this.marquee.startY);
    this.marquee.active = width > 3 || height > 3;
    this.selectionBox.style.left = left + 'px';
    this.selectionBox.style.top = top + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';

    const start = this.panelToWorldPoint(this.marquee.startX, this.marquee.startY);
    const end = this.panelToWorldPoint(x, y);
    const worldRect = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
    const ids = this.getNodesInSelection(worldRect).map(n => n.id);
    this.selectNodes(ids);
  }

  finishMarqueeSelection(e) {
    if (!this.marquee) return;
    if (!this.marquee.active) this.selectNode(null);
    this.marquee = null;
    this.selectionBox.style.display = 'none';
  }

  getNodesInSelection(worldRect) {
    return this.nodes.filter(node => {
      if (!node.el) return false;
      const nodeRect = {
        x: node.x,
        y: node.y,
        width: node.el.offsetWidth,
        height: node.el.offsetHeight
      };
      return !(
        nodeRect.x + nodeRect.width < worldRect.x ||
        nodeRect.x > worldRect.x + worldRect.width ||
        nodeRect.y + nodeRect.height < worldRect.y ||
        nodeRect.y > worldRect.y + worldRect.height
      );
    });
  }

  rebuildAll() {
    // Full rebuild of all node views
    for (const node of this.nodes) {
      // Destroy stale CodeMirror instances
      if (this._cmViews) {
        for (const [key, view] of this._cmViews) {
          if (key.startsWith(node.id + ':')) { view.destroy(); this._cmViews.delete(key); }
        }
      }
      if (node.el) { node.el.remove(); node.el = null; }
      this.renderNode(node);
      this.updatePortPositions(node);
    }
    this.renderConnections();
    // Rebuild charts
    this.redrawCharts();
    // Update DOM translations
    I18N.updateDOM();
    this.updateEmptyHint();
  }

  updateEmptyHint() {
    const el = document.getElementById('emptyHint');
    if (!el) return;
    el.style.display = this.nodes.length === 0 ? 'block' : 'none';
    if (this.nodes.length === 0) {
      el.innerHTML = I18N.t('从左侧栏拖拽节点到画布') + '<br>' +
        I18N.t('从输出端口 (右侧圆点) 拖拽到输入端口 (左侧圆点) 连线') + '<br>' +
        I18N.t('画布空白处左键拖拽框选，拖动已选节点可整体移动') + '<br>' +
        I18N.t('点击连线变红后再点删除 / 右键直接删除') + '<br>' +
        I18N.t('按 Delete 键删除选中节点 / F5 运行') + '<br>' +
        I18N.t('鼠标中键拖拽平移视图 / 空格键复位') + '<br><br>' +
        I18N.t('点击左下角「演示数据」可快速体验');
    }
  }

  clearAll() {
    if (this.nodes.length === 0) return;
    if (!confirm('确定清空画布？所有节点和连线将被删除。')) return;
    // Stop auto-run
    this.stopAutoRun();
    for (const n of this.nodes) { if (n.el) n.el.remove(); }
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.selectedNodes.clear();
    this.probeData.clear();
    this.nodeCache.clear();
    this.renderConnections();
    this.updateEmptyHint();
    this.chartScroll.innerHTML = '<div style="text-align:center;color:#444;padding:40px 0;font-size:13px;" id="chartEmpty">运行后在此显示波形</div>';
    this.resetView();
    this.scheduleSave();
    this.toast('画布已清空', 'info');
  }

  // ---- File Upload ----
  handleFileUpload(node, e) {
    const file = e.target.files[0];
    if (!file) return;
    const label = document.getElementById(`fileLabel-${node.id}`);
    label.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split(/\r?\n/);
      const values = [];
      for (const line of lines) {
        const parts = line.split(/[,\t;]+/);
        for (const p of parts) {
          const v = parseFloat(p.trim());
          if (!isNaN(v)) values.push(v);
        }
      }
      node._data = values;
      this.toast(`已导入 ${values.length} 个采样点`, 'success');
      this.scheduleSave();
    };
    reader.readAsText(file);
  }

  formatTimestamp(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  sanitizeFileName(name) {
    return String(name || 'signal_output')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '') || 'signal_output';
  }

  escapeCsvValue(value) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  toCsvRows(data) {
    return data.map(value => this.escapeCsvValue(value)).join('\n');
  }

  downloadCsvOutput(node, data) {
    const name = node._label || node.params.name || `CSV输出_${node.id}`;
    const timestamp = this.formatTimestamp();
    const sampleRate = this.sampleRate || 0;
    const csv = this.toCsvRows(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeFileName(name)}_${timestamp}_${this.sanitizeFileName(`${sampleRate}Hz`)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Demo Data ----
  loadDemo() {
    // Generate demo: sine + noise + high freq component
    const sr = 1000;
    const n = 2000;
    const data = [];
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const signal = Math.sin(2 * Math.PI * 5 * t) * 2.0;       // 5 Hz base
      const noise = (Math.random() - 0.5) * 1.5;                // noise
      const hf = Math.sin(2 * Math.PI * 150 * t) * 0.8;         // 150 Hz component
      data.push(signal + noise + hf);
    }

    // Create demo flow: Input -> Lowpass -> Probe (filtered)
    //                   Input -> Probe (raw)
    const nInput = this.addNode('input', 60, 100);
    nInput._data = data;
    nInput.params.samplerate = sr;
    const fileLabel = document.getElementById(`fileLabel-${nInput.id}`);
    if (fileLabel) fileLabel.textContent = 'demo_sine+noise.csv';

    const nLowpass = this.addNode('lowpass', 340, 100);
    nLowpass.params.cutoff = 30;

    const nSplitter = this.addNode('splitter', 340, 300);

    const nProbeRaw = this.addNode('probe', 620, 60);
    nProbeRaw._label = '原始信号';

    const nProbeFiltered = this.addNode('probe', 620, 200);
    nProbeFiltered._label = '低通滤波后';

    const nProbeHigh = this.addNode('probe', 620, 350);
    nProbeHigh._label = '高通滤波后';

    const nHighpass = this.addNode('highpass', 60, 300);
    nHighpass.params.cutoff = 80;

    // Connect
    this.addConnection(nInput.id, 'out', nLowpass.id, 'in');
    this.addConnection(nInput.id, 'out', nProbeRaw.id, 'in');
    this.addConnection(nLowpass.id, 'out', nProbeFiltered.id, 'in');
    this.addConnection(nInput.id, 'out', nHighpass.id, 'in');
    this.addConnection(nHighpass.id, 'out', nProbeHigh.id, 'in');

    this.toast('已加载演示数据，点击「运行」查看波形', 'success');
  }

  addConnection(fromNodeId, fromPortId, toNodeId, toPortId) {
    this.connections = this.connections.filter(c => !(c.toNode === toNodeId && c.toPort === toPortId));
    this.connections.push({ fromNode: fromNodeId, fromPort: fromPortId, toNode: toNodeId, toPort: toPortId });
    this.renderConnections();
    this.scheduleSave();
  }

  // ---- Connections ----
  startConnection(fromNodeId, fromPortId) {
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.classList.add('temp');
    this.svg.appendChild(tempPath);
    const start = this.getPortPos(fromNodeId, fromPortId);
    this.connecting = {
      fromNodeId, fromPortId,
      startX: start.x,
      startY: start.y,
      tempPath
    };
  }

  panelToSvgPoint(x, y) {
    // Convert panel (screen) coordinates to world coordinates
    return this.panelToWorldPoint(x, y);
  }

  drawTempConnection(panelX, panelY) {
    if (!this.connecting) return;
    const end = this.panelToSvgPoint(panelX, panelY);
    this.connecting.tempPath.setAttribute('d', this.bezierPath(this.connecting.startX, this.connecting.startY, end.x, end.y));
  }

  finishConnection(toNodeId, toPortId) {
    if (!this.connecting) return;
    const { fromNodeId, fromPortId, tempPath } = this.connecting;
    tempPath.remove();
    if (fromNodeId === toNodeId) { this.connecting = null; return; }
    this.pushUndo();
    this.connections = this.connections.filter(c => !(c.toNode === toNodeId && c.toPort === toPortId));
    this.connections.push({ fromNode: fromNodeId, fromPort: fromPortId, toNode: toNodeId, toPort: toPortId });
    this.connecting = null;
    this.renderConnections();
    this.scheduleSave();
  }

  cancelConnection() {
    if (this.connecting) {
      this.connecting.tempPath.remove();
      this.connecting = null;
    }
  }

  getPortPos(nodeId, portId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node || !node.el) return { x: 0, y: 0 };
    const port = node.el.querySelector(`.port[data-node-id="${nodeId}"][data-port-id="${portId}"]`);
    if (!port) return { x: 0, y: 0 };
    // Position in world coordinates (SVG viewBox handles mapping)
    return {
      x: node.x + port.offsetLeft + 7,
      y: node.y + port.offsetTop + 7
    };
  }

  resetView() {
    this.panOffset = { x: 0, y: 0 };
    this.canvasZoom = 1;
    this.applyViewportTransform();
    this.drawGrid();
    this.updateSvgViewBox();
    this.scheduleSave();
  }

  bezierPath(x1, y1, x2, y2) {
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 50);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }

  connectionKey(conn) {
    return `${conn.fromNode}:${conn.fromPort}->${conn.toNode}:${conn.toPort}`;
  }

  getBlockedOutgoingConnections(node, incomingConn) {
    if (!node) return [];
    if (node.type === 'multiplexer') {
      const selectedRoute = this.getMultiplexerSelectedRoute(node);
      if (this.getMultiplexerMode(node) === '一入多出') {
        return incomingConn.toPort === 'in' ? this.connections.filter(c => c.fromNode === node.id && c.fromPort === `out${selectedRoute}`) : [];
      }
      return incomingConn.toPort === `in${selectedRoute}` ? this.connections.filter(c => c.fromNode === node.id && c.fromPort === 'out') : [];
    }
    return this.connections.filter(c => c.fromNode === node.id);
  }

  getBlockedConnectionKeys() {
    const blocked = new Set();
    const queue = [];
    for (const node of this.nodes) {
      if (node.type === 'switch' && node.params.enabled === false) {
        queue.push(...this.connections.filter(c => c.fromNode === node.id));
      }
    }
    while (queue.length) {
      const conn = queue.shift();
      const key = this.connectionKey(conn);
      if (blocked.has(key)) continue;
      blocked.add(this.connectionKey(conn));
      const node = this.nodes.find(n => n.id === conn.toNode);
      queue.push(...this.getBlockedOutgoingConnections(node, conn));
    }
    return blocked;
  }

  renderConnections() {
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    const blockedConnectionKeys = this.getBlockedConnectionKeys();
    for (const conn of this.connections) {
      const from = this.getPortPos(conn.fromNode, conn.fromPort);
      const to = this.getPortPos(conn.toNode, conn.toPort);
      const d = this.bezierPath(from.x, from.y, to.x, to.y);

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('conn-group');
      if (blockedConnectionKeys.has(this.connectionKey(conn))) g.classList.add('blocked');

      // Wide invisible hit area for easy clicking
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.classList.add('conn-hit');
      hit.setAttribute('d', d);

      // Visible thin line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.classList.add('conn-line');
      line.setAttribute('d', d);

      // Click to delete
      hit.addEventListener('click', (e) => {
        e.stopPropagation();
        if (g.classList.contains('deleting')) {
          this.pushUndo();
          this.connections = this.connections.filter(c => c !== conn);
          this.renderConnections();
          this.scheduleSave();
        } else {
          g.classList.add('deleting');
          setTimeout(() => { if (g.parentNode) g.classList.remove('deleting'); }, 2000);
        }
      });

      // Right-click to delete directly
      hit.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pushUndo();
        this.connections = this.connections.filter(c => c !== conn);
        this.renderConnections();
        this.scheduleSave();
      });

      g.appendChild(line);
      g.appendChild(hit);
      this.svg.appendChild(g);
    }
    this.updateSvgViewBox();
  }

  // ---- Signal Execution ----
  getUpstreamData(node, portId) {
    const conn = this.connections.find(c => c.toNode === node.id && c.toPort === portId);
    if (!conn) return [];
    const cached = this.nodeCache.get(conn.fromNode);
    return (cached && cached[conn.fromPort]) || [];
  }

  isInputBlocked(node, portId) {
    const conn = this.connections.find(c => c.toNode === node.id && c.toPort === portId);
    return conn ? this.getBlockedConnectionKeys().has(this.connectionKey(conn)) : false;
  }

  isMultiplexerRouteEnabled(node, i) {
    return this.getMultiplexerSelectedRoute(node) === i;
  }

  getMultiplexerSelectedRoute(node) {
    const count = this.getMultiplexerPortCount(node);
    const routes = node.params.routes || {};
    for (let i = 1; i <= count; i++) {
      if (routes[`ch${i}`] === true) return i;
    }
    return 1;
  }

  setMultiplexerRoute(node, i) {
    const count = this.getMultiplexerPortCount(node);
    const selected = Math.max(1, Math.min(count, i));
    node.params.routes = {};
    node.params.routes[`ch${selected}`] = true;
  }

  mixSignals(signals) {
    const maxLen = signals.reduce((max, signal) => Math.max(max, signal.length), 0);
    const out = [];
    for (let i = 0; i < maxLen; i++) {
      let sum = 0;
      for (const signal of signals) sum += signal[i] || 0;
      out.push(sum);
    }
    return out;
  }

  normalizeGlobal(input) {
    let min = Infinity, max = -Infinity;
    for (const v of input) { if (v < min) min = v; if (v > max) max = v; }
    const range = max - min;
    return range === 0 ? input.map(() => 0) : input.map(v => 2 * (v - min) / range - 1);
  }

  normalizeWindow(input, windowSize) {
    return input.map((v, i) => {
      const start = Math.max(0, i - windowSize + 1);
      let min = Infinity, max = -Infinity;
      for (let j = start; j <= i; j++) {
        const item = input[j];
        if (item < min) min = item;
        if (item > max) max = item;
      }
      const range = max - min;
      return range === 0 ? 0 : 2 * (v - min) / range - 1;
    });
  }

  getNormalizerMode(node) {
    return node.params.mode === '窗口' ? '窗口' : '全部';
  }

  getOddTapCount(value) {
    const taps = Math.max(3, Math.floor(value || 3));
    return taps % 2 === 0 ? taps + 1 : taps;
  }

  async executeNode(node, runOptions = {}) {
    if (this.nodeCache.has(node.id)) return;
    // Execute upstream first
    for (const conn of this.connections) {
      if (conn.toNode === node.id) {
        const upNode = this.nodes.find(n => n.id === conn.fromNode);
        if (upNode) await this.executeNode(upNode, runOptions);
      }
    }

    const outputs = {};
    switch (node.type) {
      case 'input':
        this.sampleRate = node.params.samplerate || 1000;
        outputs['out'] = node._data ? [...node._data] : [];
        break;

      case 'signalgen': {
        const ref = this.getUpstreamData(node, 'len');
        const length = ref.length || Math.max(0, Math.floor(node.params.length || 0));
        const frequency = node.params.frequency !== undefined ? node.params.frequency : 10;
        const high = node.params.high !== undefined ? node.params.high : 1;
        const low = node.params.low !== undefined ? node.params.low : -1;
        outputs['out'] = DSP.generateSineWave(length, frequency, high, low, this.sampleRate);
        break;
      }

      case 'lowpass': {
        const inp = this.getUpstreamData(node, 'in');
        const order = Math.max(1, Math.min(8, Math.floor(node.params.order || 2)));
        outputs['out'] = inp.length ? DSP.lowpass(inp, node.params.cutoff || 50, this.sampleRate, order) : [];
        break;
      }
      case 'highpass': {
        const inp = this.getUpstreamData(node, 'in');
        const order = Math.max(1, Math.min(8, Math.floor(node.params.order || 2)));
        outputs['out'] = inp.length ? DSP.highpass(inp, node.params.cutoff || 50, this.sampleRate, order) : [];
        break;
      }
      case 'bandpass': {
        const inp = this.getUpstreamData(node, 'in');
        const order = Math.max(1, Math.min(8, Math.floor(node.params.order || 2)));
        outputs['out'] = inp.length ? DSP.bandpass(inp, node.params.lowcut || 30, node.params.highcut || 100, this.sampleRate, order) : [];
        break;
      }
      case 'weighted': {
        const inp = this.getUpstreamData(node, 'in');
        const alpha = node.params.alpha !== undefined ? node.params.alpha : 0.1;
        const a = Math.max(0, Math.min(1, alpha));
        const out = [];
        if (inp.length) {
          out.push(inp[0]);
          for (let i = 1; i < inp.length; i++) {
            out.push(a * inp[i] + (1 - a) * out[i - 1]);
          }
        }
        outputs['out'] = out;
        break;
      }
      case 'firlinear': {
        const inp = this.getUpstreamData(node, 'in');
        const taps = this.getOddTapCount(node.params.taps || 31);
        const cutoff = node.params.cutoff || 50;
        const coeffs = DSP.firLinearLowpassCoefficients(cutoff, this.sampleRate, taps);
        outputs['out'] = inp.length ? DSP.firFilter(inp, coeffs) : [];
        break;
      }
      case 'madfilter': {
        const inp = this.getUpstreamData(node, 'in');
        const windowSize = Math.max(1, Math.floor(node.params.size || 1));
        const threshold = node.params.threshold !== undefined ? node.params.threshold : 3;
        const scale = node.params.scale !== undefined ? node.params.scale : 1.4826;
        const result = inp.length ? DSP.hampelMadFilter(inp, windowSize, threshold, scale) : { filtered: [], mad: [] };
        outputs['out'] = result.filtered;
        outputs['mad'] = result.mad;
        break;
      }
      case 'fft': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.length ? DSP.fftMagnitudeSpectrum(inp, this.sampleRate, node.params.size || 1024, node.params.minFreq, node.params.maxFreq) : [];
        break;
      }
      case 'custom': {
        const inputs = this.getNodeInputs(node).reduce((map, port) => {
          map[port.id] = this.getUpstreamData(node, port.id);
          return map;
        }, {});
        const customOutputs = this.getNodeOutputs(node);
        const signal = inputs.in || [];
        const sleep = (ms) => this._sleep(ms);
        const aborted = () => this._cancelToken?.signal.aborted ?? false;
        try {
          const code = node.params.code || 'return signal;';
          const fn = new Function('signal', 'sampleRate', 'inputs', 'sleep', 'aborted', `return (async () => {\n${code}\n})();`);
          const result = await fn(signal, this.sampleRate, inputs, sleep, aborted);
          if (result instanceof Promise) throw new Error('自定义节点返回值不能是 Promise——请确保 return 的是数组或对象，不是未 await 的 Promise');
          if (Array.isArray(result)) {
            outputs[customOutputs[0].id] = result;
            for (const port of customOutputs.slice(1)) outputs[port.id] = [];
          } else if (result && typeof result === 'object') {
            for (const port of customOutputs) outputs[port.id] = Array.isArray(result[port.id]) ? result[port.id] : [];
          } else {
            for (const port of customOutputs) outputs[port.id] = [];
          }
        } catch (err) {
          if (err?.name === 'AbortError' || (this._cancelToken && this._cancelToken.signal.aborted)) {
            this.toast('已取消', 'info');
          } else {
            console.error('Custom node error:', err);
            this.toast(`自定义节点错误: ${err.message}`, 'error');
          }
          for (const port of customOutputs) outputs[port.id] = [];
        }
        break;
      }
      case 'splitter': {
        const inp = this.getUpstreamData(node, 'in');
        const count = this.getSplitterOutputCount(node);
        for (let i = 1; i <= count; i++) outputs[`out${i}`] = [...inp];
        break;
      }
      case 'switch': {
        const count = this.getSwitchPortCount(node);
        for (let i = 1; i <= count; i++) {
          const inPort = count === 1 ? 'in' : `in${i}`;
          const outPort = count === 1 ? 'out' : `out${i}`;
          const inp = this.getUpstreamData(node, inPort);
          outputs[outPort] = node.params.enabled === false ? [] : [...inp];
        }
        break;
      }
      case 'multiplexer': {
        const count = this.getMultiplexerPortCount(node);
        const selectedRoute = this.getMultiplexerSelectedRoute(node);
        if (this.getMultiplexerMode(node) === '一入多出') {
          const inp = this.getUpstreamData(node, 'in');
          for (let i = 1; i <= count; i++) outputs[`out${i}`] = this.isMultiplexerRouteEnabled(node, i) ? [...inp] : [];
        } else {
          outputs['out'] = [...this.getUpstreamData(node, `in${selectedRoute}`)];
        }
        break;
      }
      case 'weightedmixer': {
        const inputs = this.getNodeInputs(node).map(port => this.getUpstreamData(node, port.id));
        const weights = node.params.weights || {};
        const len = inputs.reduce((max, data) => Math.max(max, data.length), 0);
        const out = [];
        for (let i = 0; i < len; i++) {
          let sum = 0;
          inputs.forEach((data, index) => {
            const portId = `in${index + 1}`;
            const rawWeight = weights[portId] !== undefined ? Number(weights[portId]) : 1;
            const weight = Number.isFinite(rawWeight) ? rawWeight : 0;
            sum += (data[i] !== undefined ? data[i] : 0) * weight;
          });
          out.push(sum);
        }
        outputs['out'] = out;
        break;
      }
      case 'argselector': {
        const count = this.getArgSelectorGroupCount(node);
        const mode = node.params.mode || '最大值';
        const sigs = [];
        const cmps = [];
        let len = Infinity;
        for (let i = 1; i <= count; i++) {
          const sig = this.getUpstreamData(node, `sig${i}`);
          const cmp = this.getUpstreamData(node, `cmp${i}`);
          sigs.push(sig);
          cmps.push(cmp);
          if (cmp.length > 0 && cmp.length < len) len = cmp.length;
        }
        if (len === Infinity || len === 0) { outputs['out'] = []; break; }
        const out = [];
        const fallbackOn = node.params.fallbackEnabled === true;
        const fallbackMode = node.params.fallbackMode || '大于阈值';
        const fallbackThr = node.params.fallbackThreshold !== undefined ? Number(node.params.fallbackThreshold) : 0;
        const fallbackVal = node.params.fallbackValue !== undefined ? Number(node.params.fallbackValue) : 0;
        for (let t = 0; t < len; t++) {
          let bestIdx = -1;
          let bestVal = mode === '最大值' ? -Infinity : Infinity;
          for (let i = 0; i < count; i++) {
            if (cmps[i].length === 0) continue;
            const val = cmps[i][t] !== undefined ? cmps[i][t] : (mode === '最大值' ? -Infinity : Infinity);
            const better = mode === '最大值' ? val > bestVal : val < bestVal;
            if (better) { bestVal = val; bestIdx = i; }
          }
          if (bestIdx < 0) { out.push(0); continue; }
          const sigVal = sigs[bestIdx][t] !== undefined ? sigs[bestIdx][t] : 0;
          if (fallbackOn) {
            const triggered = fallbackMode === '小于阈值' ? bestVal < fallbackThr : bestVal > fallbackThr;
            out.push(triggered ? fallbackVal : sigVal);
          } else {
            out.push(sigVal);
          }
        }
        outputs['out'] = out;
        break;
      }
      case 'multiplier': {
        const a = this.getUpstreamData(node, 'a');
        const b = this.getUpstreamData(node, 'b');
        const defaultB = node.params.value !== undefined ? node.params.value : 2;
        const len = a.length;
        const out = [];
        for (let i = 0; i < len; i++) out.push((a[i] || 0) * (b.length > 0 && b[i] !== undefined ? b[i] : defaultB));
        outputs['out'] = out;
        break;
      }
      case 'adder': {
        const a = this.getUpstreamData(node, 'a');
        const b = this.getUpstreamData(node, 'b');
        const defaultB = node.params.value !== undefined ? node.params.value : 0;
        const len = a.length;
        const out = [];
        for (let i = 0; i < len; i++) out.push((a[i] || 0) + (b.length > 0 && b[i] !== undefined ? b[i] : defaultB));
        outputs['out'] = out;
        break;
      }
      case 'subtractor': {
        const a = this.getUpstreamData(node, 'a');
        const b = this.getUpstreamData(node, 'b');
        const defaultB = node.params.value !== undefined ? node.params.value : 0;
        const len = a.length;
        const out = [];
        for (let i = 0; i < len; i++) out.push((a[i] || 0) - (b.length > 0 && b[i] !== undefined ? b[i] : defaultB));
        outputs['out'] = out;
        break;
      }
      case 'inverter': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.map(v => -v);
        break;
      }
      case 'normalizer': {
        const inp = this.getUpstreamData(node, 'in');
        if (!inp.length) { outputs['out'] = []; break; }
        const windowSize = Math.max(1, Math.floor(node.params.window || 1));
        outputs['out'] = this.getNormalizerMode(node) === '窗口' ? this.normalizeWindow(inp, windowSize) : this.normalizeGlobal(inp);
        break;
      }
      case 'cutbeg': {
        const inp = this.getUpstreamData(node, 'in');
        const pct = Math.max(0, Math.min(100, node.params.percent || 0));
        const count = Math.floor(inp.length * pct / 100);
        const mode = node.params.mode || '裁剪';
        if (mode === '裁剪') {
          outputs['out'] = inp.slice(count);
        } else {
          outputs['out'] = inp.map((v, i) => i < count ? 0 : v);
        }
        break;
      }
      case 'cutend': {
        const inp = this.getUpstreamData(node, 'in');
        const pct = Math.max(0, Math.min(100, node.params.percent || 0));
        const count = Math.floor(inp.length * pct / 100);
        const mode = node.params.mode || '裁剪';
        if (mode === '裁剪') {
          outputs['out'] = inp.slice(0, inp.length - count);
        } else {
          const start = inp.length - count;
          outputs['out'] = inp.map((v, i) => i >= start ? 0 : v);
        }
        break;
      }
      case 'cutrange': {
        const inp = this.getUpstreamData(node, 'in');
        const startPct = Math.max(0, Math.min(100, node.params.start || 0));
        const endPct = Math.max(0, Math.min(100, node.params.end || 100));
        const startIdx = Math.floor(inp.length * startPct / 100);
        const endIdx = Math.floor(inp.length * endPct / 100);
        const mode = node.params.mode || '裁剪';
        if (mode === '裁剪') {
          outputs['out'] = [...inp.slice(0, startIdx), ...inp.slice(endIdx)];
        } else {
          outputs['out'] = inp.map((v, i) => (i >= startIdx && i < endIdx) ? 0 : v);
        }
        break;
      }
      case 'keeprange': {
        const inp = this.getUpstreamData(node, 'in');
        const startPct = Math.max(0, Math.min(100, node.params.start || 0));
        const endPct = Math.max(0, Math.min(100, node.params.end || 100));
        const startIdx = Math.floor(inp.length * startPct / 100);
        const endIdx = Math.floor(inp.length * endPct / 100);
        const mode = node.params.mode || '裁剪';
        if (mode === '裁剪') {
          outputs['out'] = inp.slice(startIdx, endIdx);
        } else {
          outputs['out'] = inp.map((v, i) => (i >= startIdx && i < endIdx) ? v : 0);
        }
        break;
      }
      case 'avgwin': {
        const inp = this.getUpstreamData(node, 'in');
        const winSize = Math.max(1, Math.floor(node.params.size || 5));
        const half = Math.floor(winSize / 2);
        const out = [];
        for (let i = 0; i < inp.length; i++) {
          let sum = 0, cnt = 0;
          for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < inp.length) { sum += inp[idx]; cnt++; }
          }
          out.push(sum / cnt);
        }
        outputs['out'] = out;
        break;
      }
      case 'avgpool': {
        const inp = this.getUpstreamData(node, 'in');
        const poolSize = Math.max(1, Math.floor(node.params.size || 4));
        const out = [];
        for (let i = 0; i < inp.length; i += poolSize) {
          let sum = 0, cnt = 0;
          for (let j = 0; j < poolSize && i + j < inp.length; j++) { sum += inp[i + j]; cnt++; }
          out.push(sum / cnt);
        }
        outputs['out'] = out;
        break;
      }
      case 'maxpool': {
        const inp = this.getUpstreamData(node, 'in');
        const poolSize = Math.max(1, Math.floor(node.params.size || 4));
        const out = [];
        for (let i = 0; i < inp.length; i += poolSize) {
          let max = -Infinity;
          for (let j = 0; j < poolSize && i + j < inp.length; j++) { if (inp[i + j] > max) max = inp[i + j]; }
          out.push(max);
        }
        outputs['out'] = out;
        break;
      }
      case 'limiter': {
        const inp = this.getUpstreamData(node, 'in');
        const lo = node.params.min !== undefined ? node.params.min : -1;
        const hi = node.params.max !== undefined ? node.params.max : 1;
        outputs['out'] = inp.map(v => Math.max(lo, Math.min(hi, v)));
        break;
      }
      case 'phaseshifter': {
        const inp = this.getUpstreamData(node, 'in');
        const shift = Math.floor(node.params.shift || 0);
        if (shift === 0) {
          outputs['out'] = [...inp];
        } else if (shift > 0) {
          // Right shift: pad with zeros at start
          outputs['out'] = [...new Array(shift).fill(0), ...inp.slice(0, inp.length - shift)];
        } else {
          // Left shift: pad with zeros at end
          const s = -shift;
          outputs['out'] = [...inp.slice(s), ...new Array(s).fill(0)];
        }
        break;
      }
      case 'logmultiplier': {
        const inp = this.getUpstreamData(node, 'in');
        if (!inp.length) { outputs['out'] = []; break; }
        let maxAbs = 0;
        for (const v of inp) { const a = Math.abs(v); if (a > maxAbs) maxAbs = a; }
        if (maxAbs === 0) { outputs['out'] = [...inp]; break; }
        const logMax = Math.log1p(maxAbs);
        const out = inp.map(v => Math.sign(v) * Math.abs(v) * Math.log1p(Math.abs(v)) / logMax);
        const signFlip = out.some((v, i) => inp[i] !== 0 && v !== 0 && Math.sign(v) !== Math.sign(inp[i]));
        if (signFlip) {
          console.error('Log multiplier sign flip', { nodeId: node.id, input: inp, output: out });
          this.toast(`对数乘法器 #${node.id} 符号异常`, 'error');
        }
        outputs['out'] = out;
        break;
      }
      case 'entropy': {
        const inp = this.getUpstreamData(node, 'in');
        const windowSize = Math.max(1, Math.floor(node.params.window || 1));
        const bins = Math.max(1, Math.floor(node.params.bins || 1));
        outputs['out'] = inp.length ? DSP.causalWindowEntropy(inp, windowSize, bins) : [];
        break;
      }
      case 'squarewave': {
        const inp = this.getUpstreamData(node, 'in');
        const windowSize = Math.max(2, Math.floor(node.params.window || 2));
        const thresholdMode = node.params.thresholdMode || '自动';
        const threshold = node.params.threshold !== undefined ? node.params.threshold : 0;
        const minEdges = Math.max(2, Math.floor(node.params.minEdges || 2));
        const metrics = inp.length ? DSP.causalSquareWaveMetrics(inp, windowSize, thresholdMode, threshold, minEdges) : { score: [], period: [], duty: [], jitter: [] };
        outputs['score'] = metrics.score;
        outputs['period'] = metrics.period;
        outputs['duty'] = metrics.duty;
        outputs['jitter'] = metrics.jitter;
        break;
      }
      case 'abs': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.map(v => Math.abs(v));
        break;
      }
      case 'hysteresis': {
        const a = this.getUpstreamData(node, 'a');
        const b = this.getUpstreamData(node, 'b');
        const defaultThresh = node.params.threshold !== undefined ? node.params.threshold : 0.5;
        const hyst = Math.max(0, node.params.hyst !== undefined ? node.params.hyst : 0.1);
        const out = [];
        let state = 0;
        for (let i = 0; i < a.length; i++) {
          const v = a[i] || 0;
          const t = (b.length > 0 && b[i] !== undefined) ? b[i] : defaultThresh;
          if (hyst === 0) {
            state = v > t ? 1 : 0;
          } else {
            if (state === 0 && v > t + hyst) state = 1;
            else if (state === 1 && v < t - hyst) state = 0;
          }
          out.push(state);
        }
        outputs['out'] = out;
        break;
      }
      case 'kalman': {
        const inp = this.getUpstreamData(node, 'in');
        const Q = node.params.q !== undefined ? node.params.q : 0.01;
        const R = node.params.r !== undefined ? node.params.r : 0.1;
        const out = [];
        let x_est = inp.length > 0 ? inp[0] : 0; // initial estimate
        let p_est = 1; // initial error covariance
        for (const z of inp) {
          // Predict
          const x_pred = x_est;
          const p_pred = p_est + Q;
          // Update
          const K = p_pred / (p_pred + R);
          x_est = x_pred + K * (z - x_pred);
          p_est = (1 - K) * p_pred;
          out.push(x_est);
        }
        outputs['out'] = out;
        break;
      }
      case 'dcoffset': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.length ? DSP.dcOffset(inp) : [];
        break;
      }
      case 'differentiator': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.length ? DSP.differentiator(inp) : [];
        break;
      }
      case 'stdwin': {
        const inp = this.getUpstreamData(node, 'in');
        const size = Math.max(2, Math.floor(node.params.size || 16));
        outputs['out'] = inp.length ? DSP.slidingStdDev(inp, size) : [];
        break;
      }
      case 'interval2bpm': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = inp.length ? DSP.intervalToBpm(inp, this.sampleRate) : [];
        break;
      }
      case 'peakdetector': {
        const signal = this.getUpstreamData(node, 'in');
        const trigger = this.getUpstreamData(node, 'in2');
        const outNames = ['out','out2','out3','out4','out5','out6','out7','out8','out9','out10'];
        if (signal.length) {
          const result = DSP.peakValleyDetector(signal, trigger);
          for (const name of outNames) outputs[name] = result[name];
        } else {
          for (const name of outNames) outputs[name] = [];
        }
        break;
      }
      case 'medianwin': {
        const inp = this.getUpstreamData(node, 'in');
        const winSize = Math.max(1, Math.floor(node.params.size || 5));
        const half = Math.floor(winSize / 2);
        const out = [];
        for (let i = 0; i < inp.length; i++) {
          const window = [];
          for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < inp.length) window.push(inp[idx]);
          }
          window.sort((a, b) => a - b);
          out.push(window[Math.floor(window.length / 2)]);
        }
        outputs['out'] = out;
        break;
      }
      case 'maxwin': {
        const inp = this.getUpstreamData(node, 'in');
        const winSize = Math.max(1, Math.floor(node.params.size || 5));
        const half = Math.floor(winSize / 2);
        const out = [];
        for (let i = 0; i < inp.length; i++) {
          let max = -Infinity;
          for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < inp.length && inp[idx] > max) max = inp[idx];
          }
          out.push(max);
        }
        outputs['out'] = out;
        break;
      }
      case 'minwin': {
        const inp = this.getUpstreamData(node, 'in');
        const winSize = Math.max(1, Math.floor(node.params.size || 5));
        const half = Math.floor(winSize / 2);
        const out = [];
        for (let i = 0; i < inp.length; i++) {
          let min = Infinity;
          for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < inp.length && inp[idx] < min) min = inp[idx];
          }
          out.push(min);
        }
        outputs['out'] = out;
        break;
      }
      case 'extremewin': {
        const inp = this.getUpstreamData(node, 'in');
        const winSize = Math.max(1, Math.floor(node.params.size || 5));
        const half = Math.floor(winSize / 2);
        const out = [];
        for (let i = 0; i < inp.length; i++) {
          let extreme = 0, maxAbs = 0;
          for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < inp.length) {
              const a = Math.abs(inp[idx]);
              if (a > maxAbs) { maxAbs = a; extreme = inp[idx]; }
            }
          }
          out.push(extreme);
        }
        outputs['out'] = out;
        break;
      }
      case 'csvoutput': {
        const inp = this.getUpstreamData(node, 'in');
        if (this.shouldExportCsvNode(node, runOptions)) this.downloadCsvOutput(node, inp);
        break;
      }
      case 'probe': {
        const inp = this.getUpstreamData(node, 'in');
        outputs['out'] = [...inp];
        if (this.isInputBlocked(node, 'in')) break;
        const enabled = node.params.enabled !== false;
        if (!enabled) break;
        const name = node._label || node.params.name || `示波器 #${node.id}`;
        const color = node.params.color || this.randomColor();
        this.probeData.set(node.id, { title: name, data: inp, color, nodeId: node.id, axis: this.getSignalAxis(inp) });
        break;
      }
    }

    this.nodeCache.set(node.id, outputs);
  }

  isAutoExportEnabled() {
    return document.getElementById('autoExportCsv')?.checked === true;
  }

  shouldExportCsvNode(node, runOptions) {
    if (runOptions.manualCsvExportNodeId !== undefined) {
      return node.id === runOptions.manualCsvExportNodeId;
    }
    return runOptions.autoExportCsv === true && node.params.autoExport === true;
  }

  exportCsvOutputNode(nodeId) {
    this.run({ manualCsvExportNodeId: nodeId, autoExportCsv: false });
  }

  isConnectionActiveForInputChart(conn) {
    const target = this.nodes.find(n => n.id === conn.toNode);
    if (target && target.type === 'multiplexer' && this.getMultiplexerMode(target) === '多入一出') {
      const match = conn.toPort.match(/^in(\d+)$/);
      if (match) return this.getMultiplexerSelectedRoute(target) === parseInt(match[1]);
    }
    return true;
  }

  isInputSignalVisible(node) {
    return this.connections.some(c =>
      c.fromNode === node.id &&
      c.fromPort === 'out' &&
      this.isConnectionActiveForInputChart(c)
    );
  }

  nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  _sleep(ms) {
    return new Promise((resolve, reject) => {
      const id = setTimeout(resolve, ms);
      if (this._cancelToken) {
        this._cancelToken.signal.addEventListener('abort', () => {
          clearTimeout(id);
          reject(new DOMException('已取消', 'AbortError'));
        }, { once: true });
      }
    });
  }

  async _loadCodeMirror() {
    if (this._cm !== undefined) return this._cm;
    try {
      const [cmMod, jsMod, themeMod] = await Promise.all([
        import('https://esm.sh/codemirror@6.0.1'),
        import('https://esm.sh/@codemirror/lang-javascript@6.2.3'),
        import('https://esm.sh/@codemirror/theme-one-dark@6.1.2')
      ]);
      this._cm = {
        EditorView: cmMod.EditorView,
        basicSetup: cmMod.basicSetup,
        javascript: jsMod.javascript,
        oneDark: themeMod.oneDark
      };
    } catch (e) {
      console.warn('CodeMirror CDN 加载失败，回退到纯文本框:', e.message);
      this._cm = null;
    }
    return this._cm;
  }

  _createCmEditor(container, node, paramId) {
    const cm = this._cm;
    if (!cm) return null;
    try {
      const view = new cm.EditorView({
        doc: node.params[paramId] || '',
        extensions: [
          cm.basicSetup,
          cm.javascript(),
          cm.oneDark,
          cm.EditorView.theme({
            '&': { height: '100%' }
          }),
          cm.EditorView.updateListener.of(update => {
            if (update.docChanged) {
              node.params[paramId] = view.state.doc.toString();
              this.scheduleSave();
            }
          })
        ],
        parent: container
      });
      return view;
    } catch (e) {
      console.warn('CodeMirror 创建失败:', e.message);
      return null;
    }
  }

  showRunProgress(label = '准备运行') {
    if (!this.runProgress) return;
    this.runProgress.classList.add('active');
    this.runProgress.setAttribute('aria-hidden', 'false');
    this.updateRunProgress(0, 1, label);
  }

  updateRunProgress(completed, total, label) {
    const safeTotal = Math.max(1, total || 1);
    const percent = Math.max(0, Math.min(100, completed / safeTotal * 100));
    if (this.runProgressFill) this.runProgressFill.style.width = `${percent}%`;
    if (this.runProgressLabel) this.runProgressLabel.textContent = `${label || '运行中'} ${Math.round(percent)}%`;
  }

  hideRunProgress() {
    if (!this.runProgress) return;
    this.updateRunProgress(1, 1, '运行完成');
    this.runProgress.classList.remove('active');
    this.runProgress.setAttribute('aria-hidden', 'true');
  }

  async run(options = {}) {
    if (this._isRunning) {
      // Re-run cancels current execution
      if (this._cancelToken) { this._cancelToken.abort(); }
      this.toast('已取消，可重新运行', 'info');
      return;
    }
    this._isRunning = true;
    this._cancelToken = new AbortController();
    const cancelSignal = this._cancelToken.signal; // capture locally to survive race with re-run
    const runOptions = {
      autoExportCsv: options.autoExportCsv !== undefined ? options.autoExportCsv : this.isAutoExportEnabled(),
      manualCsvExportNodeId: options.manualCsvExportNodeId
    };

    this.showRunProgress('准备运行');
    await this.nextFrame();

    try {
      this.probeData.clear();
      this.nodeCache.clear();
      this.sampleRate = 1000;

      const inputNodes = this.nodes.filter(n => n.type === 'input');
      if (inputNodes.length === 0) { this.toast('请先添加 CSV 输入节点', 'error'); return; }

      const totalNodes = Math.max(1, this.nodes.length);
      for (const [index, node] of this.nodes.entries()) {
        const isCustom = node.type === 'custom';
        this.updateRunProgress(index, totalNodes, isCustom ? `等待 ${this.getNodeTitle(node)}` : `正在运行 ${this.getNodeTitle(node)}`);
        await this.nextFrame();
        await this.executeNode(node, runOptions);
        if (cancelSignal.aborted) break;
      }
      this.updateRunProgress(totalNodes, totalNodes, '生成图表');
      await this.nextFrame();

      this.renderChart([]);
      this.toast('运行完成', 'success');
    } finally {
      this._isRunning = false;
      this._cancelToken = null;
      this.hideRunProgress();
    }
  }

  // ---- Chart Rendering ----
  renderChart(inputSignals = []) {
    this.chartDataList = []; // { title, data, color, canvas }
    // Preserve zoom/offset across re-runs
    if (!this.chartZoom) this.chartZoom = 1;
    if (!this.chartOffset) this.chartOffset = 0;
    this.cursorX = -1; // -1 = hidden

    const container = this.chartScroll;
    container.innerHTML = '';

    for (const signal of inputSignals) {
      if (signal.data.length > 0) {
        this.addChartItem(container, signal.title, signal.data, signal.color, signal.nodeId, signal.axis);
      }
    }

    // Reorder probes based on saved order
    let orderedProbes = [...this.probeData.values()];
    if (this._savedChartOrder && this._savedChartOrder.length > 0) {
      orderedProbes.sort((a, b) => {
        const ia = this._savedChartOrder.indexOf(a.nodeId);
        const ib = this._savedChartOrder.indexOf(b.nodeId);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
    }
    for (const probe of orderedProbes) {
      if (probe.data.length > 0) {
        this.addChartItem(container, probe.title, probe.data, probe.color, probe.nodeId, probe.axis);
      }
    }

    if (container.children.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:#444;padding:40px 0;font-size:13px;">没有数据可显示</div>';
      requestAnimationFrame(() => this.updateChartScrollbar());
      return;
    }

    // Chart events
    this.initChartEvents();
    requestAnimationFrame(() => this.updateChartScrollbar());
    this.redrawCharts();
  }

  getInputChartTitle(node) {
    return node._label ? `输入信号 - ${node._label}` : (node.params.note ? `输入信号 - ${node.params.note}` : `输入信号 #${node.id}`);
  }

  getInputChartColor(index) {
    const colors = ['#2e86c1', '#16a085', '#f39c12', '#af7ac5', '#e67e22', '#5dade2'];
    return colors[index % colors.length];
  }

  getSignalAxis(signal) {
    if (signal && signal._chartType === 'spectrum') {
      return {
        type: 'spectrum',
        values: signal._xValues || [],
        unit: signal._xUnit || 'Hz',
        label: signal._xLabel ? I18N.t(signal._xLabel) : I18N.t('频率')
      };
    }
    return { type: 'sample', values: null, unit: '', label: I18N.t('采样') };
  }

  getChartVisibilityKey(nodeId, title) {
    return nodeId !== null ? `node:${nodeId}` : `title:${title}`;
  }

  setChartItemVisible(chartItem, visible) {
    chartItem.visible = visible;
    this.chartVisibility.set(chartItem.visibilityKey, visible);
    chartItem.item.classList.toggle('collapsed', !visible);
    chartItem.canvas.style.display = visible ? 'block' : 'none';
    chartItem.readout.style.display = visible ? '' : 'none';
    chartItem.toggle.textContent = visible ? I18N.t('隐藏') : I18N.t('显示');
    chartItem.toggle.title = visible ? I18N.t('隐藏波形') : I18N.t('显示波形');
    this.updateChartScrollbar();
    this.redrawCharts();
    this.scheduleSave();
  }

  addChartItem(container, title, data, color, nodeId = null, axis = this.getSignalAxis(data), visible = true) {
    const item = document.createElement('div');
    item.className = 'chart-item';
    item.draggable = true;
    const visibilityKey = this.getChartVisibilityKey(nodeId, title);
    const resolvedVisible = this.chartVisibility.has(visibilityKey) ? this.chartVisibility.get(visibilityKey) : visible !== false;
    const label = document.createElement('div');
    label.className = 'chart-item-title';
    label.style.cursor = 'grab';
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = color;
    label.appendChild(dot);
    const name = document.createElement('span');
    name.className = 'chart-item-name';
    name.textContent = `${title} (${data.length} 点)`;
    name.title = '点击切换显示/隐藏';
    name.style.cursor = 'pointer';
    label.appendChild(name);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'chart-visibility-toggle';
    toggle.textContent = resolvedVisible ? I18N.t('隐藏') : I18N.t('显示');
    toggle.title = resolvedVisible ? I18N.t('隐藏波形') : I18N.t('显示波形');
    label.appendChild(toggle);
    item.appendChild(label);
    const readout = document.createElement('div');
    readout.className = 'chart-item-readout';
    item.appendChild(readout);
    const canvas = document.createElement('canvas');
    canvas.style.height = '120px';
    canvas.style.display = resolvedVisible ? 'block' : 'none';
    readout.style.display = resolvedVisible ? '' : 'none';
    item.appendChild(canvas);
    const chartItem = { title, data, color, canvas, nodeId, axis, readout, item, toggle, visibilityKey, visible: resolvedVisible };
    item.classList.toggle('collapsed', !resolvedVisible);
    const doToggle = () => this.setChartItemVisible(chartItem, !chartItem.visible);
    toggle.onclick = (e) => { e.stopPropagation(); doToggle(); };
    name.onclick = (e) => { e.stopPropagation(); doToggle(); };

    // Drag reorder
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      item.classList.add('dragging');
      this._dragChartItem = item;
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this._dragChartItem = null;
      // Sync chartDataList order with DOM
      const newOrder = [];
      for (const child of container.children) {
        if (child.classList.contains('chart-item')) {
          const found = this.chartDataList.find(d => d.canvas === child.querySelector('canvas'));
          if (found) newOrder.push(found);
        }
      }
      this.chartDataList = newOrder;
      // Save order for persistence
      this._savedChartOrder = newOrder.map(d => d.nodeId !== null ? d.nodeId : d.title);
      this.scheduleSave();
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const dragging = this._dragChartItem;
      if (!dragging || dragging === item) return;
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        container.insertBefore(dragging, item);
      } else {
        container.insertBefore(dragging, item.nextSibling);
      }
    });

    // Click to navigate to corresponding node
    canvas.addEventListener('click', () => {
      let targetNode = null;
      if (nodeId !== null) {
        targetNode = this.nodes.find(n => n.id === nodeId);
      }
      if (targetNode) this.focusNode(targetNode);
    });

    container.appendChild(item);
    this.chartDataList.push(chartItem);
  }

  focusNode(node) {
    const panelRect = this.canvasPanel.getBoundingClientRect();
    const cx = panelRect.width / 2;
    const cy = panelRect.height / 2;
    // Calculate pan offset to center the node
    this.panOffset.x = cx - (node.x + 100) * this.canvasZoom;
    this.panOffset.y = cy - (node.y + 60) * this.canvasZoom;
    this.applyViewportTransform();
    this.selectNode(node.id);
    this.showCanvasCrosshair(node);
    this.scheduleSave();
  }

  showCanvasCrosshair(node) {
    if (!node || !node.el || !this.canvasFocusCrosshair) return;
    const centerX = (node.x + node.el.offsetWidth / 2) * this.canvasZoom + this.panOffset.x;
    const centerY = (node.y + node.el.offsetHeight / 2) * this.canvasZoom + this.panOffset.y;
    this.canvasFocusCrosshair.style.setProperty('--crosshair-x', `${centerX}px`);
    this.canvasFocusCrosshair.style.setProperty('--crosshair-y', `${centerY}px`);
    clearTimeout(this._canvasCrosshairTimer);
    this.canvasFocusCrosshair.classList.add('active');
    this._canvasCrosshairTimer = setTimeout(() => {
      this.canvasFocusCrosshair.classList.remove('active');
      this._canvasCrosshairTimer = null;
    }, 500);
  }

  initChartScrollbar() {
    if (!this.chartScrollbar || !this.chartScrollbarThumb) return;
    this.chartScrollbar.style.width = '32px';
    this.chartScrollbar.style.flexBasis = '32px';
    this.chartScrollbar.style.minWidth = '32px';
    this.chartScrollbar.style.maxWidth = '32px';
    this._chartScrollbarDragging = false;
    this._chartScrollbarWheel = (e) => {
      e.preventDefault();
      this.chartScroll.scrollTop += e.deltaY;
    };
    this._chartScrollbarMouseMove = (e) => {
      if (!this._chartScrollbarDragging) return;
      const scrollable = this.chartScroll.scrollHeight - this.chartScroll.clientHeight;
      const maxThumbTop = Math.max(1, this.chartScrollbar.clientHeight - this.chartScrollbarThumb.offsetHeight);
      const dy = e.clientY - this._chartScrollbarDragStartY;
      this.chartScroll.scrollTop = this._chartScrollbarDragStartTop + dy * scrollable / maxThumbTop;
    };
    this._chartScrollbarMouseUp = () => {
      this._chartScrollbarDragging = false;
      this.chartScrollbarThumb.classList.remove('dragging');
      document.removeEventListener('mousemove', this._chartScrollbarMouseMove);
      document.removeEventListener('mouseup', this._chartScrollbarMouseUp);
    };
    this.chartScrollbar.addEventListener('wheel', this._chartScrollbarWheel, { passive: false });
    this.chartScrollbar.addEventListener('mousedown', (e) => {
      if (e.target === this.chartScrollbarThumb) return;
      e.preventDefault();
      const rect = this.chartScrollbar.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      this.chartScroll.scrollTop = ratio * (this.chartScroll.scrollHeight - this.chartScroll.clientHeight);
    });
    this.chartScrollbarThumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._chartScrollbarDragging = true;
      this._chartScrollbarDragStartY = e.clientY;
      this._chartScrollbarDragStartTop = this.chartScroll.scrollTop;
      this.chartScrollbarThumb.classList.add('dragging');
      document.addEventListener('mousemove', this._chartScrollbarMouseMove);
      document.addEventListener('mouseup', this._chartScrollbarMouseUp);
    });
    this.chartScroll.addEventListener('scroll', () => this.updateChartScrollbar());
    this.updateChartScrollbar();
  }

  updateChartScrollbar() {
    if (!this.chartScrollbar || !this.chartScrollbarThumb) return;
    const scrollable = this.chartScroll.scrollHeight > this.chartScroll.clientHeight;
    this.chartScrollbar.style.display = 'block';
    this.chartScrollbarThumb.style.display = scrollable ? 'block' : 'none';
    if (!scrollable) return;
    const trackHeight = this.chartScrollbar.clientHeight;
    const thumbHeight = Math.max(36, Math.floor(trackHeight * this.chartScroll.clientHeight / this.chartScroll.scrollHeight));
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const maxScrollTop = Math.max(1, this.chartScroll.scrollHeight - this.chartScroll.clientHeight);
    const thumbTop = this.chartScroll.scrollTop / maxScrollTop * maxThumbTop;
    this.chartScrollbarThumb.style.height = thumbHeight + 'px';
    this.chartScrollbarThumb.style.transform = `translateY(${thumbTop}px)`;
  }

  isPointerOnChartScrollbar(e, scroll) {
    const rect = scroll.getBoundingClientRect();
    const scrollbarWidth = Math.max(44, scroll.offsetWidth - scroll.clientWidth);
    return scroll.scrollHeight > scroll.clientHeight && e.clientX >= rect.right - scrollbarWidth;
  }

  initChartEvents() {
    const scroll = this.chartScroll;
    // Remove old listeners
    if (this._chartWheel) scroll.removeEventListener('wheel', this._chartWheel);
    if (this._chartMouseMove) scroll.removeEventListener('mousemove', this._chartMouseMove);
    if (this._chartMouseLeave) scroll.removeEventListener('mouseleave', this._chartMouseLeave);
    if (this._chartMouseDown) scroll.removeEventListener('mousedown', this._chartMouseDown);

    this._chartDragging = false;
    this._chartDragStart = 0;
    this._chartDragOffset = 0;

    // Zoom with wheel
    this._chartWheel = (e) => {
      if (this.isPointerOnChartScrollbar(e, scroll)) return;
      e.preventDefault();
      const rect = scroll.getBoundingClientRect();
      const mouseXRatio = (e.clientX - rect.left) / rect.width;

      const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      const oldZoom = this.chartZoom;
      this.chartZoom = Math.max(1, Math.min(100, this.chartZoom * zoomFactor));

      const viewW = 1 / oldZoom;
      const viewStart = this.chartOffset;
      const mouseDataPos = viewStart + mouseXRatio * viewW;
      const newViewW = 1 / this.chartZoom;
      this.chartOffset = mouseDataPos - mouseXRatio * newViewW;
      this.chartOffset = Math.max(0, Math.min(1 - newViewW, this.chartOffset));

      this.redrawCharts();
    };
    scroll.addEventListener('wheel', this._chartWheel, { passive: false });

    // Middle button drag to pan chart
    this._chartMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        this._chartDragging = true;
        this._chartDragStart = e.clientX;
        this._chartDragOffset = this.chartOffset;
        scroll.style.cursor = 'grabbing';
      }
    };
    scroll.addEventListener('mousedown', this._chartMouseDown);

    // Cursor + drag
    this._chartMouseMove = (e) => {
      const rect = scroll.getBoundingClientRect();
      this.cursorX = e.clientX - rect.left;

      if (this._chartDragging) {
        const dx = e.clientX - this._chartDragStart;
        const dataPerPx = (1 / this.chartZoom) / rect.width;
        const newOffset = this._chartDragOffset - dx * dataPerPx;
        const viewW = 1 / this.chartZoom;
        this.chartOffset = Math.max(0, Math.min(1 - viewW, newOffset));
      }

      this.redrawCharts();
    };
    scroll.addEventListener('mousemove', this._chartMouseMove);

    this._chartMouseLeave = () => {
      this.cursorX = -1;
      if (this._chartDragging) {
        this._chartDragging = false;
        scroll.style.cursor = '';
      }
      this.redrawCharts();
    };
    scroll.addEventListener('mouseleave', this._chartMouseLeave);

    // Stop drag on mouseup
    this._chartMouseUp = (e) => {
      if (e.button === 1 && this._chartDragging) {
        this._chartDragging = false;
        scroll.style.cursor = '';
      }
    };
    document.addEventListener('mouseup', this._chartMouseUp);
  }

  redrawCharts() {
    for (const item of this.chartDataList) {
      if (item.visible === false) continue;
      this.drawWaveform(item.canvas, item.data, item.color, item.axis);
      this.updateChartItemReadout(item);
    }
  }

  getChartCursorIndex(item) {
    const dw = item.canvas.clientWidth || 1;
    const viewStart = this.chartOffset;
    const viewW = 1 / this.chartZoom;
    const dataIdx = Math.floor((viewStart + (this.cursorX / dw) * viewW) * item.data.length);
    return Math.max(0, Math.min(item.data.length - 1, dataIdx));
  }

  getChartXValue(axis, idx, length) {
    if (axis && axis.values && axis.values[idx] !== undefined) return axis.values[idx];
    return idx;
  }

  formatChartX(axis, x) {
    if (axis && axis.unit === 'Hz') return `频率 ${x.toFixed(2)} Hz`;
    return `采样 #${Math.round(x)}`;
  }

  updateChartItemReadout(item) {
    if (!item.readout || !item.data.length) return;
    if (this.cursorX < 0) {
      const start = this.getChartXValue(item.axis, 0, item.data.length);
      const end = this.getChartXValue(item.axis, item.data.length - 1, item.data.length);
      item.readout.textContent = `${this.formatChartX(item.axis, start)} - ${this.formatChartX(item.axis, end)}`;
      return;
    }
    const idx = this.getChartCursorIndex(item);
    const x = this.getChartXValue(item.axis, idx, item.data.length);
    const value = item.data[idx];
    item.readout.textContent = `${this.formatChartX(item.axis, x)}  幅值 ${value?.toFixed(4) ?? '-'}`;
  }

  drawWaveform(canvas, data, color, axis = this.getSignalAxis(data)) {
    const dpr = window.devicePixelRatio || 1;
    const dw = canvas.clientWidth;
    const dh = canvas.clientHeight;
    canvas.width = dw * dpr;
    canvas.height = dh * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dw, dh);

    if (!data.length) return;

    // View window
    const viewStart = this.chartOffset;
    const viewW = 1 / this.chartZoom;
    const viewEnd = viewStart + viewW;

    const iStart = Math.floor(viewStart * data.length);
    const iEnd = Math.min(data.length, Math.ceil(viewEnd * data.length));
    const visible = data.slice(iStart, iEnd);
    if (!visible.length) return;

    let min = Infinity, max = -Infinity;
    for (const v of visible) { if (v < min) min = v; if (v > max) max = v; }
    const labelMin = min, labelMax = max;
    if (min === max) {
      const padValue = Math.max(Math.abs(min) * 0.1, 1e-6);
      min -= padValue;
      max += padValue;
    }
    const range = max - min;
    const pad = 10;

    // Grid
    ctx.strokeStyle = '#1b2838';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (dh - 2 * pad);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dw, y); ctx.stroke();
    }

    // Center line
    const centerY = dh - pad - ((0 - min) / range) * (dh - 2 * pad);
    if (centerY > pad && centerY < dh - pad) {
      ctx.strokeStyle = '#2a3a4a';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(dw, centerY); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Waveform with min-max downsampling
    const pointsPerPixel = (iEnd - iStart) / dw;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    if (pointsPerPixel <= 1) {
      // Fewer data points than pixels — interpolate exactly
      ctx.beginPath();
      for (let px = 0; px < dw; px++) {
        const ratio = px / dw;
        const dataIdx = iStart + ratio * (iEnd - iStart);
        const idx = Math.max(iStart, Math.min(iEnd - 1, Math.floor(dataIdx)));
        const frac = dataIdx - idx;
        const v0 = data[idx] ?? 0;
        const v1 = data[idx + 1] ?? v0;
        const v = v0 + frac * (v1 - v0);
        const y = dh - pad - ((v - min) / range) * (dh - 2 * pad);
        if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.stroke();
    } else {
      // Many data points per pixel — draw min-max bars with 1-sample overlap
      for (let px = 0; px < dw; px++) {
        const chunkStart = px === 0
          ? Math.floor(iStart + (px / dw) * (iEnd - iStart))
          : Math.floor(iStart + (px / dw) * (iEnd - iStart)) - 1;
        const chunkEnd = Math.floor(iStart + ((px + 1) / dw) * (iEnd - iStart));
        let chunkMin = Infinity, chunkMax = -Infinity;
        for (let j = chunkStart; j < chunkEnd; j++) {
          const v = data[j];
          if (v < chunkMin) chunkMin = v;
          if (v > chunkMax) chunkMax = v;
        }
        if (chunkMin === Infinity) continue;
        const yMin = dh - pad - ((chunkMax - min) / range) * (dh - 2 * pad);
        const yMax = dh - pad - ((chunkMin - min) / range) * (dh - 2 * pad);
        ctx.fillStyle = color;
        ctx.fillRect(px, yMin, 1, Math.max(1, yMax - yMin));
      }
    }

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(labelMax.toFixed(4), 4, 14);
    ctx.fillText(labelMin.toFixed(4), 4, dh - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${this.chartZoom.toFixed(1)}x`, dw - 4, 14);
    this.drawXAxisLabels(ctx, dw, dh, axis, iStart, iEnd, data.length);

    // Cursor line
    if (this.cursorX >= 0 && this.cursorX <= dw) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.cursorX, 0);
      ctx.lineTo(this.cursorX, dh);
      ctx.stroke();
      ctx.setLineDash([]);

      // Value dot
      const ratio = this.cursorX / dw;
      const dataIdx = iStart + ratio * (iEnd - iStart);
      const idx = Math.max(iStart, Math.min(iEnd - 1, Math.floor(dataIdx)));
      const v = data[idx] ?? 0;
      const x = this.getChartXValue(axis, idx, data.length);
      const y = dh - pad - ((v - min) / range) * (dh - 2 * pad);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.cursorX, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      const labelX = this.cursorX + 8 > dw - 40 ? this.cursorX - 48 : this.cursorX + 8;
      ctx.fillText(`${this.formatChartX(axis, x)} ${v.toFixed(3)}`, labelX, y - 6);
    }
  }

  drawXAxisLabels(ctx, dw, dh, axis, iStart, iEnd, length) {
    const startX = this.getChartXValue(axis, iStart, length);
    const endX = this.getChartXValue(axis, Math.max(iStart, iEnd - 1), length);
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.formatChartX(axis, startX), dw * 0.35, dh - 4);
    ctx.textAlign = 'right';
    ctx.fillText(this.formatChartX(axis, endX), dw - 4, dh - 4);
  }

  // ---- Persistence ----
  scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.saveToLocal(), 500);
  }

  serialize() {
    return {
      repo: 'https://github.com/createskyblue/signal-analysis-lab',
      version: 5,
      nodeIdCounter: state.nodeIdCounter,
      sampleRate: this.sampleRate,
      panOffset: { ...this.panOffset },
      canvasZoom: this.canvasZoom || 1,
      autoInterval: parseFloat(document.getElementById('autoInterval').value) || 2,
      autoExportCsv: document.getElementById('autoExportCsv')?.checked === true,
      chartZoom: this.chartZoom || 1,
      chartOffset: this.chartOffset || 0,
      chartOrder: this.chartDataList ? this.chartDataList.map(d => d.nodeId !== null ? d.nodeId : d.title) : [],
      chartVisibility: this.chartVisibility ? Object.fromEntries(this.chartVisibility) : {},
      panelFlex: {
        left: this.canvasPanel.style.flex || '',
        right: document.getElementById('chartPanel').style.flex || ''
      },
      nodes: this.nodes.map(n => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        params: { ...n.params },
        data: n._data || null,
        label: n._label || null
      })),
      connections: this.connections.map(c => ({ ...c }))
    };
  }

  deserialize(json) {
    // Clear current state
    for (const n of this.nodes) { if (n.el) n.el.remove(); }
    this.nodes = [];
    this.connections = [];
    this.probeData.clear();
    this.nodeCache.clear();
    this.selectedNodes.clear();
    this.selectedNode = null;

    state.nodeIdCounter = json.nodeIdCounter || 0;
    this.sampleRate = json.sampleRate || 1000;

    // Restore auto-run interval
    if (json.autoInterval) {
      document.getElementById('autoInterval').value = json.autoInterval;
    }
    document.getElementById('autoExportCsv').checked = json.autoExportCsv === true;

    // Restore chart zoom/offset
    this.chartZoom = json.chartZoom || 1;
    this.chartOffset = json.chartOffset || 0;
    this._savedChartOrder = json.chartOrder || [];
    this.chartVisibility = new Map(Object.entries(json.chartVisibility || {}).map(([key, value]) => [key, value !== false]));

    // Restore pan offset and zoom
    this.panOffset = json.panOffset ? { x: json.panOffset.x || 0, y: json.panOffset.y || 0 } : { x: 0, y: 0 };
    this.canvasZoom = json.canvasZoom || 1;

    // Restore panel sizes
    if (json.panelFlex) {
      if (json.panelFlex.left) this.canvasPanel.style.flex = json.panelFlex.left;
      if (json.panelFlex.right) document.getElementById('chartPanel').style.flex = json.panelFlex.right;
    }

    // Restore nodes
    for (const nd of json.nodes) {
      const def = NODE_DEFS[nd.type];
      if (!def) continue;
      const node = { id: nd.id, type: nd.type, def, x: nd.x, y: nd.y, params: {}, _data: null, _label: nd.label || null, el: null };
      def.params.forEach(p => { node.params[p.id] = nd.params[p.id] !== undefined ? this.cloneParamValue(nd.params[p.id]) : this.cloneParamValue(p.default); });
      this.applyLegacyParamMigration(node, nd.params);
      if (nd.data) node._data = nd.data;
      if (nd.id >= state.nodeIdCounter) state.nodeIdCounter = nd.id + 1;
      this.nodes.push(node);
      this.renderNode(node);
      // Restore file label
      if (nd.data && nd.type === 'input') {
        const lbl = document.getElementById(`fileLabel-${node.id}`);
        if (lbl) lbl.textContent = `已加载 ${nd.data.length} 点`;
      }
    }

    // Apply viewport transform
    this.applyViewportTransform();

    // Restore connections
    this.connections = json.connections || [];
    // Update all port positions before rendering connections
    for (const node of this.nodes) this.updatePortPositions(node);
    this.renderConnections();
    this.resize();
    this.updateEmptyHint();
  }

  saveToLocal() {
    try {
      localStorage.setItem('filter-lab-project', JSON.stringify(this.serialize()));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadFromLocal() {
    try {
      const raw = localStorage.getItem('filter-lab-project');
      if (!raw) return false;
      const json = JSON.parse(raw);
      if (!json.nodes) return false;
      this.deserialize(json);
      return true;
    } catch (e) {
      console.warn('Load failed:', e);
      return false;
    }
  }

  copyContext() {
    const raw = this.serialize();
    const slim = {
      repo: raw.repo,
      version: raw.version,
      sampleRate: raw.sampleRate,
      nodes: raw.nodes.map(n => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        params: n.params,
        label: n.label || null
      })),
      connections: raw.connections
    };
    const text = `<信号分析实验室>\n用户正在使用「信号处理实验室」——一个基于浏览器的可视化信号处理工具。\n下面是用户的项目上下文，请基于此帮用户分析和处理问题。\n\n## 仓库地址\nhttps://github.com/createskyblue/signal-analysis-lab\n\n## 当前流程图\n\`\`\`json\n${JSON.stringify(slim, null, 2)}\n\`\`\`\n\n## 自定义节点 API\n代码运行在 async 函数体内，支持 await。\n\n可用变量：\n  signal    — number[], 第一个输入端口的数组\n  inputs    — { in, in2, ... }, 所有输入端口的对象\n  sampleRate — number, 采样率 (Hz)\n  sleep(ms) — async 函数, 暂停 ms（取消时抛 AbortError）\n  aborted() — 返回 boolean, 是否已取消执行\n\n返回值：\n  单输出 → return number[]\n  多输出 → return { out: number[], out2: number[], ... }\n  不要 return Promise 对象\n</信号分析实验室>`;
    navigator.clipboard.writeText(text).then(() => {
      this.toast('上下文已复制到剪贴板', 'success');
    }).catch(() => {
      this.toast('复制失败，请重试', 'error');
    });
  }

  exportProject() {
    const data = JSON.stringify(this.serialize(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `信号处理实验室_${this.formatTimestamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('项目已导出', 'success');
  }

  importProject(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (!json.nodes) throw new Error('无效的项目文件');
        this.deserialize(json);
        this.saveToLocal();
        this.toast('项目已导入', 'success');
      } catch (err) {
        this.toast('导入失败: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
}

export default App;

