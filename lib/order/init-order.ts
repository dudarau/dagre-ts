/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
import { Graph } from 'graphlib';
import lodash from '../lodash';

export default function initOrder(g: Graph) {
  const visited = {} as any;
  const simpleNodes = g.nodes().filter(v => {
    return !g.children(v).length;
  });
  const maxRank = Math.max(
    ...simpleNodes.map((v: string) => {
      return g.node(v).rank;
    }),
  );
  const layers = lodash.range(maxRank + 1).map(() => {
    return [];
  });

  function dfs(v: any) {
    if (lodash.has(visited, v)) return;
    visited[v] = true;
    const node = g.node(v);
    layers[node.rank].push(v);
    (g.successors(v) as any[]).forEach(dfs);
  }

  const orderedVs = lodash.sortBy(simpleNodes, function (v: any) {
    return g.node(v).rank;
  });
  orderedVs.forEach(dfs);

  return layers;
}
