import { Graph } from 'graphlib';
import order from './index';
import crossCount from './cross-count';
import util from '../util';

describe('order', function () {
  let g: Graph;

  beforeEach(function () {
    g = new Graph().setDefaultEdgeLabel({ weight: 1 });
  });

  it('does not add crossings to a tree structure', function () {
    g.setNode('a', { rank: 1 });
    ['b', 'e'].forEach((v) => {
      g.setNode(v, { rank: 2 });
    });
    ['c', 'd', 'f'].forEach( (v) => {
      g.setNode(v, { rank: 3 });
    });
    g.setPath(['a', 'b', 'c']);
    g.setEdge('b', 'd');
    g.setPath(['a', 'e', 'f']);
    order(g);
    const layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBe(0);
  });

  it('can solve a simple graph', function () {
    // This graph resulted in a single crossing for previous versions of dagre.
    ['a', 'd'].forEach((v) => {
      g.setNode(v, { rank: 1 });
    });
    ['b', 'f', 'e'].forEach((v) => {
      g.setNode(v, { rank: 2 });
    });
    ['c', 'g'].forEach((v) => {
      g.setNode(v, { rank: 3 });
    });
    order(g);
    const layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBe(0);
  });

  it('can minimize crossings', function () {
    g.setNode('a', { rank: 1 });
    ['b', 'e', 'g'].forEach((v) => {
      g.setNode(v, { rank: 2 });
    });
    ['c', 'f', 'h'].forEach((v) => {
      g.setNode(v, { rank: 3 });
    });
    g.setNode('d', { rank: 4 });
    order(g);
    const layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBeLessThan(1);
  });
});
