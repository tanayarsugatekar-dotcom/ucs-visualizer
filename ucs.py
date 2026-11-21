"""
Uniform-Cost Search (UCS) Implementation & Test Suite
Demonstrating least-cost route planning on weighted graphs using a Min-Heap Priority Queue.
"""

import heapq
import math
import sys
from typing import Dict, List, Tuple, Optional, Set

class PriorityQueue:
    """Min-Heap Priority Queue tracking (cost, counter, node, parent) to guarantee tie-breaking."""
    def __init__(self):
        self._heap = []
        self._counter = 0

    def push(self, cost: float, node: str, parent: Optional[str] = None):
        heapq.heappush(self._heap, (cost, self._counter, node, parent))
        self._counter += 1

    def pop(self) -> Tuple[float, str, Optional[str]]:
        cost, _, node, parent = heapq.heappop(self._heap)
        return cost, node, parent

    def peek(self) -> Optional[Tuple[float, str, Optional[str]]]:
        if not self._heap:
            return None
        cost, _, node, parent = self._heap[0]
        return cost, node, parent

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)

    def to_list(self) -> List[Tuple[float, str, Optional[str]]]:
        # Return sorted snapshot of current items for visualization
        items = [(cost, node, parent) for cost, _, node, parent in self._heap]
        return sorted(items, key=lambda x: x[0])


class Graph:
    def __init__(self, directed: bool = True):
        self.directed = directed
        self.nodes: Set[str] = set()
        self.adj: Dict[str, List[Tuple[str, float]]] = {}

    def add_node(self, node: str):
        self.nodes.add(node)
        if node not in self.adj:
            self.adj[node] = []

    def add_edge(self, u: str, v: str, weight: float):
        self.add_node(u)
        self.add_node(v)
        self.adj[u].append((v, weight))
        if not self.directed:
            self.adj[v].append((u, weight))

    def validate_non_negative_weights(self) -> Tuple[bool, Optional[str]]:
        for u, neighbors in self.adj.items():
            for v, weight in neighbors:
                if not math.isfinite(weight):
                    return False, f"Invalid edge weight detected: ({u} -> {v}, weight={weight}). UCS requires finite numeric weights."
                if weight < 0:
                    return False, f"Negative edge weight detected: ({u} -> {v}, weight={weight}). UCS requires all edge weights to be non-negative (w >= 0)."
        return True, None


def uniform_cost_search(graph: Graph, start: str, goal: str) -> Dict:
    """
    Executes Uniform-Cost Search (UCS) strictly using:
      - Priority Queue (Min-Heap)
      - Cumulative cost tracking & parent map
      - Stale-entry handling
      - Non-negative weight validation
    """
    # 1. Input Validation: Check non-negative weights
    is_valid, error_msg = graph.validate_non_negative_weights()
    if not is_valid:
        return {
            "success": False,
            "error": error_msg,
            "path": [],
            "cost": float('inf'),
            "hops": 0,
            "stale_skips": 0,
            "expanded_nodes": []
        }

    if start not in graph.nodes:
        return {"success": False, "error": f"Start node '{start}' does not exist in graph.", "path": []}
    if goal not in graph.nodes:
        return {"success": False, "error": f"Goal node '{goal}' does not exist in graph.", "path": []}

    # 2. Setup
    pq = PriorityQueue()
    pq.push(0.0, start, None)

    dist: Dict[str, float] = {start: 0.0}
    parent: Dict[str, Optional[str]] = {start: None}
    visited: Set[str] = set()

    expanded_nodes: List[str] = []
    stale_skips = 0
    step_log = []

    # 3. Main Search Loop
    while not pq.is_empty():
        current_cost, current_node, current_parent = pq.pop()

        # Stale-Entry Check:
        # If node has already been finalized with a lower or equal cost, skip it.
        if current_node in visited or current_cost > dist.get(current_node, float("inf")):
            stale_skips += 1
            if current_node in visited:
                reason = f"already finalized with cost={dist[current_node]}"
            else:
                reason = f"best known cost is {dist[current_node]}"
            step_log.append(f"STALE SKIP: Popped ({current_node}, cost={current_cost}), but {reason}.")
            continue

        # Finalize node
        visited.add(current_node)
        expanded_nodes.append(current_node)
        step_log.append(f"EXPAND: Node {current_node} with cumulative cost {current_cost}.")

        # Goal Check (Done at expansion time, as required by UCS/Dijkstra)
        if current_node == goal:
            # Reconstruct path
            path = []
            curr = goal
            while curr is not None:
                path.append(curr)
                curr = parent.get(curr)
            path.reverse()

            return {
                "success": True,
                "path": path,
                "cost": current_cost,
                "hops": len(path) - 1,
                "expanded_nodes": expanded_nodes,
                "stale_skips": stale_skips,
                "visited": dict(dist),
                "step_log": step_log,
                "error": None
            }

        # Expand neighbors
        for neighbor, weight in graph.adj.get(current_node, []):
            if neighbor in visited:
                continue

            new_cost = current_cost + weight
            if neighbor not in dist or new_cost < dist[neighbor]:
                dist[neighbor] = new_cost
                parent[neighbor] = current_node
                pq.push(new_cost, neighbor, current_node)
                step_log.append(f"  -> Discovered/Relaxed: {neighbor} via {current_node} with new cost {new_cost}")

    # If PQ empties without finding goal
    return {
        "success": False,
        "error": f"No path found: Destination '{goal}' is unreachable from '{start}'.",
        "path": [],
        "cost": float('inf'),
        "hops": 0,
        "expanded_nodes": expanded_nodes,
        "stale_skips": stale_skips,
        "visited": dict(dist),
        "step_log": step_log
    }


