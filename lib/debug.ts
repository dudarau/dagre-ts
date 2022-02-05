import { Graph } from 'graphlib';
import * as util from './util';
import lodash from './lodash';

/* istanbul ignore next */
export function debugOrdering(g: Graph) {
  const layerMatrix = util.buildLayerMatrix(g);

  const h = new Graph({ compound: true, multigraph: true }).setGraph({});

  g.nodes().forEach(v => {
    h.setNode(v, { label: v });
    h.setParent(v, 'layer' + g.node(v).rank);
  });

  g.edges().forEach(e => {
    h.setEdge(e.v, e.w, {}, e.name);
  });

  layerMatrix.forEach((layer: string, i: number) => {
    const layerV = 'layer' + i;
    h.setNode(layerV, { rank: 'same' });
    lodash.reduce(layer, function (u: any, v: any) {
      h.setEdge(u, v, { style: 'invis' });
      return v;
    });
  });

  return h;
}
