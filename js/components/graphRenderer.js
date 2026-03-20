/* =============================================================
   ExMnotes — Graph Renderer (Vanilla force-directed SVG)
   Verlet integration, Coulomb repulsion, Hooke spring
   ============================================================= */

const SVG_NS = 'http://www.w3.org/2000/svg';

const STAGE_RADIUS = { seed: 18, sprout: 22, mature: 26 };
const REPULSION    = 4000;
const SPRING_K     = 0.04;
const SPRING_LEN   = 120;
const DAMPING      = 0.88;
const MIN_ENERGY   = 0.008;

export class GraphRenderer {
  /**
   * @param {SVGElement} svgEl
   * @param {{ nodes: import('../data/schema.js').Note[], edges: import('../data/schema.js').Connection[] }} data
   * @param {{ onNodeClick?: Function, onNodeDblClick?: Function }} opts
   */
  constructor(svgEl, data, opts = {}) {
    this.svg   = svgEl;
    this.opts  = opts;
    this.nodes = [];
    this.edges = [];
    this._raf  = null;
    this._filterTagId = null;
    this._selectedId  = null;
    this._transform   = { x: 0, y: 0, scale: 1 };
    this._pan = { active: false, lastX: 0, lastY: 0 };
    this._pinch = { active: false, lastDist: 0 };

    this._edgeGroup = document.createElementNS(SVG_NS, 'g');
    this._edgeGroup.setAttribute('class', 'edge-group');
    this._nodeGroup = document.createElementNS(SVG_NS, 'g');
    this._nodeGroup.setAttribute('class', 'node-group');
    this._rootGroup = document.createElementNS(SVG_NS, 'g');
    this._rootGroup.appendChild(this._edgeGroup);
    this._rootGroup.appendChild(this._nodeGroup);
    this.svg.appendChild(this._rootGroup);

    this.setData(data);
    this._bindGestures();
  }

  /* ── Data ── */
  setData({ nodes, edges }) {
    const existing = Object.fromEntries(this.nodes.map((n) => [n.id, n]));
    const W = this.svg.clientWidth  || 400;
    const H = this.svg.clientHeight || 600;

    this.nodes = nodes.map((n) => ({
      ...n,
      x:  existing[n.id]?.x ?? W / 2 + (Math.random() - 0.5) * 200,
      y:  existing[n.id]?.y ?? H / 2 + (Math.random() - 0.5) * 200,
      vx: existing[n.id]?.vx ?? 0,
      vy: existing[n.id]?.vy ?? 0,
      dragging: false,
    }));
    this.edges = edges;
    this._buildDOM();
    this._startSim();
  }

  setFilter(tagId) {
    this._filterTagId = tagId;
    this._updateVisibility();
  }