def breadth_first_search_fewest_hops(graph: Graph, start: str, goal: str) -> Optional[Dict]:
    """Finds path with fewest hops (BFS) to compare against UCS."""
    from collections import deque
    queue = deque([[start]])
    visited = {start}

    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            # Compute total cost of this path using graph weights
            total_cost = 0.0
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                # find min edge weight from u to v
                w = min(weight for nbr, weight in graph.adj.get(u, []) if nbr == v)
                total_cost += w
            return {
                "path": path,
                "hops": len(path) - 1,
                "cost": total_cost
            }
        for neighbor, _ in graph.adj.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])
    return None


def get_preset_graph(preset_id: int) -> Tuple[Graph, str, str, str]:
    """Returns (Graph, start_node, goal_node, description)."""
    if preset_id == 1:
        # 1. Expensive Direct vs. Cheap Indirect Route (Main Demo)
        g = Graph(directed=True)
        g.add_edge("Start", "Goal", 10.0) # 1 hop, cost 10
        g.add_edge("Start", "A", 2.0)
        g.add_edge("A", "B", 2.0)
        g.add_edge("B", "Goal", 2.0)     # 3 hops, total cost 6
        g.add_edge("Start", "C", 4.0)
        g.add_edge("C", "Goal", 5.0)     # 2 hops, total cost 9
        desc = "Expensive Direct (1 hop, cost 10) vs Cheap Indirect (3 hops, cost 6)"
        return g, "Start", "Goal", desc

    elif preset_id == 2:
        # 2. Equal-Cost Routes
        g = Graph(directed=True)
        g.add_edge("Start", "Alpha", 3.0)
        g.add_edge("Alpha", "Goal", 4.0) # Total 7
        g.add_edge("Start", "Beta", 5.0)
        g.add_edge("Beta", "Goal", 2.0)  # Total 7
        desc = "Equal-Cost Routes: Start->Alpha->Goal (3+4=7) and Start->Beta->Goal (5+2=7)"
        return g, "Start", "Goal", desc

    elif preset_id == 3:
        # 3. Disconnected Graph
        g = Graph(directed=True)
        g.add_edge("Start", "Comp1_A", 3.0)
        g.add_edge("Comp1_A", "Comp1_B", 2.0)
        g.add_edge("Comp1_B", "Start", 1.0)
        g.add_node("Goal")
        g.add_node("Comp2_X")
        g.add_edge("Comp2_X", "Goal", 4.0)
        desc = "Disconnected Graph: Goal is in an isolated component"
        return g, "Start", "Goal", desc

    elif preset_id == 4:
        # 4. Zero-Cost Edge
        g = Graph(directed=True)
        g.add_edge("Start", "FreePass", 0.0) # 0 weight
        g.add_edge("FreePass", "Goal", 4.0)  # Total 4
        g.add_edge("Start", "Standard", 2.0)
        g.add_edge("Standard", "Goal", 3.0)  # Total 5
        g.add_edge("Start", "Goal", 8.0)
        desc = "Zero-Cost Edge: Start->FreePass weight 0, correctly processed without loops"
        return g, "Start", "Goal", desc

    elif preset_id == 5:
        # 5. Negative Edge Weight (Error Case)
        g = Graph(directed=True)
        g.add_edge("Start", "A", 4.0)
        g.add_edge("A", "B", -3.0) # Negative weight!
        g.add_edge("B", "Goal", 2.0)
        g.add_edge("Start", "Goal", 8.0)
        desc = "Negative Edge Weight (Error Case): Edge A->B has weight -3"
        return g, "Start", "Goal", desc

    raise ValueError(f"Unknown preset {preset_id}")


