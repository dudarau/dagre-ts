import { Edge, Graph } from 'graphlib';
import { alg } from 'graphlib';
import nestingGraph from './nesting-graph';

describe('rank/nestingGraph', function () {
  let g: Graph;

  beforeEach(function () {
    g = new Graph({ compound: true }).setGraph({}).setDefaultNodeLabel(function () {
      return {};
    });
  });

  describe('run', function () {
    it('connects a disconnected graph', function () {
      g.setNode('a');
      g.setNode('b');
      expect(alg.components(g).length).toBe(2);
      nestingGraph.run(g);
      expect(alg.components(g).length).toBe(1);
      expect(g.hasNode('a'));
      expect(g.hasNode('b'));
    });

    it('adds border nodes to the top and bottom of a subgraph', function () {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const borderTop = g.node('sg1').borderTop;
      const borderBottom = g.node('sg1').borderBottom;
      expect(borderTop).not.toBeUndefined();
      expect(borderBottom).not.toBeUndefined();
      expect(g.parent(borderTop)).toBe('sg1');
      expect(g.parent(borderBottom)).toBe('sg1');
      expect((g.outEdges(borderTop, 'a') as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(borderTop, 'a') as Edge[])[0]).minlen).toBe(1);
      expect((g.outEdges('a', borderBottom) as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges('a', borderBottom) as Edge[])[0]).minlen).toBe(1);
      expect(g.node(borderTop)).toEqual({ width: 0, height: 0, dummy: 'border' });
      expect(g.node(borderBottom)).toEqual({ width: 0, height: 0, dummy: 'border' });
    });

    it('adds edges between borders of nested subgraphs', function () {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      nestingGraph.run(g);

      const sg1Top = g.node('sg1').borderTop;
      const sg1Bottom = g.node('sg1').borderBottom;
      const sg2Top = g.node('sg2').borderTop;
      const sg2Bottom = g.node('sg2').borderBottom;
      expect(sg1Top).not.toBeUndefined();
      expect(sg1Bottom).not.toBeUndefined();
      expect(sg2Top).not.toBeUndefined();
      expect(sg2Bottom).not.toBeUndefined();
      expect((g.outEdges(sg1Top, sg2Top) as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(sg1Top, sg2Top) as Edge[])[0]).minlen).toBe(1);
      expect((g.outEdges(sg2Bottom, sg1Bottom)as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(sg2Bottom, sg1Bottom) as Edge[])[0]).minlen).toBe(1);
    });

    it('adds sufficient weight to border to node edges', function () {
      // We want to keep subgraphs tight, so we should ensure that the weight for
      // the edge between the top (and bottom) border nodes and nodes in the
      // subgraph have weights exceeding anything in the graph.
      g.setParent('x', 'sg');
      g.setEdge('a', 'x', { weight: 100 });
      g.setEdge('x', 'b', { weight: 200 });
      nestingGraph.run(g);

      const top = g.node('sg').borderTop;
      const bot = g.node('sg').borderBottom;
      expect(g.edge(top, 'x').weight).toBeGreaterThan(300);
      expect(g.edge('x', bot).weight).toBeGreaterThan(300);
    });

    it('adds an edge from the root to the tops of top-level subgraphs', function () {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const root = (g.graph() as any).nestingRoot;
      const borderTop = g.node('sg1').borderTop;
      expect(root).not.toBeUndefined();
      expect(borderTop).not.toBeUndefined();
      expect((g.outEdges(root, borderTop) as Edge[]).length).toBe(1);
      expect(g.hasEdge((g.outEdges(root, borderTop) as Edge[])[0])).toBeTruthy();
    });

    it('adds an edge from root to each node with the correct minlen #1', function () {
      g.setNode('a');
      nestingGraph.run(g);

      const root = (g.graph() as any).nestingRoot;
      expect(root).not.toBeUndefined();
      expect((g.outEdges(root, 'a') as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(root, 'a') as Edge[])[0])).toEqual({ weight: 0, minlen: 1 });
    });

    it('adds an edge from root to each node with the correct minlen #2', function () {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const root = (g.graph() as any).nestingRoot;
      expect(root).not.toBeUndefined();
      expect((g.outEdges(root, 'a') as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(root, 'a') as Edge[])[0])).toEqual({ weight: 0, minlen: 3 });
    });

    it('adds an edge from root to each node with the correct minlen #3', function () {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      nestingGraph.run(g);

      const root = (g.graph() as any).nestingRoot;
      expect(root).not.toBeUndefined();
      expect((g.outEdges(root, 'a') as Edge[]).length).toBe(1);
      expect(g.edge((g.outEdges(root, 'a') as Edge[])[0])).toEqual({ weight: 0, minlen: 5 });
    });

    it('does not add an edge from the root to itself', function () {
      g.setNode('a');
      nestingGraph.run(g);

      const root = (g.graph() as any).nestingRoot;
      expect(g.outEdges(root, root)).toEqual([]);
    });

    it('expands inter-node edges to separate SG border and nodes #1', function () {
      g.setEdge('a', 'b', { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minlen).toBe(1);
    });

    it('expands inter-node edges to separate SG border and nodes #2', function () {
      g.setParent('a', 'sg1');
      g.setEdge('a', 'b', { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minlen).toBe(3);
    });

    it('expands inter-node edges to separate SG border and nodes #3', function () {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      g.setEdge('a', 'b', { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minlen).toBe(5);
    });

    it('sets minlen correctly for nested SG boder to children', function () {
      g.setParent('a', 'sg1');
      g.setParent('sg2', 'sg1');
      g.setParent('b', 'sg2');
      nestingGraph.run(g);

      // We expect the following layering:
      //
      // 0: root
      // 1: empty (close sg2)
      // 2: empty (close sg1)
      // 3: open sg1
      // 4: open sg2
      // 5: a, b
      // 6: close sg2
      // 7: close sg1

      const root = (g.graph() as any).nestingRoot;
      const sg1Top = g.node('sg1').borderTop;
      const sg1Bot = g.node('sg1').borderBottom;
      const sg2Top = g.node('sg2').borderTop;
      const sg2Bot = g.node('sg2').borderBottom;

      expect(g.edge(root, sg1Top).minlen).toBe(3);
      expect(g.edge(sg1Top, sg2Top).minlen).toBe(1);
      expect(g.edge(sg1Top, 'a').minlen).toBe(2);
      expect(g.edge('a', sg1Bot).minlen).toBe(2);
      expect(g.edge(sg2Top, 'b').minlen).toBe(1);
      expect(g.edge('b', sg2Bot).minlen).toBe(1);
      expect(g.edge(sg2Bot, sg1Bot).minlen).toBe(1);
    });
  });

  describe('cleanup', function () {
    it('removes nesting graph edges', function () {
      g.setParent('a', 'sg1');
      g.setEdge('a', 'b', { minlen: 1 });
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.successors('a')).toEqual(['b']);
    });

    it('removes the root node', function () {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.nodeCount()).toBe(4); // sg1 + sg1Top + sg1Bottom + "a"
    });
  });
});
