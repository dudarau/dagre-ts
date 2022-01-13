import rank from './index';
import { Edge } from 'graphlib';
import { Graph } from 'graphlib';

describe('rank', function () {
  const RANKERS = ['longest-path', 'tight-tree', 'network-simplex', 'unknown-should-still-work'];
  let g: Graph;

  beforeEach(function () {
    g = new Graph()
      .setGraph({})
      .setDefaultNodeLabel(function () {
        return {};
      })
      .setDefaultEdgeLabel(function () {
        return { minlen: 1, weight: 1 };
      })
      .setPath(['a', 'b', 'c', 'd', 'h'])
      .setPath(['a', 'e', 'g', 'h'])
      .setPath(['a', 'f', 'g']);
  });

  RANKERS.forEach(ranker => {
    describe(ranker, function () {
      it('respects the minlen attribute', function () {
        (g.graph() as any).ranker = ranker;
        rank(g);
        g.edges().forEach((e: Edge) => {
          var vRank = g.node(e.v).rank;
          var wRank = g.node(e.w).rank;
          expect(wRank - vRank).toBeGreaterThanOrEqual(g.edge(e).minlen);
        });
      });

      it('can rank a single node graph', function () {
        var g = new Graph().setGraph({}).setNode('a', {});
        rank(g);
        expect(g.node('a').rank).toBe(0);
      });
    });
  });
});
