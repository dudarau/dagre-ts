import { Edge, Graph } from 'graphlib';
import lodash from "../lodash";

export default function barycenter(g: Graph, movable: any) {
  return lodash.map(movable, function(v: any) {
    var inV = g.inEdges(v) as Edge[];
    if (!inV.length) {
      return { v: v };
    } else {
      var result = lodash.reduce(inV, function(acc: any, e: any) {
        var edge = g.edge(e),
            nodeU = g.node(e.v);
        return {
          sum: acc.sum + (edge.weight * nodeU.order),
          weight: acc.weight + edge.weight
        };
      }, { sum: 0, weight: 0 });

      return {
        v: v,
        barycenter: result.sum / result.weight,
        weight: result.weight
      };
    }
  });
}
