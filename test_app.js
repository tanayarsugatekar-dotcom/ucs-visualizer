/**
 * Headless Node.js Test Suite for app.js
 * Verifies Min-Heap, UCS Step Generation, Presets 1-5, BFS comparison, and Stale Handling
 */

// Mock Vis.js DataSet and Network for headless environment
class MockDataSet {
  constructor() { this.items = []; }
  add(items) { if (Array.isArray(items)) this.items.push(...items); else this.items.push(items); }
  update(items) { }
  clear() { this.items = []; }
}

global.vis = {
  DataSet: MockDataSet,
  Network: class {
    constructor() {}
    setOptions() {}
    fit() {}
  }
};

global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { toggle: () => {}, replace: () => {} },
    style: {},
    appendChild: () => {},
    prepend: () => {},
    innerHTML: '',
    textContent: '',
    value: ''
  })
};

const { MinHeapPriorityQueue, GraphData, PRESETS, generateUCSSteps } = require('./app.js');

console.log("======================================================================");
console.log("RUNNING JAVASCRIPT HEADLESS TEST SUITE (app.js)");
console.log("======================================================================");

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

// 1. Test MinHeapPriorityQueue
console.log("\n[Test 1] Binary Min-Heap Priority Queue Operations");
const pq = new MinHeapPriorityQueue();
pq.push(10, "A");
pq.push(3, "B");
pq.push(7, "C");
pq.push(3, "D"); // Tie with B, stable FIFO counter

const p1 = pq.pop();
assert(p1.node === "B" && p1.cost === 3, "Min item should be B with cost 3");
const p2 = pq.pop();
assert(p2.node === "D" && p2.cost === 3, "Second item should be D with cost 3 (FIFO tie-break)");
const p3 = pq.pop();
assert(p3.node === "C" && p3.cost === 7, "Third item should be C with cost 7");
const p4 = pq.pop();
assert(p4.node === "A" && p4.cost === 10, "Fourth item should be A with cost 10");
assert(pq.isEmpty(), "PQ should now be empty");
console.log("  ✓ PASS: Min-Heap bubble-up, bubble-down, and stable tie-breaking verified.");

// 2. Test Presets 1-5 with UCS Generator
for (let pid = 1; pid <= 5; pid++) {
  const preset = PRESETS[pid];
  const g = new GraphData();
  preset.build(g);

  console.log(`\n[Test Preset ${pid}] ${preset.name}`);
  const result = generateUCSSteps(g, preset.start, preset.goal);

  if (pid === 5) {
    assert(!result.success, "Preset 5 must fail validation");
    assert(result.error.includes("Negative edge weight detected"), "Should report negative edge weight error");
    console.log(`  ✓ PASS: Successfully caught negative edge weight: ${result.error}`);
  } else if (pid === 3) {
    assert(!result.success, "Preset 3 must report unreachable");
    const lastStep = result.steps[result.steps.length - 1];
    assert(lastStep.type === "UNREACHABLE", "Last step must be UNREACHABLE");
    console.log(`  ✓ PASS: Successfully identified unreachable destination. Last step: ${lastStep.headline}`);
  } else {
    assert(result.success, `Preset ${pid} search must succeed`);
    const lastStep = result.steps[result.steps.length - 1];
    assert(lastStep.type === "GOAL_REACHED", "Last step must be GOAL_REACHED");
    console.log(`  ✓ PASS: Optimal path: ${lastStep.optimalPath.join(" -> ")}, Cost: ${lastStep.totalCost}, Hops: ${lastStep.hops}`);

    // Verify BFS comparison
    const bfs = g.computeFewestHopsPath(preset.start, preset.goal);
    if (bfs) {
      console.log(`    [Comparison] BFS Fewest-Hops: ${bfs.path.join(" -> ")} (Hops: ${bfs.hops}, Cost: ${bfs.cost})`);
      if (pid === 1) {
        assert(bfs.hops === 1 && bfs.cost === 10.0, "BFS must pick 1-hop direct route costing 10");
        assert(lastStep.hops === 3 && lastStep.totalCost === 6.0, "UCS must pick 3-hop indirect route costing 6");
        console.log("    >>> Proves: Fewest Hops (1 hop, cost 10) != Lowest Cost (3 hops, cost 6)!");
      }
    }
  }
}

console.log("\n[Test 6] Stale Queue Entries and Invalid Numeric Weights");
const staleGraph = new GraphData();
staleGraph.addEdge("Start", "A", 10);
staleGraph.addEdge("Start", "B", 1);
staleGraph.addEdge("B", "A", 1);
staleGraph.addEdge("A", "Goal", 20);
const staleResult = generateUCSSteps(staleGraph, "Start", "Goal");
assert(staleResult.success, "A graph with an outdated heap entry should still find a route");
assert(staleResult.steps.some(step => step.type === "STALE_SKIP" && step.poppedItem.node === "A"), "Outdated A entry should be explicitly skipped as stale");
assert(staleResult.totalCost === 22, "The cheaper route through B should determine the final cost");
console.log("  ✓ PASS: Outdated heap entries are skipped and the lower-cost route is retained.");

const invalidWeightGraph = new GraphData();
invalidWeightGraph.addEdge("Start", "Goal", Number.NaN);
const invalidWeightResult = generateUCSSteps(invalidWeightGraph, "Start", "Goal");
assert(!invalidWeightResult.success, "Non-finite edge weights must be rejected");
assert(invalidWeightResult.error.includes("finite numbers"), "Invalid numeric weights should produce a clear validation message");
console.log("  ✓ PASS: Non-finite edge weights are rejected before search.");

console.log("\n======================================================================");
console.log("ALL JAVASCRIPT HEADLESS TESTS PASSED PERFECTLY!");
console.log("======================================================================");
