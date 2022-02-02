import greedyFAS from './greedy-fas';
import { Edge, Graph } from 'graphlib';

export default {
  run: run,
  undo: undo,
};

export function run(g: Graph) {
  const fas = (g.graph() as any).acyclicer === 'greedy' ? greedyFAS(g, weightFn(g)) : dfsFAS(g);
  fas.forEach(e => {
    const label = g.edge(e);
    g.removeEdge(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, 'rev');
  });

  function weightFn(g: Graph) {
    return function (e: Edge) {
      return g.edge(e).weight;
    };
  }
}

function dfsFAS(g: Graph) {
  const fas: any[] = [];
  const stack: any = {};
  const visited: any = {};

  function dfs(v: string) {
    if (Object.keys(visited).includes(v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    (g.outEdges(v) as Edge[]).forEach((e) => {
      if (Object.keys(stack).includes(e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  }

  g.nodes().forEach(dfs);
  return fas;
}

function undo(g: Graph) {
  g.edges().forEach((e) => {
    const label = g.edge(e);
    if (label.reversed) {
      g.removeEdge(e);

      const forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
}
