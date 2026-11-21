# Uniform-Cost Search (UCS) · Least-Cost Route Planning

An interactive, visual web application and algorithmic demonstration of **Least-Cost Route Planning using Uniform-Cost Search (UCS)** on weighted graphs, built for AI Lab.

---

## 🚀 Quick Start (Zero Setup)

You have three convenient ways to launch and explore this project:

### Option 1: Direct Browser Launch (Zero-Setup)
Simply **double-click** `index.html` or open it in any web browser (Chrome, Edge, Firefox, Safari).  
All libraries (Vis.js Network) are locally packaged in the directory for 100% offline functionality with **zero dependencies**.

### Option 2: 1-Click Python Server
Run the built-in local server script, which automatically opens your default browser:
```bash
python server.py
```
Then visit: [http://localhost:8000/index.html](http://localhost:8000/index.html)

### Option 3: Terminal Algorithmic Test Suite
Run the Python UCS verification suite to test all 5 core scenarios from the command line:
```bash
python ucs.py
```

## 🌐 Deploy to GitHub Pages

The interface is a static site and can stay online without your computer running. To publish it:

1. Sign in to GitHub and create a **public** repository.
2. From this project folder, initialize and push the project:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial project"
   gh repo create ucs-visualizer --public --source=. --remote=origin --push
   ```
   If you already created the repository in GitHub, add it as `origin` and push `main` instead.
3. In the repository, open **Settings → Pages** and set the build source to **GitHub Actions**.
4. The included Pages workflow publishes the site on each push to `main`. Find the permanent URL under **Settings → Pages**.

The published page and its source files are public. The workflow uploads only the HTML, CSS, JavaScript, and locally bundled visualization library.

---

## 🧠 Core Algorithm Highlights

Uniform-Cost Search is an uninformed graph search algorithm that finds the path with the lowest cumulative cost $g(n)$ from a Start node to a Goal node. It is equivalent to Dijkstra's algorithm applied to goal-directed search.

1. **Priority Queue (Min-Heap):**
   - Implemented as a binary min-heap ordered by cumulative path cost $g(n)$.
   - Tie-breaking uses a stable FIFO insertion counter.
   - Always extracts the node $u$ with the lowest path cost from the frontier.

2. **Cumulative Cost Tracking & Parent Pointers:**
   - Tracks best known cost $dist[n]$ to each node.
   - Maintains $parent[n]$ pointers to reconstruct the exact optimal path once the Goal is popped.

3. **Stale-Entry Handling:**
   - In standard graph search, relaxation pushes updated entries $(g'(v), v)$ into the Priority Queue without mutating existing heap elements in place.
   - When an entry is popped, UCS checks if $v$ has already been finalized (`visited.has(v)` or $g(v) < \text{popped\_cost}$).
   - Outdated entries are skipped as **Stale**, preventing suboptimal expansions.
   - In the UI, stale entries are visually flagged with an animated badge: `[STALE - SKIPPED]`.

4. **Input Validation (Non-Negative Weights Invariant):**
   - UCS strictly requires all edge weights to be non-negative ($w \ge 0$).
   - If negative weights exist, cumulative costs can decrease along a path, breaking the fundamental greedy invariant $g(u) \le g(v)$ and potentially causing infinite cycles or suboptimal early termination.
   - The application proactively inspects all edges and displays a prominent warning banner, disabling execution until weights are corrected or auto-fixed.

---

## 🎯 5 Built-In Preset Scenarios (1-Click Loaders)

| # | Preset Scenario | Graph Topology | Key Takeaway / Observation |
|---|---|---|---|
| **1** | **Expensive Direct vs. Cheap Indirect (Main Demo)** | `Start -> Goal` ($w=10$, 1 hop)<br>`Start -> A -> B -> Goal` ($2+2+2 = 6$, 3 hops)<br>`Start -> C -> Goal` ($4+5 = 9$, 2 hops) | **Fewest Edges $\neq$ Lowest Cost:** BFS greedily chooses the 1-hop path costing 10.0. UCS explores deeper and finds the 3-hop path costing only 6.0 (a 40% cost reduction!). |
| **2** | **Equal-Cost Routes** | `Start -> Alpha -> Goal` ($3+4 = 7$)<br>`Start -> Beta -> Goal` ($5+2 = 7$) | **Deterministic Tie-Breaking:** Both paths share the exact same minimum cost (7.0). UCS cleanly returns an optimal route. |
| **3** | **Disconnected Graph** | Component 1: `Start`, `Island1_A`, `Island1_B`<br>Component 2: `Goal`, `Island2_X`, `Island2_Y` | **Graceful Termination:** No path exists between components. UCS exhausts the priority queue and reports a clear *"Destination Unreachable"* status without crashing. |
| **4** | **Zero-Cost Edge** | `Start -> FreeExpress` ($w=0$)<br>`FreeExpress -> Goal` ($w=4$)<br>`Start -> Goal` ($w=7$) | **Non-Negative Boundary:** $w=0$ edges are processed accurately without division-by-zero, infinite loops, or stall states. Optimal path cost = 4.0. |
| **5** | **Negative Edge Weight (Error Case)** | `Start -> Node_A` ($w=4$)<br>`Node_A -> Node_B` ($w=-3$ ⚠️)<br>`Node_B -> Goal` ($w=2$) | **Safety Rejection:** Triggers immediate input validation error banner. Explains the invariant failure and provides a 1-click button to fix weights. |

---

## 🖥️ Interactive User Interface Features

- **Interactive Canvas (Vis-network):**
  - Smooth physics simulation with toggle and zoom/fit controls.
  - Color-coded node badges:
    - 🟢 **Start Node** (`[START]`)
    - 🔴 **Goal Node** (`[GOAL]`)
    - ⭐ **Currently Expanding Node** (Glowing amber pulse)
    - 🔷 **In Priority Queue (Frontier)** (Cyan)
    - 🟣 **Finalized / Closed Node** (Indigo/Purple)
    - 🟡 **Optimal Least-Cost Path** (Highlighted in neon gold with 5px edge width)
- **Step-by-Step Educational Stepper:**
  - **Run Instant:** Instantly computes and renders the final optimal route.
  - **Play / Pause:** Auto-steps through the algorithm with adjustable playback speed (150ms – 1800ms).
  - **Step Forward / Step Back:** Bidirectional micro-stepping allowing inspection of each pop, relaxation, and stale skip.
  - **Reset:** Rewinds search back to step 0.
- **Priority Queue Visualizer:**
  - Live display of heap elements ordered by cumulative cost: `(cost, node, parent)`.
  - Prominent red alert banner when a stale entry is skipped.
- **Finalized Costs Table:**
  - Real-time table displaying node, finalized status, minimal cost $g(n)$, and predecessor pointer.
- **Comparison Summary Card:**
  - Total path cost, hop count, and route path string.
  - **Fewest-Hop (BFS) vs. Least-Cost (UCS) Comparison Box:** Explicitly contrasts BFS hops vs UCS cost, showing exact cost savings and explaining why BFS is insufficient on weighted graphs.
- **Custom Graph Editor:**
  - Add and remove custom nodes; removing a node also removes its connected edges.
  - Add, edit, or remove directed/undirected edges with custom weights.
  - Select any custom Start and Goal node via live dropdowns.
  - Negative or non-finite weights are rejected before search; the validation banner explains how to correct them.
  - Clear the canvas to start a new graph.

---

## 📁 Project Structure

```
AI project/
├── index.html          # Main single-page application interface
├── styles.css          # Modern dark-mode UI stylesheet
├── app.js              # Binary Min-Heap, UCS generator, graph data, UI controller
├── vis-network.min.js  # Offline standalone Vis.js network visualization library
├── ucs.py              # Pure Python implementation & CLI test suite
├── server.py           # Optional Python 1-click web launcher
└── README.md           # Project documentation and theoretical background
```
