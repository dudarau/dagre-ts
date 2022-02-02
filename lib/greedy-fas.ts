import { Edge, Graph } from 'graphlib';
import List from './data/list';

/*
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 */

const DEFAULT_WEIGHT_FN = () => 1;

function greedyFAS(g: Graph, weightFn?: (e: Edge) => any): Edge[] {
  if (g.nodeCount() <= 1) {
    return [];
  }
  const state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
  const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

  // Expand multi-edges
  return results
    .map(e => {
      return g.outEdges(e.v, e.w);
    })
    .reduce((acc, value) => {
      if (acc) {
        return acc.concat(value as Edge[], []);
      }

      return acc;
    }, []) as Edge[];
}

function doGreedyFAS(g: Graph, buckets: any, zeroIdx: any) {
  let results: any[] = [];
  const sources = buckets[buckets.length - 1];
  const sinks = buckets[0];

  let entry;
  while (g.nodeCount()) {
    while ((entry = sinks.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    while ((entry = sources.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    if (g.nodeCount()) {
      for (let i = buckets.length - 2; i > 0; --i) {
        entry = buckets[i].dequeue();
        if (entry) {
          results = results.concat(removeNode(g, buckets, zeroIdx, entry, true));
          break;
        }
      }
    }
  }

  return results;
}

function removeNode(g: Graph, buckets: any, zeroIdx: any, entry: any, collectPredecessors?: any) {
  let results: Edge[] | undefined = collectPredecessors ? [] : undefined;

  const inEdges = g.inEdges(entry.v);
  const outEdges = g.outEdges(entry.v);

  if (inEdges) {
    inEdges.forEach((edge: Edge) => {
      const weight = g.edge(edge);
      const uEntry = g.node(edge.v);

      if (collectPredecessors) {
        if (!results) {
          results = [];
        }
        results.push({ v: edge.v, w: edge.w });
      }

      uEntry.out -= weight;
      assignBucket(buckets, zeroIdx, uEntry);
    });
  }

  if (outEdges) {
    outEdges.forEach((edge: Edge) => {
      const weight = g.edge(edge);
      const w = edge.w;
      const wEntry = g.node(w);
      wEntry['in'] -= weight;
      assignBucket(buckets, zeroIdx, wEntry);
    });
  }

  g.removeNode(entry.v);

  return results;
}

function buildState(g: Graph, weightFn: (e: Edge) => any) {
  const fasGraph = new Graph();
  let maxIn = 0;
  let maxOut = 0;

  g.nodes().forEach((v: string) => {
    fasGraph.setNode(v, { v: v, in: 0, out: 0 });
  });

  // Aggregate weights on nodes, but also sum the weights across multi-edges
  // into a single edge for the fasGraph.
  g.edges().forEach((e: Edge) => {
    const prevWeight = fasGraph.edge(e.v, e.w) || 0;
    const weight = weightFn(e);
    const edgeWeight = prevWeight + weight;
    fasGraph.setEdge(e.v, e.w, edgeWeight);
    maxOut = Math.max(maxOut, (fasGraph.node(e.v).out += weight));
    maxIn = Math.max(maxIn, (fasGraph.node(e.w)['in'] += weight));
  });

  const buckets = Array.apply(null, Array(maxOut + maxIn + 3)).map(function () {
    return new List();
  });
  const zeroIdx = maxIn + 1;

  fasGraph.nodes().forEach(v => {
    assignBucket(buckets, zeroIdx, fasGraph.node(v));
  });

  return { graph: fasGraph, buckets: buckets, zeroIdx: zeroIdx };
}

function assignBucket(buckets: any, zeroIdx: any, entry: any) {
  if (!entry.out) {
    buckets[0].enqueue(entry);
  } else if (!entry['in']) {
    buckets[buckets.length - 1].enqueue(entry);
  } else {
    buckets[entry.out - entry['in'] + zeroIdx].enqueue(entry);
  }
}

export default greedyFAS;
