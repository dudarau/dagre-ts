import {Edge, Graph} from 'graphlib';
import { slack } from './util';
import lodash from "../lodash";

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
export function feasibleTree(g: Graph) {
  const t = new Graph({ directed: false });

  // Choose arbitrary node from which to start our tree
  const start = g.nodes()[0];
  const size = g.nodeCount();
  t.setNode(start, {});

  let edge;
  let delta;
  while (tightTree(t, g) < size) {
    edge = findMinSlackEdge(t, g);
    delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
    shiftRanks(t, g, delta);
  }

  return t;
}

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
function tightTree(t: any, g: Graph) {
  function dfs(v: any) {
    (g.nodeEdges(v) as Edge[]).forEach((e) => {
      const edgeV = e.v,
        w = v === edgeV ? e.w : edgeV;
      if (!t.hasNode(w) && !slack(g, e)) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  }

  t.nodes().forEach(dfs);
  return t.nodeCount();
}

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(t: any, g: Graph) {
  return lodash.minBy(g.edges(), function (e: any) {
    if (t.hasNode(e.v) !== t.hasNode(e.w)) {
      return slack(g, e);
    }
    return;
  });
}

function shiftRanks(t: any, g: Graph, delta: any) {
  t.nodes().forEach((v: any) => {
    g.node(v).rank += delta;
  });
}
