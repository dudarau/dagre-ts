import * as util from '../util';
import { positionX } from './bk';
import { Graph } from 'graphlib';
import lodash from '../lodash';

export default function position(g: Graph) {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  lodash.forEach(positionX(g), (x: any, v: any) => {
    g.node(v).x = x;
  });
}

function positionY(g: Graph) {
  const layering = util.buildLayerMatrix(g);
  const rankSep = (g.graph() as any).ranksep;
  let prevY = 0;
  layering.forEach((layer: any) => {
    const maxHeight = Math.max(
      ...layer.map((v: any) => {
        return g.node(v).height;
      }),
    );
    layer.forEach((v: any) => {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
}