  /* ── DOM construction ── */
  _buildDOM() {
    this._edgeGroup.innerHTML = '';
    this._nodeGroup.innerHTML = '';
    this._domEdges = new Map();
    this._domNodes = new Map();

    // Edges
    for (const e of this.edges) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'graph-edge');
      this._edgeGroup.appendChild(line);
      this._domEdges.set(e.id, { line, edge: e });
    }

    // Nodes
    for (const n of this.nodes) {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', `graph-node ${n.stage || 'seed'}`);
      g.setAttribute('data-id', n.id);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', n.title);

      const r = STAGE_RADIUS[n.stage] || 18;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('class', 'graph-node-circle');
      circle.setAttribute('r', r);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('class', 'graph-node-label');
      text.setAttribute('dy', r + 14);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = n.title.length > 16 ? n.title.slice(0, 15) + '…' : n.title;

      g.appendChild(circle);
      g.appendChild(text);
      this._nodeGroup.appendChild(g);
      this._domNodes.set(n.id, { g, circle, text, node: n });

      this._bindNodeEvents(g, n);
    }
  }

  _bindNodeEvents(g, nodeData) {
    let tapTimer = null;
    let tapCount = 0;
    let dragMoved = false;
    let startX = 0, startY = 0;
    let nodeRef = () => this.nodes.find((n) => n.id === nodeData.id);

    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      dragMoved = false;
      const n = nodeRef();
      if (!n) return;
      n.dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      g.setPointerCapture(e.pointerId);
    });

    g.addEventListener('pointermove', (e) => {
      const n = nodeRef();
      if (!n?.dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true;
      const rect = this.svg.getBoundingClientRect();
      n.x = (e.clientX - rect.left - this._transform.x) / this._transform.scale;
      n.y = (e.clientY - rect.top  - this._transform.y) / this._transform.scale;
      n.vx = 0; n.vy = 0;
      this._renderFrame();
    });

    g.addEventListener('pointerup', (e) => {
      const n = nodeRef();
      if (n) n.dragging = false;
      if (!dragMoved) {
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            tapCount = 0;
            this._selectNode(nodeData.id);
            this.opts.onNodeClick?.(nodeData);
          }, 300);
        } else {
          clearTimeout(tapTimer);
          tapCount = 0;
          this.opts.onNodeDblClick?.(nodeData);
        }
      }
    });

    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.opts.onNodeClick?.(nodeData);
    });
  }

  _selectNode(id) {
    this._selectedId = id;
    this._domNodes.forEach(({ g }, nid) => {
      g.classList.toggle('selected', nid === id);
    });
    this._highlightEdges(id);
  }

  _highlightEdges(id) {
    this._domEdges.forEach(({ line, edge }) => {
      const connected = edge.from === id || edge.to === id;
      line.classList.toggle('highlighted', connected);
    });
  }

  _updateVisibility() {
    this._domNodes.forEach(({ g }, nid) => {
      const n = this.nodes.find((x) => x.id === nid);
      if (!n) return;
      const visible = !this._filterTagId || n.tags.includes(this._filterTagId);
      g.style.opacity = visible ? '1' : '0.12';
    });
  }

  /* ── Physics simulation ── */
  _startSim() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._energy = Infinity;
    this._tick();
  }

  _tick() {
    if (this._energy < MIN_ENERGY) {
      this._raf = null;
      return;
    }
    this._stepPhysics();
    this._renderFrame();
    this._raf = requestAnimationFrame(() => this._tick());
  }

  _stepPhysics() {
    const nodes = this.nodes;
    let totalEnergy = 0;

    // Reset forces
    for (const n of nodes) { n.fx = 0; n.fy = 0; }

    // Repulsion (N-body)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x || 0.001;
        const dy = b.y - a.y || 0.001;
        const d2 = dx * dx + dy * dy;
        const d  = Math.sqrt(d2) || 0.001;
        const f  = REPULSION / d2;
        a.fx -= f * dx / d;
        a.fy -= f * dy / d;
        b.fx += f * dx / d;
        b.fy += f * dy / d;
      }
    }

    // Spring attraction (edges)
    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
    for (const e of this.edges) {
      const a = nodeMap[e.from], b = nodeMap[e.to];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const f  = SPRING_K * (d - SPRING_LEN);
      a.fx += f * dx / d;
      a.fy += f * dy / d;
      b.fx -= f * dx / d;
      b.fy -= f * dy / d;
    }

    // Center gravity
    const W = this.svg.clientWidth  || 400;
    const H = this.svg.clientHeight || 600;
    const cx = W / 2, cy = H / 2;
    for (const n of nodes) {
      n.fx += (cx - n.x) * 0.006;
      n.fy += (cy - n.y) * 0.006;
    }

    // Integrate
    for (const n of nodes) {
      if (n.dragging) continue;
      n.vx = (n.vx + n.fx) * DAMPING;
      n.vy = (n.vy + n.fy) * DAMPING;
      n.x  += n.vx;
      n.y  += n.vy;
      totalEnergy += n.vx * n.vx + n.vy * n.vy;
    }
    this._energy = totalEnergy;
  }

  _renderFrame() {
    const T = this._transform;
    this._rootGroup.setAttribute('transform', `translate(${T.x},${T.y}) scale(${T.scale})`);

    const nodeMap = Object.fromEntries(this.nodes.map((n) => [n.id, n]));

    // Update edges
    this._domEdges.forEach(({ line, edge }) => {
      const a = nodeMap[edge.from], b = nodeMap[edge.to];
      if (!a || !b) return;
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    });

    // Update nodes
    this._domNodes.forEach(({ g }, nid) => {
      const n = nodeMap[nid];
      if (!n) return;
      g.setAttribute('transform', `translate(${n.x},${n.y})`);
    });
  }

  /* ── Pan & Zoom ── */
  _bindGestures() {
    const svg = this.svg;

    // Pointer pan
    svg.addEventListener('pointerdown', (e) => {
      if (e.target !== svg && e.target !== this._rootGroup &&
          !e.target.classList.contains('edge-group')) return;
      this._pan.active = true;
      this._pan.lastX  = e.clientX;
      this._pan.lastY  = e.clientY;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!this._pan.active) return;
      const dx = e.clientX - this._pan.lastX;
      const dy = e.clientY - this._pan.lastY;
      this._transform.x += dx;
      this._transform.y += dy;
      this._pan.lastX = e.clientX;
      this._pan.lastY = e.clientY;
      this._renderFrame();
    });
    svg.addEventListener('pointerup', () => { this._pan.active = false; });

    // Wheel zoom
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      this._zoom(factor, e.clientX, e.clientY);
    }, { passive: false });

    // Pinch zoom (touch)
    let touches = {};
    svg.addEventListener('touchstart', (e) => {
      [...e.changedTouches].forEach((t) => { touches[t.identifier] = { x: t.clientX, y: t.clientY }; });
    }, { passive: true });
    svg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const [a, b] = [...e.touches];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (this._pinch.active) {
          const factor = dist / this._pinch.lastDist;
          const cx = (a.clientX + b.clientX) / 2;
          const cy = (a.clientY + b.clientY) / 2;
          this._zoom(factor, cx, cy);
        }
        this._pinch.active = true;
        this._pinch.lastDist = dist;
      }
    }, { passive: false });
    svg.addEventListener('touchend', () => {
      if ([...document.querySelectorAll(':active')].length < 2) this._pinch.active = false;
    }, { passive: true });
  }

  _zoom(factor, cx, cy) {
    const rect = this.svg.getBoundingClientRect();
    const mx = cx - rect.left;
    const my = cy - rect.top;
    const newScale = Math.max(0.2, Math.min(4, this._transform.scale * factor));
    const scaleChange = newScale / this._transform.scale;
    this._transform.x = mx - scaleChange * (mx - this._transform.x);
    this._transform.y = my - scaleChange * (my - this._transform.y);
    this._transform.scale = newScale;
    this._renderFrame();
  }

  /* ── Controls ── */
  recenter() {
    const W = this.svg.clientWidth  || 400;
    const H = this.svg.clientHeight || 600;
    this._transform = { x: W * 0.1, y: H * 0.1, scale: 0.85 };
    this._renderFrame();
  }

  reheat() {
    for (const n of this.nodes) {
      n.vx += (Math.random() - 0.5) * 10;
      n.vy += (Math.random() - 0.5) * 10;
    }
    this._energy = Infinity;
    this._startSim();
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this.svg.innerHTML = '';
  }
}
