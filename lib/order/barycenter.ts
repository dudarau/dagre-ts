import { Edge, Graph } from 'graphlib';

export default function barycenter(g: Graph, movable: any) {
  return movable?.map((v: any) => {
    const inV = g.inEdges(v) as Edge[];
    if (!inV.length) {
      return { v: v };
    } else {
      const result = inV.reduce(
        (acc, e) => {
          const edge = g.edge(e),
            nodeU = g.node(e.v);
          return {
            sum: acc.sum + edge.weight * nodeU.order,
            weight: acc.weight + edge.weight,
          };
        },
        { sum: 0, weight: 0 },
      );

      return {
        v: v,
        barycenter: result.sum / result.weight,
        weight: result.weight,
      };
    }
  });
}
