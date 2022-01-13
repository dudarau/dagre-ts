import { Graph } from 'graphlib';
import initOrder from './init-order';

describe('order/initOrder', function () {
  let g: Graph;

  beforeEach(function () {
    g = new Graph({ compound: true }).setDefaultEdgeLabel(function () {
      return { weight: 1 };
    });
  });

  it('assigns non-overlapping orders for each rank in a tree', function () {
    Object.entries({ a: 0, b: 1, c: 2, d: 2, e: 1 }).forEach((item) => {
      g.setNode(item[0], { rank: item[1] });
    });
    g.setPath(['a', 'b', 'c']);
    g.setEdge('b', 'd');
    g.setEdge('a', 'e');

    const layering = initOrder(g);
    expect(layering[0]).toEqual(['a']);
    expect(layering[1].sort()).toEqual(['b', 'e']);
    expect(layering[2].sort()).toEqual(['c', 'd']);
  });

  it('assigns non-overlapping orders for each rank in a DAG', function () {
    Object.entries({ a: 0, b: 1, c: 1, d: 2 }).forEach((item) => {
      g.setNode(item[0], { rank: item[1] });
    });
    g.setPath(['a', 'b', 'd']);
    g.setPath(['a', 'c', 'd']);

    const layering = initOrder(g);
    expect(layering[0]).toEqual(['a']);
    expect(layering[1].sort()).toEqual(['b', 'c']);
    expect(layering[2].sort()).toEqual(['d']);
  });

  it('does not assign an order to subgraph nodes', function () {
    g.setNode('a', { rank: 0 });
    g.setNode('sg1', {});
    g.setParent('a', 'sg1');

    const layering = initOrder(g);
    expect(layering).toEqual([['a']]);
  });
});
