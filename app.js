/**
 * Uniform-Cost Search (UCS) Visualizer
 * Core Algorithm, Min-Heap, Vis-Network Canvas, Step-by-Step Engine, and UI Controller
 */

// =============================================================================
// 1. Binary Min-Heap Priority Queue Implementation
// =============================================================================
class MinHeapPriorityQueue {
  constructor() {
    this.heap = [];
    this.counter = 0; // Ensures stable FIFO tie-breaking for equal costs
  }

  push(cost, node, parent = null) {
    const item = {
      cost: Number(cost),
      counter: this.counter++,
      node: String(node),
      parent: parent !== null ? String(parent) : null,
      id: `${node}_${cost}_${this.counter}`
    };
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._bubbleDown(0);
    }
    return min;
  }

  peek() {
    return this.isEmpty() ? null : this.heap[0];
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  // Returns a sorted shallow copy for UI display
  getItemsSorted() {
    return [...this.heap].sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.counter - b.counter;
    });
  }

  _bubbleUp(index) {
    const item = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this._compare(item, parent) >= 0) break;
      this.heap[index] = parent;
      index = parentIdx;
    }
    this.heap[index] = item;
  }

  _bubbleDown(index) {
    const length = this.heap.length;
    const item = this.heap[index];
    while (true) {
      let leftIdx = 2 * index + 1;
      let rightIdx = 2 * index + 2;
      let swapIdx = null;

      if (leftIdx < length) {
        if (this._compare(this.heap[leftIdx], item) < 0) {
          swapIdx = leftIdx;
        }
      }

      if (rightIdx < length) {
        const compareTarget = swapIdx === null ? item : this.heap[leftIdx];
        if (this._compare(this.heap[rightIdx], compareTarget) < 0) {
          swapIdx = rightIdx;
        }
      }

      if (swapIdx === null) break;
      this.heap[index] = this.heap[swapIdx];
      index = swapIdx;
    }
    this.heap[index] = item;
  }

  _compare(a, b) {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.counter - b.counter;
  }
}


// =============================================================================
// 2. Graph Data Structure & Breadth-First Search (Fewest Hops)
// =============================================================================
class GraphData {
  constructor() {
    this.nodes = new Set();
    this.edges = []; // Array of { id, from, to, weight, directed }
  }

  addNode(name) {
    const trimmed = String(name).trim();
    if (trimmed) {
      this.nodes.add(trimmed);
    }
  }

  removeNode(name) {
    this.nodes.delete(name);
    this.edges = this.edges.filter(e => e.from !== name && e.to !== name);
  }