def run_all_tests():
    print("=" * 70)
    print("RUNNING UNIFORM-COST SEARCH (UCS) PRESET VERIFICATION TEST SUITE")
    print("=" * 70)

    for pid in range(1, 6):
        g, start, goal, desc = get_preset_graph(pid)
        print(f"\n[Test Case {pid}] {desc}")
        result = uniform_cost_search(g, start, goal)

        if pid == 5:
            # Must fail with validation error
            assert not result["success"], "Preset 5 should fail due to negative weight"
            assert "Negative edge weight detected" in result["error"]
            print("  ✓ PASS: Correctly rejected negative edge weight with user-friendly error:")
            print(f"    Error: {result['error']}")
        elif pid == 3:
            # Must report unreachable
            assert not result["success"], "Preset 3 should fail due to disconnected graph"
            assert "unreachable" in result["error"].lower()
            print("  ✓ PASS: Correctly detected unreachable destination in disconnected graph:")
            print(f"    Status: {result['error']}")
            print(f"    Reachable nodes expanded: {result['expanded_nodes']}")
        else:
            assert result["success"], f"Preset {pid} failed: {result.get('error')}"
            bfs_res = breadth_first_search_fewest_hops(g, start, goal)
            print(f"  ✓ PASS: Path found: {' -> '.join(result['path'])}")
            print(f"    Cost: {result['cost']}, Hops: {result['hops']}, Stale skips: {result['stale_skips']}")
            if bfs_res:
                print(f"    [Comparison] BFS Fewest-Hop Path: {' -> '.join(bfs_res['path'])} (Hops: {bfs_res['hops']}, Cost: {bfs_res['cost']})")
                if pid == 1:
                    assert result["hops"] > bfs_res["hops"] and result["cost"] < bfs_res["cost"]
                    print("    >>> Visually proves: Fewest Edges (BFS) != Lowest Cost (UCS)!")

    stale_graph = Graph()
    stale_graph.add_edge("Start", "A", 10)
    stale_graph.add_edge("Start", "B", 1)
    stale_graph.add_edge("B", "A", 1)
    stale_graph.add_edge("A", "Goal", 20)
    stale_result = uniform_cost_search(stale_graph, "Start", "Goal")
    assert stale_result["success"] and stale_result["cost"] == 22
    assert stale_result["stale_skips"] == 1
    print("\n[Stale Entry Check] PASS: Outdated heap entries are discarded.")

    invalid_graph = Graph()
    invalid_graph.add_edge("Start", "Goal", float("inf"))
    invalid_result = uniform_cost_search(invalid_graph, "Start", "Goal")
    assert not invalid_result["success"] and "finite numeric weights" in invalid_result["error"]
    print("[Invalid Weight Check] PASS: Non-finite edge weights are rejected.")

    print("\n" + "=" * 70)
    print("ALL 5 CORE PRESET TESTS PASSED FLAWLESSLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
