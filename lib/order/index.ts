import initOrder from './init-order';
import crossCount from './cross-count';
import sortSubgraph from './sort-subgraph';
import buildLayerGraph from './build-layer-graph';
import addSubgraphConstraints from './add-subgraph-constraints';
import { Graph } from 'graphlib';
import * as util from '../util';
import lodash from "../lodash";

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
export default function order(g: Graph) {
  const maxRank = util.maxRank(g);
  const downLayerGraphs = buildLayerGraphs(g, lodash.range(1, maxRank + 1), 'inEdges');
  const upLayerGraphs = buildLayerGraphs(g, lodash.range(maxRank - 1, -1, -1), 'outEdges');

  let layering = initOrder(g);
  assignOrder(g, layering);

  let bestCC = Number.POSITIVE_INFINITY;
  let best;

  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

    layering = util.buildLayerMatrix(g);
    const cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = lodash.cloneDeep(layering);
      bestCC = cc;
    }
  }

  assignOrder(g, best);
}

function buildLayerGraphs(g: Graph, ranks: any, relationship: any) {
  return ranks.map((rank: string) => {
    return buildLayerGraph(g, rank, relationship);
  });
}

function sweepLayerGraphs(layerGraphs: Graph[], biasRight: any) {
  const cg = new Graph();
  layerGraphs.forEach(lg => {
    const root = (lg.graph() as any).root;
    const sorted = sortSubgraph(lg, root, cg, biasRight);
    sorted.vs.forEach((v: any, i: any) => {
      lg.node(v).order = i;
    });
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
}

function assignOrder(g: Graph, layering: any) {
  layering.forEach((layer: any) => {
    layer.forEach((v: any, i: number) => {
      g.node(v).order = i;
    });
  });
}
