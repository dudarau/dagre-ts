import * as util from './util';
import lodash from './lodash';
import { Graph } from 'graphlib';

export function addBorderSegments(g: Graph) {
  function dfs(v: any) {
    const children = g.children(v);
    const node = g.node(v);
    if (children.length) {
      children.forEach(dfs);
    }

    if (lodash.has(node, 'minRank')) {
      node.borderLeft = [];
      node.borderRight = [];
      for (let rank = node.minRank, maxRank = node.maxRank + 1; rank < maxRank; ++rank) {
        addBorderNode(g, 'borderLeft', '_bl', v, node, rank);
        addBorderNode(g, 'borderRight', '_br', v, node, rank);
      }
    }
  }

  g.children().forEach(dfs);
}

function addBorderNode(g: Graph, prop: any, prefix: any, sg: any, sgNode: any, rank: any) {
  const label = { width: 0, height: 0, rank: rank, borderType: prop };
  const prev = sgNode[prop][rank - 1];
  const curr = util.addDummyNode(g, 'border', label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, { weight: 1 });
  }
}
