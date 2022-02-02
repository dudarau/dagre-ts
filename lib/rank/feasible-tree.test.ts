import { Graph } from 'graphlib';
import { feasibleTree } from './feasible-tree';

describe('feasibleTree', function () {
  it('creates a tree for a trivial input graph', function () {
    const g = new Graph()
      .setNode('a', { rank: 0 })
      .setNode('b', { rank: 1 })
      .setEdge('a', 'b', { minlen: 1 });

    const tree = feasibleTree(g);
    expect(g.node('b').rank).toBe(g.node('a').rank + 1);
    expect(tree.neighbors('a')).toEqual(['b']);
  });

  it('correctly shortens slack by pulling a node up', function () {
    const g = new Graph()
      .setNode('a', { rank: 0 })
      .setNode('b', { rank: 1 })
      .setNode('c', { rank: 2 })
      .setNode('d', { rank: 2 })
      .setPath(['a', 'b', 'c'], { minlen: 1 })
      .setEdge('a', 'd', { minlen: 1 });

    const tree = feasibleTree(g);
    expect(g.node('b').rank).toEqual(g.node('a').rank + 1);
    expect(g.node('c').rank).toEqual(g.node('b').rank + 1);
    expect(g.node('d').rank).toEqual(g.node('a').rank + 1);
    expect((tree.neighbors('a') as string[]).sort()).toEqual(['b', 'd']);
    expect((tree.neighbors('b') as string[]).sort()).toEqual(['a', 'c']);
    expect(tree.neighbors('c')).toEqual(['b']);
    expect(tree.neighbors('d')).toEqual(['a']);
  });

  it('correctly shortens slack by pulling a node down', function () {
    const g = new Graph()
      .setNode('a', { rank: 2 })
      .setNode('b', { rank: 0 })
      .setNode('c', { rank: 2 })
      .setEdge('b', 'a', { minlen: 1 })
      .setEdge('b', 'c', { minlen: 1 });

    const tree = feasibleTree(g);
    expect(g.node('a').rank).toEqual(g.node('b').rank + 1);
    expect(g.node('c').rank).toEqual(g.node('b').rank + 1);
    expect((tree.neighbors('a') as string[]).sort()).toEqual(['b']);
    expect((tree.neighbors('b') as string[]).sort()).toEqual(['a', 'c']);
    expect((tree.neighbors('c') as string[]).sort()).toEqual(['b']);
  });
});