  addEdge(from, to, weight, directed = true) {
    this.addNode(from);
    this.addNode(to);
    const id = `${from}->${to}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    this.edges.push({
      id,
      from: String(from),
      to: String(to),
      weight: parseFloat(weight),
      directed: Boolean(directed)
    });
    return id;
  }

  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
  }

  clear() {
    this.nodes.clear();
    this.edges = [];
  }

  validateNonNegative() {
    const negativeEdges = this.edges.filter(e => e.weight < 0);
    const invalidEdges = this.edges.filter(e => !Number.isFinite(e.weight));
    return {
      isValid: negativeEdges.length === 0 && invalidEdges.length === 0,
      negativeEdges,
      invalidEdges
    };
  }

  getAdjacencyList() {
    const adj = {};
    for (const node of this.nodes) {
      adj[node] = [];
    }
    for (const edge of this.edges) {
      if (!adj[edge.from]) adj[edge.from] = [];
      adj[edge.from].push({ to: edge.to, weight: edge.weight, edgeId: edge.id });

      if (!edge.directed) {
        if (!adj[edge.to]) adj[edge.to] = [];
        adj[edge.to].push({ to: edge.from, weight: edge.weight, edgeId: edge.id });
      }
    }
    return adj;
  }

  // BFS to calculate the Fewest-Hops path and its total cost
  computeFewestHopsPath(start, goal) {
    if (!this.nodes.has(start) || !this.nodes.has(goal)) return null;
    const adj = this.getAdjacencyList();
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      if (node === goal) {
        // Compute path cost using the graph edges
        let totalCost = 0;
        const edgeIds = [];
        for (let i = 0; i < path.length - 1; i++) {
          const u = path[i];
          const v = path[i + 1];
          const candidates = (adj[u] || []).filter(e => e.to === v);
          if (candidates.length > 0) {
            // Pick lowest edge between u and v if multiple
            candidates.sort((a, b) => a.weight - b.weight);
            totalCost += candidates[0].weight;
            edgeIds.push(candidates[0].edgeId);
          }
        }
        return {
          path,
          hops: path.length - 1,
          cost: totalCost,
          edgeIds
        };
      }

      for (const neighbor of (adj[node] || [])) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          queue.push([...path, neighbor.to]);
        }
      }
    }
    return null;
  }
}


// =============================================================================
// 3. Predefined Test Scenarios (1-Click Loaders)
// =============================================================================
const PRESETS = {
  1: {
    name: "Expensive Direct vs. Cheap Indirect Route (Main Demo)",
    start: "Start",
    goal: "Goal",
    description: "Start -> Goal has 1 edge with high cost (10), while Start -> A -> B -> Goal has 3 edges with lower total cost (2 + 2 + 2 = 6). Proves fewest edges != lowest cost!",
    build: (graph) => {
      graph.clear();
      // Expensive 1-hop direct edge
      graph.addEdge("Start", "Goal", 10.0, true);
      // Cheap 3-hop indirect path (2+2+2 = 6)
      graph.addEdge("Start", "A", 2.0, true);
      graph.addEdge("A", "B", 2.0, true);
      graph.addEdge("B", "Goal", 2.0, true);
      // Distractor path (4+5 = 9)
      graph.addEdge("Start", "C", 4.0, true);
      graph.addEdge("C", "Goal", 5.0, true);
    }
  },
  2: {
    name: "Equal-Cost Routes",
    start: "Start",
    goal: "Goal",
    description: "Two distinct paths with the exact same minimum cost: Route Alpha (3 + 4 = 7) and Route Beta (5 + 2 = 7). UCS returns one optimal route deterministically.",
    build: (graph) => {
      graph.clear();
      graph.addEdge("Start", "Alpha", 3.0, true);
      graph.addEdge("Alpha", "Goal", 4.0, true); // Total 7
      graph.addEdge("Start", "Beta", 5.0, true);
      graph.addEdge("Beta", "Goal", 2.0, true);  // Total 7
      graph.addEdge("Start", "Distractor", 8.0, true);
      graph.addEdge("Distractor", "Goal", 3.0, true); // Total 11
    }
  },
  3: {
    name: "Disconnected Graph",
    start: "Start",
    goal: "Goal",
    description: "Start and Goal exist in completely disjoint components. Priority queue exhausts without reaching Goal, triggering clean unreachable status.",
    build: (graph) => {
      graph.clear();
      graph.addEdge("Start", "Island1_A", 2.5, true);
      graph.addEdge("Island1_A", "Island1_B", 3.0, true);
      graph.addEdge("Island1_B", "Start", 1.5, true);
      // Disconnected Goal component
      graph.addNode("Goal");
      graph.addEdge("Island2_X", "Goal", 4.0, true);
      graph.addEdge("Goal", "Island2_Y", 2.0, true);
    }
  },
  4: {
    name: "Zero-Cost Edge",
    start: "Start",
    goal: "Goal",
    description: "Graph contains edges with weight 0 (FreeExpressway). UCS handles cost 0 accurately without infinite loops or division issues.",
    build: (graph) => {
      graph.clear();
      graph.addEdge("Start", "FreeExpress", 0.0, true); // Weight 0!
      graph.addEdge("FreeExpress", "Goal", 4.0, true);  // Total = 4
      graph.addEdge("Start", "Standard_A", 2.0, true);
      graph.addEdge("Standard_A", "Goal", 3.0, true);   // Total = 5
      graph.addEdge("Start", "Goal", 7.0, true);        // Direct = 7
    }
  },
  5: {
    name: "Negative Edge Weight (Validation Error Case)",
    start: "Start",
    goal: "Goal",
    description: "Contains negative weight (A -> B = -3). Rejection validation triggers immediately, showing error banner and preventing search run.",
    build: (graph) => {
      graph.clear();
      graph.addEdge("Start", "Node_A", 4.0, true);
      graph.addEdge("Node_A", "Node_B", -3.0, true); // Negative weight!
      graph.addEdge("Node_B", "Goal", 2.0, true);
      graph.addEdge("Start", "Goal", 8.0, true);
    }
  }
};


// =============================================================================
// 4. Uniform-Cost Search Step Generator (Micro-Step Snapshot Engine)
// =============================================================================
function generateUCSSteps(graph, startNode, goalNode) {
  const steps = [];

  // Validation
  const validation = graph.validateNonNegative();
  if (!validation.isValid) {
    const reasons = [];
    if (validation.negativeEdges.length > 0) {
      reasons.push(`Negative edge weight detected: ${validation.negativeEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join(", ")}. UCS strictly requires non-negative weights.`);
    }
    if (validation.invalidEdges.length > 0) {
      reasons.push(`Invalid edge weight detected: ${validation.invalidEdges.map(e => `${e.from} -> ${e.to}`).join(", ")}. Edge weights must be finite numbers.`);
    }
    return {
      success: false,
      error: reasons.join(" "),
      steps: []
    };
  }

  if (!graph.nodes.has(startNode)) {
    return { success: false, error: `Start node '${startNode}' not found in graph.`, steps: [] };
  }
  if (!graph.nodes.has(goalNode)) {
    return { success: false, error: `Goal node '${goalNode}' not found in graph.`, steps: [] };
  }

  const adj = graph.getAdjacencyList();
  const pq = new MinHeapPriorityQueue();
  pq.push(0, startNode, null);

  const dist = { [startNode]: 0 };
  const parent = { [startNode]: null };
  const visited = new Set();
  const finalizedCosts = {};
  let staleSkips = 0;

  // Helper to deep snapshot state
  const snapshot = (type, details) => {
    return {
      stepIndex: steps.length,
      type,
      headline: details.headline || "",
      subtext: details.subtext || "",
      currentNode: details.currentNode || null,
      currentEdge: details.currentEdge || null,
      poppedItem: details.poppedItem ? { ...details.poppedItem } : null,
      isStale: Boolean(details.isStale),
      staleSkips,
      pqState: pq.getItemsSorted(),
      visitedSet: Array.from(visited),
      finalizedCosts: { ...finalizedCosts },
      distMap: { ...dist },
      parentMap: { ...parent },
      optimalPath: details.optimalPath || null,
      optimalEdges: details.optimalEdges || null,
      totalCost: details.totalCost !== undefined ? details.totalCost : null,
      hops: details.hops !== undefined ? details.hops : null,
      isFinished: Boolean(details.isFinished),
      isSuccess: details.isSuccess !== undefined ? details.isSuccess : null
    };
  };

  // Step 0: Initialization
  steps.push(snapshot("INIT", {
    headline: `Initialized Search from '${startNode}'`,
    subtext: `Pushed start node (${startNode}, cost=0) into Min-Heap Priority Queue. Target Goal: '${goalNode}'.`,
    currentNode: startNode
  }));

  // Main UCS Loop
  while (!pq.isEmpty()) {
    const popped = pq.pop();

    // Check Stale Entry
    if (visited.has(popped.node) || popped.cost > dist[popped.node]) {
      staleSkips++;
      const finalizedCost = finalizedCosts[popped.node];
      const bestKnownCost = dist[popped.node];
      steps.push(snapshot("STALE_SKIP", {
        headline: `⏩ Stale Entry Skipped: Node '${popped.node}'`,
        subtext: `Popped (${popped.node}, cost=${popped.cost}), but the best known cost is ${finalizedCost !== undefined ? `finalized at ${finalizedCost}` : bestKnownCost}. Discarded.`,
        poppedItem: popped,
        isStale: true,
        currentNode: popped.node
      }));
      continue;
    }

    // Finalize Node
    visited.add(popped.node);
    finalizedCosts[popped.node] = popped.cost;

    steps.push(snapshot("POP_EXPAND", {
      headline: `⭐ Expanding Node '${popped.node}' (Cost g(n) = ${popped.cost})`,
      subtext: `Lowest-cost entry popped from Priority Queue. Marked '${popped.node}' as finalized (closed).`,
      poppedItem: popped,
      currentNode: popped.node
    }));

    // Goal Check (performed when goal node is popped from Min-Heap)
    if (popped.node === goalNode) {
      // Reconstruct Path
      const path = [];
      let curr = goalNode;
      while (curr !== null) {
        path.push(curr);
        curr = parent[curr];
      }
      path.reverse();

      // Find the edge IDs for the optimal path
      const optimalEdges = [];
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edgeCandidates = (adj[u] || []).filter(e => e.to === v);
        if (edgeCandidates.length > 0) {
          edgeCandidates.sort((a, b) => a.weight - b.weight);
          optimalEdges.push(edgeCandidates[0].edgeId);
        }
      }

      steps.push(snapshot("GOAL_REACHED", {
        headline: `🎯 Goal Node '${goalNode}' Reached! Optimal Path Finalized.`,
        subtext: `Goal popped with minimal cumulative cost g(Goal) = ${popped.cost}. Optimal path reconstructed using parent pointers.`,
        poppedItem: popped,
        currentNode: goalNode,
        optimalPath: path,
        optimalEdges,
        totalCost: popped.cost,
        hops: path.length - 1,
        isFinished: true,
        isSuccess: true
      }));

      return { success: true, steps, optimalPath: path, totalCost: popped.cost };
    }

    // Explore / Relax Neighbors
    const neighbors = adj[popped.node] || [];
    if (neighbors.length === 0) {
      steps.push(snapshot("NO_NEIGHBORS", {
        headline: `Node '${popped.node}' has no outgoing edges`,
        subtext: `No unvisited neighbors to explore from this node. Moving to next queue entry.`,
        currentNode: popped.node
      }));
    }

    for (const edge of neighbors) {
      const neighbor = edge.to;
      const weight = edge.weight;

      if (visited.has(neighbor)) {
        steps.push(snapshot("NEIGHBOR_ALREADY_FINALIZED", {
          headline: `Neighbor '${neighbor}' Already Finalized`,
          subtext: `Edge '${popped.node}' -> '${neighbor}' (w=${weight}) skipped because '${neighbor}' is already closed with finalized cost ${finalizedCosts[neighbor]}.`,
          currentNode: popped.node,
          currentEdge: edge.edgeId
        }));
        continue;
      }

      const newCost = popped.cost + weight;

      if (dist[neighbor] === undefined || newCost < dist[neighbor]) {
        const oldCostStr = dist[neighbor] !== undefined ? dist[neighbor] : "∞";
        dist[neighbor] = newCost;
        parent[neighbor] = popped.node;
        pq.push(newCost, neighbor, popped.node);

        steps.push(snapshot("RELAX_EDGE", {
          headline: `✨ Relaxed Path to '${neighbor}': New Cost ${newCost}`,
          subtext: `Path via '${popped.node}' has cost ${popped.cost} + ${weight} = ${newCost} (improved from ${oldCostStr}). Pushed (${newCost}, ${neighbor}) into Priority Queue.`,
          currentNode: popped.node,
          currentEdge: edge.edgeId
        }));
      } else {
        steps.push(snapshot("SKIP_SUBOPTIMAL_PATH", {
          headline: `Suboptimal Path to '${neighbor}' Ignored`,
          subtext: `Path via '${popped.node}' costs ${newCost}, which is not cheaper than best known cost (${dist[neighbor]}). No update.`,
          currentNode: popped.node,
          currentEdge: edge.edgeId
        }));
      }
    }
  }

  // Priority Queue exhausted without reaching Goal
  steps.push(snapshot("UNREACHABLE", {
    headline: `❌ Destination Unreachable: '${goalNode}'`,
    subtext: `Priority Queue is empty. No path connects Start '${startNode}' to Goal '${goalNode}'.`,
    isFinished: true,
    isSuccess: false,
    totalCost: Infinity,
    hops: 0
  }));

  return { success: false, steps, optimalPath: null, totalCost: Infinity };
}


// =============================================================================
// 5. Vis.js Network Canvas Visual Manager
// =============================================================================
class NetworkVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.nodesDataSet = new vis.DataSet();
    this.edgesDataSet = new vis.DataSet();
    this.network = null;
    this.physicsEnabled = true;
    this.initNetwork();
  }

  initNetwork() {
    const data = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet
    };

    const options = {
      nodes: {
        shape: "box",
        margin: { top: 10, bottom: 10, left: 14, right: 14 },
        font: {
          color: "#ffffff",
          size: 14,
          face: "Inter, Segoe UI, sans-serif",
          bold: { color: "#ffffff", size: 14, face: "Inter" }
        },
        borderWidth: 2,
        shadow: { enabled: true, color: "rgba(0,0,0,0.4)", size: 8, x: 2, y: 3 }
      },
      edges: {
        arrows: {
          to: { enabled: true, scaleFactor: 0.85 }
        },
        font: {
          color: "#f3f4f6",
          size: 12,
          face: "JetBrains Mono, monospace",
          background: "rgba(17, 24, 39, 0.85)",
          strokeWidth: 0,
          align: "horizontal"
        },
        color: {
          color: "#475569",
          highlight: "#38bdf8",
          hover: "#94a3b8"
        },
        smooth: {
          type: "curvedCW",
          roundness: 0.15
        },
        width: 2
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -70,
          centralGravity: 0.015,
          springLength: 130,
          springConstant: 0.08,
          damping: 0.4
        },
        stabilization: { iterations: 120 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        selectConnectedEdges: false
      }
    };

    this.network = new vis.Network(this.container, data, options);
  }

  togglePhysics() {
    this.physicsEnabled = !this.physicsEnabled;
    this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
    return this.physicsEnabled;
  }

  fitView() {
    this.network.fit({ animation: { duration: 500, easingFunction: "easeInOutQuad" } });
  }

  // Load GraphData into Vis.js DataSet
  loadGraph(graphData, startNode, goalNode) {
    this.nodesDataSet.clear();
    this.edgesDataSet.clear();

    const nodesToAdd = [];
    for (const node of graphData.nodes) {
      nodesToAdd.push(this.formatNodeData(node, startNode, goalNode));
    }
    this.nodesDataSet.add(nodesToAdd);

    const edgesToAdd = [];
    for (const edge of graphData.edges) {
      edgesToAdd.push(this.formatEdgeData(edge));
    }
    this.edgesDataSet.add(edgesToAdd);

    this.fitView();
  }

  formatNodeData(node, startNode, goalNode, state = {}) {
    const isStart = node === startNode;
    const isGoal = node === goalNode;

    let bgColor = "#1e293b";
    let borderColor = "#475569";
    let fontColor = "#f8fafc";
    let shadowColor = "rgba(0,0,0,0.3)";
    let shadowSize = 6;
    let label = node;

    if (isStart) {
      bgColor = "#065f46";
      borderColor = "#10b981";
      label = `🟢 ${node}\n[START]`;
      shadowColor = "rgba(16, 185, 129, 0.4)";
      shadowSize = 12;
    } else if (isGoal) {
      bgColor = "#881337";
      borderColor = "#f43f5e";
      label = `🔴 ${node}\n[GOAL]`;
      shadowColor = "rgba(244, 63, 94, 0.4)";
      shadowSize = 12;
    }

    // Dynamic state highlights from search step
    if (state.currentNode === node) {
      bgColor = "#b45309";
      borderColor = "#f59e0b";
      shadowColor = "rgba(245, 158, 11, 0.6)";
      shadowSize = 18;
      label = `⭐ ${label}`;
    } else if (state.visitedSet && state.visitedSet.includes(node)) {
      if (!isStart && !isGoal) {
        bgColor = "#312e81";
        borderColor = "#818cf8";
        shadowColor = "rgba(129, 140, 248, 0.3)";
      }
    } else if (state.inQueue && state.inQueue.includes(node)) {
      if (!isStart && !isGoal) {
        bgColor = "#0369a1";
        borderColor = "#38bdf8";
        shadowColor = "rgba(56, 189, 248, 0.35)";
      }
    }

    if (state.optimalPath && state.optimalPath.includes(node)) {
      borderColor = "#fbbf24";
      shadowColor = "rgba(251, 191, 36, 0.7)";
      shadowSize = 16;
    }

    return {
      id: node,
      label,
      color: {
        background: bgColor,
        border: borderColor,
        highlight: { background: bgColor, border: borderColor },
        hover: { background: bgColor, border: borderColor }
      },
      font: { color: fontColor, multi: true, align: "center" },
      shadow: { enabled: true, color: shadowColor, size: shadowSize, x: 0, y: 0 }
    };
  }

  formatEdgeData(edge, state = {}) {
    const isNegative = edge.weight < 0;
    let color = isNegative ? "#ef4444" : "#475569";
    let width = 2;
    let dashes = isNegative ? [4, 4] : false;

    // Check if this edge is on the optimal path
    if (state.optimalEdges && state.optimalEdges.includes(edge.id)) {
      color = "#fbbf24";
      width = 5;
      dashes = false;
    } else if (state.currentEdge === edge.id) {
      color = "#38bdf8";
      width = 4;
    }

    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: ` w: ${edge.weight} `,
      arrows: edge.directed ? { to: { enabled: true, scaleFactor: 0.85 } } : false,
      color: { color, highlight: color, hover: "#94a3b8" },
      width,
      dashes,
      font: {
        color: isNegative ? "#fca5a5" : "#e2e8f0",
        background: isNegative ? "rgba(127, 29, 29, 0.9)" : "rgba(15, 23, 42, 0.85)"
      }
    };
  }

  // Update canvas to reflect a specific step's state
  applyStepState(graphData, startNode, goalNode, step) {
    if (!step) {
      this.loadGraph(graphData, startNode, goalNode);
      return;
    }

    const inQueueNodes = (step.pqState || []).map(item => item.node);

    // Update nodes
    const nodeUpdates = [];
    for (const node of graphData.nodes) {
      nodeUpdates.push(this.formatNodeData(node, startNode, goalNode, {
        currentNode: step.currentNode,
        visitedSet: step.visitedSet,
        inQueue: inQueueNodes,
        optimalPath: step.optimalPath
      }));
    }
    this.nodesDataSet.update(nodeUpdates);

    // Update edges
    const edgeUpdates = [];
    for (const edge of graphData.edges) {
      edgeUpdates.push(this.formatEdgeData(edge, {
        currentEdge: step.currentEdge,
        optimalEdges: step.optimalEdges
      }));
    }
    this.edgesDataSet.update(edgeUpdates);
  }
}


// =============================================================================
// 6. Application Controller & UI State Management
// =============================================================================
class UCSApp {
  constructor() {
    this.graph = new GraphData();
    this.visualizer = new NetworkVisualizer("network-canvas");

    this.startNode = "Start";
    this.goalNode = "Goal";

    this.steps = [];
    this.currentStepIdx = 0;
    this.timer = null;
    this.playInterval = 700;

    this.currentPresetId = 1;

    this.bindDOM();
    this.loadPreset(1);
  }

  bindDOM() {
    // Presets 1-5
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`preset-${i}`);
      if (btn) {
        btn.addEventListener("click", () => this.loadPreset(i));
      }
    }

    // Canvas tools
    document.getElementById("btn-fit-view").addEventListener("click", () => this.visualizer.fitView());
    document.getElementById("btn-toggle-physics").addEventListener("click", (e) => {
      const isEnabled = this.visualizer.togglePhysics();
      e.target.textContent = isEnabled ? "⚛️ Physics: On" : "⚛️ Physics: Off";
    });
    document.getElementById("btn-clear-canvas").addEventListener("click", () => this.clearGraph());

    // Execution Stepper Controls
    document.getElementById("btn-run-instant").addEventListener("click", () => this.runInstant());
    document.getElementById("btn-play-pause").addEventListener("click", () => this.togglePlayPause());
    document.getElementById("btn-step-forward").addEventListener("click", () => this.stepForward());
    document.getElementById("btn-step-back").addEventListener("click", () => this.stepBack());
    document.getElementById("btn-reset-search").addEventListener("click", () => this.resetSearch());

    // Speed Slider
    const speedSlider = document.getElementById("speed-slider");
    const speedDisplay = document.getElementById("speed-display");
    speedSlider.addEventListener("input", (e) => {
      this.playInterval = parseInt(e.target.value);
      speedDisplay.textContent = (this.playInterval / 1000).toFixed(2) + "s";
      if (this.timer) {
        this.pauseAutoPlay();
        this.startAutoPlay();
      }
    });

    // Start & Goal Node Selectors
    document.getElementById("select-start").addEventListener("change", (e) => {
      this.startNode = e.target.value;
      this.resetSearch();
      this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    });
    document.getElementById("select-goal").addEventListener("change", (e) => {
      this.goalNode = e.target.value;
      this.resetSearch();
      this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    });

    // Graph Editor Form
    document.getElementById("btn-add-node").addEventListener("click", () => this.handleAddNode());
    document.getElementById("btn-add-edge").addEventListener("click", () => this.handleAddEdge());
    document.getElementById("btn-cancel-edge-edit").addEventListener("click", () => this.cancelEdgeEdit());
    document.getElementById("btn-fix-negative").addEventListener("click", () => this.fixNegativeWeights());
    document.getElementById("btn-clear-log").addEventListener("click", () => {
      document.getElementById("history-log").innerHTML = '<div class="log-entry">Log cleared.</div>';
    });
  }

  loadPreset(presetId) {
    this.pauseAutoPlay();
    this.currentPresetId = presetId;

    // Highlight active preset button
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`preset-${i}`);
      if (btn) {
        btn.classList.toggle("active", i === presetId);
      }
    }

    const preset = PRESETS[presetId];
    if (!preset) return;

    preset.build(this.graph);
    this.startNode = preset.start;
    this.goalNode = preset.goal;

    this.syncEditorInputs();
    this.checkGraphValidation();
    this.resetSearch();
    this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);

    this.logHistory(`Loaded Preset ${presetId}: ${preset.name}`, "expand");
  }

  syncEditorInputs() {
    const startSelect = document.getElementById("select-start");
    const goalSelect = document.getElementById("select-goal");
    const fromSelect = document.getElementById("edge-from-select");
    const toSelect = document.getElementById("edge-to-select");

    const nodesList = Array.from(this.graph.nodes).sort();

    [startSelect, goalSelect, fromSelect, toSelect].forEach(select => {
      select.innerHTML = "";
      if (nodesList.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No nodes available";
        select.appendChild(option);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      nodesList.forEach(node => {
        const opt = document.createElement("option");
        opt.value = node;
        opt.textContent = node;
        select.appendChild(opt);
      });
    });

    if (this.graph.nodes.has(this.startNode)) startSelect.value = this.startNode;
    if (this.graph.nodes.has(this.goalNode)) goalSelect.value = this.goalNode;
    if (nodesList.length > 0) {
      fromSelect.value = nodesList.includes(fromSelect.value) ? fromSelect.value : nodesList[0];
      toSelect.value = nodesList.includes(toSelect.value) ? toSelect.value : nodesList[0];
    }

    this.renderNodeList();
    this.renderEdgeList();
  }

  renderNodeList() {
    const container = document.getElementById("node-list");
    container.replaceChildren();
    for (const node of Array.from(this.graph.nodes).sort()) {
      const chip = document.createElement("span");
      chip.className = "node-chip";
      const label = document.createElement("span");
      label.textContent = node;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.title = `Remove node ${node}`;
      removeButton.setAttribute("aria-label", `Remove node ${node}`);
      removeButton.addEventListener("click", () => this.handleRemoveNode(node));
      chip.append(label, removeButton);
      container.appendChild(chip);
    }
  }

  renderEdgeList() {
    const container = document.getElementById("edge-list");
    const countLabel = document.getElementById("edge-count-label");
    countLabel.textContent = this.graph.edges.length;
    container.innerHTML = "";

    if (this.graph.edges.length === 0) {
      container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.75rem; padding: 0.5rem; text-align: center;">No edges added.</div>';
      return;
    }

    this.graph.edges.forEach(edge => {
      const item = document.createElement("div");
      const isNeg = edge.weight < 0;
      item.className = `edge-item ${isNeg ? "edge-negative" : ""}`;
      const description = document.createElement("div");
      description.textContent = `${edge.from}${edge.directed ? " → " : " ↔ "}${edge.to}  [w: ${edge.weight}]`;
      const actions = document.createElement("div");
      actions.className = "edge-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit edge ${edge.from} to ${edge.to}`);
      editButton.addEventListener("click", () => this.beginEdgeEdit(edge));
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.title = "Delete edge";
      removeButton.setAttribute("aria-label", `Delete edge ${edge.from} to ${edge.to}`);
      removeButton.addEventListener("click", () => {
        this.graph.removeEdge(edge.id);
        if (document.getElementById("editing-edge-id").value === edge.id) this.cancelEdgeEdit();
        this.syncEditorInputs();
        this.checkGraphValidation();
        this.resetSearch();
        this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
      });
      actions.append(editButton, removeButton);
      item.append(description, actions);
      container.appendChild(item);
    });
  }

  checkGraphValidation() {
    const alertBanner = document.getElementById("alert-banner");
    const alertMessage = document.getElementById("alert-message");
    const validation = this.graph.validateNonNegative();

    const btnRunInstant = document.getElementById("btn-run-instant");
    const btnPlayPause = document.getElementById("btn-play-pause");
    const btnStepForward = document.getElementById("btn-step-forward");

    if (!validation.isValid) {
      alertBanner.style.display = "flex";
      const messages = [];
      if (validation.negativeEdges.length > 0) {
        const offending = validation.negativeEdges.map(e => `${e.from} → ${e.to} (w = ${e.weight})`).join(", ");
        messages.push(`Negative edge weight detected: ${offending}. UCS requires non-negative edge weights (w ≥ 0); search is disabled until corrected.`);
      }
      if (validation.invalidEdges.length > 0) {
        const offending = validation.invalidEdges.map(e => `${e.from} → ${e.to}`).join(", ");
        messages.push(`Invalid edge weight detected: ${offending}. Edge weights must be finite numbers.`);
      }
      alertMessage.textContent = messages.join(" ");

      btnRunInstant.disabled = true;
      btnPlayPause.disabled = true;
      btnStepForward.disabled = true;

      this.updateStatusBanner("Input Validation Error", "Negative edge weights detected. Please update weights to non-negative.", "error");
      return false;
    } else {
      alertBanner.style.display = "none";
      btnRunInstant.disabled = false;
      btnPlayPause.disabled = false;
      btnStepForward.disabled = false;
      return true;
    }
  }

  fixNegativeWeights() {
    this.graph.edges.forEach(edge => {
      if (edge.weight < 0) {
        edge.weight = 0.0;
      }
    });
    this.syncEditorInputs();
    this.checkGraphValidation();
    this.resetSearch();
    this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    this.logHistory("Negative edge weights fixed (clamped to 0.0)", "relax");
  }

  prepareSteps() {
    if (!this.checkGraphValidation()) return false;
    const result = generateUCSSteps(this.graph, this.startNode, this.goalNode);
    this.steps = result.steps;
    if (this.steps.length === 0 && result.error) {
      this.updateStatusBanner("Search Cannot Start", result.error, "error");
      return false;
    }
    return true;
  }

  resetSearch() {
    this.pauseAutoPlay();
    if (!this.checkGraphValidation()) return;

    if (!this.prepareSteps()) {
      this.steps = [];
      this.currentStepIdx = 0;
      this.visualizer.applyStepState(this.graph, this.startNode, this.goalNode, null);
      this.updateStatusBanner("Search Cannot Start", "Add at least one node and choose valid Start and Goal nodes.", "error");
      return;
    }
    this.currentStepIdx = 0;
    this.renderCurrentStep();
    this.visualizer.applyStepState(this.graph, this.startNode, this.goalNode, null);

    // Reset Summary Card
    document.getElementById("summary-status-badge").textContent = "Awaiting Run";
    document.getElementById("metric-total-cost").textContent = "--";
    document.getElementById("metric-total-hops").textContent = "--";
    document.getElementById("metric-stale-skips").textContent = "0";
    document.getElementById("route-path-text").textContent = "No path computed yet";
    document.getElementById("bfs-hop-info").textContent = "-- hops (cost: --)";
    document.getElementById("ucs-cost-info").textContent = "-- hops (cost: --)";
    document.getElementById("bfs-verdict-text").textContent = "Run search to compare UCS least-cost with Fewest-Hop (BFS).";

    this.updateStatusBanner("Search Reset", `Ready to start Uniform-Cost Search from '${this.startNode}' to '${this.goalNode}'.`, "idle");
  }

  stepForward() {
    if (this.steps.length === 0) {
      if (!this.prepareSteps()) return;
    }
    if (this.currentStepIdx < this.steps.length - 1) {
      this.currentStepIdx++;
      this.renderCurrentStep();
    } else {
      this.pauseAutoPlay();
    }
  }

  stepBack() {
    if (this.currentStepIdx > 0) {
      this.currentStepIdx--;
      this.renderCurrentStep();
    }
  }

  runInstant() {
    this.pauseAutoPlay();
    if (this.steps.length === 0) {
      if (!this.prepareSteps()) return;
    }
    this.currentStepIdx = this.steps.length - 1;
    this.renderCurrentStep();
  }

  togglePlayPause() {
    if (this.timer) {
      this.pauseAutoPlay();
    } else {
      if (this.steps.length === 0) {
        if (!this.prepareSteps()) return;
      }
      if (this.currentStepIdx >= this.steps.length - 1) {
        this.currentStepIdx = 0;
      }
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    const playBtn = document.getElementById("btn-play-pause");
    playBtn.innerHTML = "⏸️ Pause";
    playBtn.classList.replace("btn-primary", "btn-secondary");

    this.timer = setInterval(() => {
      if (this.currentStepIdx < this.steps.length - 1) {
        this.currentStepIdx++;
        this.renderCurrentStep();
      } else {
        this.pauseAutoPlay();
      }
    }, this.playInterval);
  }

  pauseAutoPlay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const playBtn = document.getElementById("btn-play-pause");
    if (playBtn) {
      playBtn.innerHTML = "▶️ Play";
      playBtn.classList.replace("btn-secondary", "btn-primary");
    }
  }

  renderCurrentStep() {
    if (this.steps.length === 0) return;
    const step = this.steps[this.currentStepIdx];
    if (!step) return;

    // Update Nav Buttons
    document.getElementById("btn-step-back").disabled = this.currentStepIdx === 0;
    document.getElementById("btn-step-forward").disabled = this.currentStepIdx >= this.steps.length - 1;
    document.getElementById("step-counter-badge").textContent = `Step ${this.currentStepIdx + 1} / ${this.steps.length}`;

    // Apply canvas state
    this.visualizer.applyStepState(this.graph, this.startNode, this.goalNode, step);

    // Update Live Action Callout Banner
    let statusClass = "running";
    if (step.type === "GOAL_REACHED") statusClass = "success";
    else if (step.type === "UNREACHABLE" || step.type === "STALE_SKIP") statusClass = "error";
    else if (step.type === "INIT") statusClass = "idle";

    this.updateStatusBanner(step.headline, step.subtext, statusClass);

    // Update Stale Alert Banner
    const staleAlert = document.getElementById("pq-stale-alert");
    if (step.isStale && step.poppedItem) {
      staleAlert.style.display = "flex";
      const finalizedCost = step.finalizedCosts[step.poppedItem.node];
      const bestCost = finalizedCost !== undefined ? `finalized at cost ${finalizedCost}` : `the best known cost is ${step.distMap[step.poppedItem.node]}`;
      document.getElementById("pq-stale-text").textContent = `Popped '${step.poppedItem.node}' (cost=${step.poppedItem.cost}), but ${bestCost}.`;
    } else {
      staleAlert.style.display = "none";
    }

    // Render Priority Queue List
    this.renderPriorityQueue(step.pqState);

    // Render Visited / Finalized Table
    this.renderVisitedTable(step.finalizedCosts, step.parentMap, step.currentNode);

    // Log to audit history
    if (step.type === "POP_EXPAND") {
      this.logHistory(`[Step ${this.currentStepIdx + 1}] Popped & finalized node ${step.currentNode} with cost ${step.poppedItem.cost}`, "expand");
    } else if (step.type === "STALE_SKIP") {
      this.logHistory(`[Step ${this.currentStepIdx + 1}] STALE SKIP: Node ${step.poppedItem.node} was already finalized. Discarded.`, "stale");
    } else if (step.type === "RELAX_EDGE") {
      this.logHistory(`[Step ${this.currentStepIdx + 1}] Relaxed edge to neighbor.`, "relax");
    } else if (step.type === "GOAL_REACHED") {
      this.logHistory(`[Step ${this.currentStepIdx + 1}] GOAL REACHED! Optimal path: ${step.optimalPath.join(" ➔ ")} (Cost: ${step.totalCost})`, "goal");
    }

    // Update Summary Card
    this.updateSummaryCard(step);
  }

  renderPriorityQueue(pqItems) {
    const container = document.getElementById("pq-list");
    const countBadge = document.getElementById("pq-count-badge");
    countBadge.textContent = `${pqItems.length} items`;
    container.innerHTML = "";

    if (pqItems.length === 0) {
      container.innerHTML = '<div class="pq-empty-state">Priority Queue is empty.</div>';
      return;
    }

    pqItems.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "pq-item";
      const left = document.createElement("div");
      left.className = "pq-item-left";
      const rank = document.createElement("span");
      rank.className = "pq-rank";
      rank.textContent = `#${idx + 1}`;
      const node = document.createElement("span");
      node.className = "pq-node-badge";
      node.textContent = item.node;
      const parent = document.createElement("span");
      parent.className = "pq-parent-text";
      parent.textContent = item.parent ? `via ${item.parent}` : "start";
      left.append(rank, node, parent);
      const cost = document.createElement("span");
      cost.className = "pq-cost-badge";
      cost.textContent = `g(n) = ${item.cost}`;
      row.append(left, cost);
      container.appendChild(row);
    });
  }

  renderVisitedTable(finalizedCosts, parentMap, currentNode) {
    const tbody = document.getElementById("visited-table-body");
    const countBadge = document.getElementById("finalized-count-badge");
    const finalizedKeys = Object.keys(finalizedCosts);
    countBadge.textContent = `${finalizedKeys.length} finalized`;
    tbody.innerHTML = "";

    if (finalizedKeys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 0.85rem;">No nodes finalized yet.</td></tr>';
      return;
    }

    finalizedKeys.forEach(node => {
      const tr = document.createElement("tr");
      if (node === currentNode) tr.className = "highlight-row";
      const values = [node, "Finalized", finalizedCosts[node], parentMap[node] !== null ? parentMap[node] : "— (Root)"];
      values.forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (index === 0) {
          const strong = document.createElement("strong");
          strong.textContent = value;
          cell.replaceChildren(strong);
        } else if (index === 1) {
          const status = document.createElement("span");
          status.className = "status-badge finalized";
          status.textContent = value;
          cell.replaceChildren(status);
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
  }

  updateSummaryCard(step) {
    const costElem = document.getElementById("metric-total-cost");
    const hopsElem = document.getElementById("metric-total-hops");
    const skipsElem = document.getElementById("metric-stale-skips");
    const routeElem = document.getElementById("route-path-text");
    const badge = document.getElementById("summary-status-badge");

    skipsElem.textContent = step.staleSkips;

    if (step.type === "GOAL_REACHED" && step.optimalPath) {
      badge.textContent = "Optimal Path Found";
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "#34d399";
      badge.style.borderColor = "#10b981";

      costElem.textContent = step.totalCost.toFixed(1);
      hopsElem.textContent = `${step.hops} hop${step.hops === 1 ? '' : 's'}`;
      routeElem.textContent = step.optimalPath.join(" ➔ ");

      // Run BFS comparison
      this.renderBFSComparison(step);
    } else if (step.type === "UNREACHABLE") {
      badge.textContent = "Unreachable";
      badge.style.background = "rgba(239, 68, 68, 0.2)";
      badge.style.color = "#f87171";
      badge.style.borderColor = "#ef4444";

      costElem.textContent = "∞";
      hopsElem.textContent = "0";
      routeElem.textContent = "No valid path exists";

      document.getElementById("bfs-hop-info").textContent = "No route";
      document.getElementById("ucs-cost-info").textContent = "No route";
      document.getElementById("bfs-verdict-text").textContent = `Destination node '${this.goalNode}' is in a disjoint component or lacks an inbound directed path from '${this.startNode}'.`;
    } else {
      badge.textContent = "Searching...";
      badge.style.background = "rgba(99, 102, 241, 0.2)";
      badge.style.color = "#a5b4fc";
      badge.style.borderColor = "#6366f1";
    }
  }

  renderBFSComparison(ucsStep) {
    const bfsResult = this.graph.computeFewestHopsPath(this.startNode, this.goalNode);
    const bfsHopInfo = document.getElementById("bfs-hop-info");
    const ucsCostInfo = document.getElementById("ucs-cost-info");
    const verdictText = document.getElementById("bfs-verdict-text");

    ucsCostInfo.textContent = `${ucsStep.hops} hops (cost: ${ucsStep.totalCost})`;

    if (!bfsResult) {
      bfsHopInfo.textContent = "None";
      verdictText.textContent = "BFS found no route.";
      return;
    }

    bfsHopInfo.textContent = `${bfsResult.hops} hops (cost: ${bfsResult.cost})`;

    const costDiff = bfsResult.cost - ucsStep.totalCost;
    if (costDiff > 0) {
      const pctSavings = ((costDiff / bfsResult.cost) * 100).toFixed(0);
      verdictText.textContent = `Key UCS principle: Fewest-Hops chose ${bfsResult.path.join(" → ")} (${bfsResult.hops} hops, cost ${bfsResult.cost}); UCS chose ${ucsStep.optimalPath.join(" → ")} (${ucsStep.hops} hops, cost ${ucsStep.totalCost}). UCS saved ${costDiff.toFixed(1)} cost units (${pctSavings}%), showing that the fewest edges do not necessarily have the lowest total cost.`;
    } else if (bfsResult.hops === ucsStep.hops && bfsResult.cost === ucsStep.totalCost) {
      verdictText.textContent = `The fewest-hop route is also the least-cost route (${ucsStep.hops} hops, cost ${ucsStep.totalCost}). UCS still guarantees global optimality on weighted graphs.`;
    } else {
      verdictText.textContent = `UCS optimal path: ${ucsStep.optimalPath.join(" → ")} (cost: ${ucsStep.totalCost}). Both algorithms reached the goal.`;
    }
  }

  updateStatusBanner(headline, subtext, statusClass) {
    document.getElementById("status-headline").textContent = headline;
    document.getElementById("status-subtext").textContent = subtext;
    const pulse = document.getElementById("status-pulse");
    pulse.className = `status-pulse ${statusClass}`;
  }

  logHistory(text, type = "normal") {
    const logBox = document.getElementById("history-log");
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${text}`;
    logBox.prepend(entry);
  }

  handleAddNode() {
    const input = document.getElementById("input-node-name");
    const name = input.value.trim() || `Node_${this.graph.nodes.size + 1}`;
    if (this.graph.nodes.has(name)) {
      alert(`Node '${name}' already exists.`);
      return;
    }
    this.graph.addNode(name);
    if (this.graph.nodes.size === 1) {
      this.startNode = name;
      this.goalNode = name;
    }
    input.value = "";
    this.syncEditorInputs();
    this.resetSearch();
    this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    this.logHistory(`Added node '${name}'`, "relax");
  }

  handleRemoveNode(name) {
    this.graph.removeNode(name);
    const remaining = Array.from(this.graph.nodes).sort();
    if (!this.graph.nodes.has(this.startNode)) this.startNode = remaining[0] || "";
    if (!this.graph.nodes.has(this.goalNode)) this.goalNode = remaining[0] || "";
    const editingEdgeId = document.getElementById("editing-edge-id").value;
    if (editingEdgeId && !this.graph.edges.some(edge => edge.id === editingEdgeId)) {
      this.cancelEdgeEdit();
    }
    this.syncEditorInputs();
    this.checkGraphValidation();
    this.resetSearch();
    this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    this.logHistory(`Removed node '${name}' and its connected edges`, "stale");
  }

  beginEdgeEdit(edge) {
    document.getElementById("editing-edge-id").value = edge.id;
    document.getElementById("edge-from-select").value = edge.from;
    document.getElementById("edge-to-select").value = edge.to;
    document.getElementById("edge-weight-input").value = edge.weight;
    document.getElementById("edge-directed-check").checked = edge.directed;
    document.getElementById("btn-add-edge").textContent = "Save Edge";
    document.getElementById("btn-cancel-edge-edit").style.display = "inline-flex";
    document.getElementById("edge-weight-input").focus();
  }

  cancelEdgeEdit() {
    document.getElementById("editing-edge-id").value = "";
    document.getElementById("btn-add-edge").textContent = "+ Edge";
    document.getElementById("btn-cancel-edge-edit").style.display = "none";
  }

  handleAddEdge() {
    const from = document.getElementById("edge-from-select").value;
    const to = document.getElementById("edge-to-select").value;
    const weightVal = parseFloat(document.getElementById("edge-weight-input").value);
    const directed = document.getElementById("edge-directed-check").checked;

    if (!from || !to) {
      alert("Please select both From and To nodes.");
      return;
    }
    if (!Number.isFinite(weightVal)) {
      alert("Please enter a finite numeric weight.");
      return;
    }

    const editingId = document.getElementById("editing-edge-id").value;
    if (editingId) {
      const edge = this.graph.edges.find(candidate => candidate.id === editingId);
      if (!edge) {
        this.cancelEdgeEdit();
        alert("This edge no longer exists. Select an edge and try again.");
        return;
      }
      edge.from = from;
      edge.to = to;
      edge.weight = weightVal;
      edge.directed = directed;
      this.cancelEdgeEdit();
    } else {
      this.graph.addEdge(from, to, weightVal, directed);
    }
    this.syncEditorInputs();
    this.checkGraphValidation();
    this.resetSearch();
    this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
    this.logHistory(`${editingId ? "Updated" : "Added"} edge ${from} ${directed ? "->" : "<->"} ${to} (weight: ${weightVal})`, weightVal < 0 ? "stale" : "relax");
  }

  clearGraph() {
    if (confirm("Are you sure you want to clear the entire graph?")) {
      this.graph.clear();
      this.syncEditorInputs();
      this.checkGraphValidation();
      this.resetSearch();
      this.visualizer.loadGraph(this.graph, this.startNode, this.goalNode);
      this.logHistory("Graph cleared.", "stale");
    }
  }
}


// Initialize application when DOM is ready in browser
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("DOMContentLoaded", () => {
    window.app = new UCSApp();
  });
}

// CommonJS module exports for automated unit tests
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MinHeapPriorityQueue,
    GraphData,
    PRESETS,
    generateUCSSteps,
    NetworkVisualizer,
    UCSApp
  };
}
