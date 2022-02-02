import layout from './layout';
import { Graph } from 'graphlib';

describe('layout', function () {
  let g: Graph;

  beforeEach(function () {
    g = new Graph({ multigraph: true, compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(function () {
        return {};
      });
  });

  it('can layout a single node', function () {
    g.setNode('a', { width: 50, height: 100 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 100 / 2 },
    });
    expect(g.node('a').x).toBe(50 / 2);
    expect(g.node('a').y).toBe(100 / 2);
  });

  it('can layout two nodes on the same rank', function () {
    (g.graph() as any).nodesep = 200;
    g.setNode('a', { width: 50, height: 100 });
    g.setNode('b', { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });

  it('can layout two nodes connected by an edge', function () {
    (g.graph() as any).ranksep = 300;
    g.setNode('a', { width: 50, height: 100 });
    g.setNode('b', { width: 75, height: 200 });
    g.setEdge('a', 'b');
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 },
    });

    // We should not get x, y coordinates if the edge has no label
    expect(g.edge('a', 'b').x).toBeUndefined();
    expect(g.edge('a', 'b').y).toBeUndefined();
  });

  it('can layout an edge with a label', function () {
    (g.graph() as any).ranksep = 300;
    g.setNode('a', { width: 50, height: 100 });
    g.setNode('b', { width: 75, height: 200 });
    g.setEdge('a', 'b', { width: 60, height: 70, labelpos: 'c' });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 },
    });
    const { x, y } = g.edge('a', 'b');
    expect({ x, y }).toEqual({ x: 75 / 2, y: 100 + 150 + 70 / 2 });
  });

  describe('can layout an edge with a long label, with rankdir =', function () {
    ['TB', 'BT', 'LR', 'RL'].forEach(rankdir => {
      it(rankdir, function () {
        (g.graph() as any).nodesep = (g.graph() as any).edgesep = 10;
        (g.graph() as any).rankdir = rankdir;
        ['a', 'b', 'c', 'd'].forEach(v => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge('a', 'c', { width: 2000, height: 10, labelpos: 'c' });
        g.setEdge('b', 'd', { width: 1, height: 1 });
        layout(g);

        let p1, p2;
        if (rankdir === 'TB' || rankdir === 'BT') {
          p1 = g.edge('a', 'c');
          p2 = g.edge('b', 'd');
        } else {
          p1 = g.node('a');
          p2 = g.node('c');
        }

        expect(Math.abs(p1.x - p2.x)).toBeGreaterThan(1000);
      });
    });
  });

  describe('can apply an offset, with rankdir =', function () {
    ['TB', 'BT', 'LR', 'RL'].forEach(rankdir => {
      it(rankdir, function () {
        (g.graph() as any).nodesep = (g.graph() as any).edgesep = 10;
        (g.graph() as any).rankdir = rankdir;
        ['a', 'b', 'c', 'd'].forEach(v => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge('a', 'b', { width: 10, height: 10, labelpos: 'l', labeloffset: 1000 });
        g.setEdge('c', 'd', { width: 10, height: 10, labelpos: 'r', labeloffset: 1000 });
        layout(g);

        if (rankdir === 'TB' || rankdir === 'BT') {
          expect(g.edge('a', 'b').x - g.edge('a', 'b').points[0].x).toBe(-1000 - 10 / 2);
          expect(g.edge('c', 'd').x - g.edge('c', 'd').points[0].x).toBe(1000 + 10 / 2);
        } else {
          expect(g.edge('a', 'b').y - g.edge('a', 'b').points[0].y).toBe(-1000 - 10 / 2);
          expect(g.edge('c', 'd').y - g.edge('c', 'd').points[0].y).toBe(1000 + 10 / 2);
        }
      });
    });
  });

  it('can layout a long edge with a label', function () {
    (g.graph() as any).ranksep = 300;
    g.setNode('a', { width: 50, height: 100 });
    g.setNode('b', { width: 75, height: 200 });
    g.setEdge('a', 'b', { width: 60, height: 70, minlen: 2, labelpos: 'c' });
    layout(g);
    expect(g.edge('a', 'b').x).toBe(75 / 2);
    expect(g.edge('a', 'b').y).toBeGreaterThan(g.node('a').y);
    expect(g.edge('a', 'b').y).toBeLessThan(g.node('b').y);
  });

  it('can layout out a short cycle', function () {
    (g.graph() as any).ranksep = 200;
    g.setNode('a', { width: 100, height: 100 });
    g.setNode('b', { width: 100, height: 100 });
    g.setEdge('a', 'b', { weight: 2 });
    g.setEdge('b', 'a');
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2 },
    });
    // One arrow should point down, one up
    expect(g.edge('a', 'b').points[1].y).toBeGreaterThan(g.edge('a', 'b').points[0].y);
    expect(g.edge('b', 'a').points[0].y).toBeGreaterThan(g.edge('b', 'a').points[1].y);
  });

  it('adds rectangle intersects for edges', function () {
    (g.graph() as any).ranksep = 200;
    g.setNode('a', { width: 100, height: 100 });
    g.setNode('b', { width: 100, height: 100 });
    g.setEdge('a', 'b');
    layout(g);
    const points = g.edge('a', 'b').points;
    expect(points.length).toBe(3);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }, // intersect with top of b
    ]);
  });

  it('adds rectangle intersects for edges spanning multiple ranks', function () {
    (g.graph() as any).ranksep = 200;
    g.setNode('a', { width: 100, height: 100 });
    g.setNode('b', { width: 100, height: 100 });
    g.setEdge('a', 'b', { minlen: 2 });
    layout(g);
    const points = g.edge('a', 'b').points;
    expect(points.length).toBe(5);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }, // intersect with top of b
    ]);
  });

  describe('can layout a self loop', function () {
    ['TB', 'BT', 'LR', 'RL'].forEach(rankdir => {
      it('in rankdir = ' + rankdir, function () {
        (g.graph() as any).edgesep = 75;
        (g.graph() as any).rankdir = rankdir;
        g.setNode('a', { width: 100, height: 100 });
        g.setEdge('a', 'a', { width: 50, height: 50 });
        layout(g);
        const nodeA = g.node('a');
        const points = g.edge('a', 'a').points;
        expect(points.length).toBe(7);
        points.forEach((point: any) => {
          if (rankdir !== 'LR' && rankdir !== 'RL') {
            expect(point.x).toBeGreaterThan(nodeA.x);
            expect(Math.abs(point.y - nodeA.y)).toBeLessThanOrEqual(nodeA.height / 2);
          } else {
            expect(point.y).toBeGreaterThan(nodeA.y);
            expect(Math.abs(point.x - nodeA.x)).toBeLessThanOrEqual(nodeA.width / 2);
          }
        });
      });
    });
  });

  it('can layout a graph with subgraphs', function () {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.setNode('a', { width: 50, height: 50 });
    g.setParent('a', 'sg1');
    layout(g);
  });

  it('minimizes the height of subgraphs', function () {
    ['a', 'b', 'c', 'd', 'x', 'y'].forEach(v => {
      g.setNode(v, { width: 50, height: 50 });
    });
    g.setPath(['a', 'b', 'c', 'd']);
    g.setEdge('a', 'x', { weight: 100 });
    g.setEdge('y', 'd', { weight: 100 });
    g.setParent('x', 'sg');
    g.setParent('y', 'sg');

    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    layout(g);
    expect(g.node('x').y).toBe(g.node('y').y);
  });

  it('can layout subgraphs with different rankdirs', function () {
    g.setNode('a', { width: 50, height: 50 });
    g.setNode('sg', {});
    g.setParent('a', 'sg');

    // @ts-ignore
    function check(rankdir: any) {
      expect(g.node('sg').width).toBeGreaterThan(50);
      expect(g.node('sg').height).toBeGreaterThan(50);
      expect(g.node('sg').x).toBeGreaterThan(50 / 2);
      expect(g.node('sg').y).toBeGreaterThan(50 / 2);
    }

    ['tb', 'bt', 'lr', 'rl'].forEach(rankdir => {
      (g.graph() as any).rankdir = rankdir;
      layout(g);
      check(rankdir);
    });
  });

  it('adds dimensions to the graph', function () {
    g.setNode('a', { width: 100, height: 50 });
    layout(g);
    expect((g.graph() as any).width).toBe(100);
    expect((g.graph() as any).height).toBe(50);
  });

  describe('ensures all coordinates are in the bounding box for the graph', function () {
    ['TB', 'BT', 'LR', 'RL'].forEach(rankdir => {
      describe(rankdir, function () {
        beforeEach(function () {
          (g.graph() as any).rankdir = rankdir;
        });

        it('node', function () {
          g.setNode('a', { width: 100, height: 200 });
          layout(g);
          expect(g.node('a').x).toBe(100 / 2);
          expect(g.node('a').y).toBe(200 / 2);
        });

        it('edge, labelpos = l', function () {
          g.setNode('a', { width: 100, height: 100 });
          g.setNode('b', { width: 100, height: 100 });
          g.setEdge('a', 'b', {
            width: 1000,
            height: 2000,
            labelpos: 'l',
            labeloffset: 0,
          });
          layout(g);
          if (rankdir === 'TB' || rankdir === 'BT') {
            expect(g.edge('a', 'b').x).toBe(1000 / 2);
          } else {
            expect(g.edge('a', 'b').y).toBe(2000 / 2);
          }
        });
      });
    });
  });

  it.only('treats attributes with case-insensitivity', function () {
    (g.graph() as any).nodeSep = 200; // note the capital S
    g.setNode('a', { width: 50, height: 100 });
    g.setNode('b', { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });
});

function extractCoordinates(g: Graph) {
  const nodes = g.nodes();

  return nodes.reduce((acc: any, v: any) => {
    const { x, y } = g.node(v);
    return {
      ...acc,
      [v]: { x, y },
    };
  }, {});
}
