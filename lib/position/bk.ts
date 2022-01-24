import { Edge, Graph } from 'graphlib';
import * as util from '../util';
import lodash from '../lodash';

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

/*
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 */
export function findType1Conflicts(g: Graph, layering: any) {
  const conflicts = {};

  function visitLayer(prevLayer: any, layer: any) {
    let // last visited node in the previous layer that is incident on an inner
      // segment.
      k0 = 0;
    // Tracks the last node in this layer scanned for crossings with a type-1
    // segment.
    let scanPos = 0;
    let prevLayerLength = prevLayer.length;
    let lastNode = lodash.last(layer);

    layer.forEach((v: any, i: number) => {
      const w = findOtherInnerSegmentNode(g, v),
        k1 = w ? g.node(w).order : prevLayerLength;

      if (w || v === lastNode) {
        layer.slice(scanPos, i + 1).forEach((scanNode: any) => {
          (g.predecessors(scanNode) as string[]).forEach((u: any) => {
            const uLabel = g.node(u),
              uPos = uLabel.order;
            if ((uPos < k0 || k1 < uPos) && !(uLabel.dummy && g.node(scanNode).dummy)) {
              addConflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  }

  layering.reduce(visitLayer);
  return conflicts;
}

export function findType2Conflicts(g: Graph, layering: any) {
  const conflicts = {};

  function scan(
    south: any,
    southPos: any,
    southEnd: any,
    prevNorthBorder: any,
    nextNorthBorder: any,
  ) {
    let v: any;
    lodash.range(southPos, southEnd).forEach((i: string) => {
      v = south[i];
      if (g.node(v).dummy) {
        (g.predecessors(v) as string[]).forEach(u => {
          const uNode = g.node(u);
          if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
            addConflict(conflicts, u, v);
          }
        });
      }
    });
  }

  function visitLayer(north: any, south: any) {
    let prevNorthPos = -1;
    let nextNorthPos: any;
    let southPos = 0;

    south.forEach((v: any, southLookahead: any) => {
      if (g.node(v).dummy === 'border') {
        const predecessors = g.predecessors(v) as string[];
        if (predecessors.length) {
          nextNorthPos = g.node(predecessors[0]).order;
          scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
          southPos = southLookahead;
          prevNorthPos = nextNorthPos;
        }
      }
      scan(south, southPos, south.length, nextNorthPos, north.length);
    });

    return south;
  }

  layering.reduce(visitLayer);
  return conflicts;
}

function findOtherInnerSegmentNode(g: Graph, v: any) {
  if (g.node(v).dummy) {
    return lodash.find(g.predecessors(v), function (u: any) {
      return g.node(u).dummy;
    });
  }
}

export function addConflict(conflicts: any, v: any, w: any) {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }

  let conflictsV = conflicts[v];
  if (!conflictsV) {
    conflicts[v] = conflictsV = {};
  }
  conflictsV[w] = true;
}

export function hasConflict(conflicts: any, v: any, w: any) {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }
  return lodash.has(conflicts[v], w);
}

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
export function verticalAlignment(g: Graph, layering: any, conflicts: any, neighborFn: any) {
  const root = {} as any;
  const align = {} as any;
  const pos = {} as any;

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  layering.forEach((layer: any) => {
    layer.forEach((v: any, order: any) => {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  layering.forEach((layer: any) => {
    let prevIdx = -1;
    layer.forEach((v: any) => {
      let ws = neighborFn(v);
      if (ws.length) {
        ws = lodash.sortBy(ws, function (w: any) {
          return pos[w];
        });
        const mp = (ws.length - 1) / 2;
        for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          const w = ws[i];
          if (align[v] === v && prevIdx < pos[w] && !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });

  return { root: root, align: align };
}

export function horizontalCompaction(
  g: Graph,
  layering: any,
  root: any,
  align: any,
  reverseSep?: any,
) {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.
  const xs = {} as any;
  const blockG = buildBlockGraph(g, layering, root, reverseSep);
  const borderType = reverseSep ? 'borderLeft' : 'borderRight';

  function iterate(setXsFunc: any, nextNodesFunc: any) {
    let stack = blockG.nodes();
    let elem = stack.pop();
    const visited = {} as any;
    while (elem) {
      if (visited[elem]) {
        setXsFunc(elem);
      } else {
        visited[elem] = true;
        stack.push(elem);
        stack = stack.concat(nextNodesFunc(elem));
      }

      elem = stack.pop();
    }
  }

  // First pass, assign smallest coordinates
  function pass1(elem: any) {
    xs[elem] = (blockG.inEdges(elem) as Edge[]).reduce(function (acc, e) {
      return Math.max(acc, xs[e.v] + blockG.edge(e));
    }, 0);
  }

  // Second pass, assign greatest coordinates
  function pass2(elem: any) {
    const min = (blockG.outEdges(elem) as Edge[]).reduce(function (acc, e) {
      return Math.min(acc, xs[e.w] - blockG.edge(e));
    }, Number.POSITIVE_INFINITY);

    const node = g.node(elem);
    if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
      xs[elem] = Math.max(xs[elem], min);
    }
  }

  iterate(pass1, blockG.predecessors.bind(blockG));
  iterate(pass2, blockG.successors.bind(blockG));

  // Assign x coordinates to all nodes
  lodash.forEach(align, function(v: any) {
    xs[v] = xs[root[v]];
  });

  return xs;
}

function buildBlockGraph(g: Graph, layering: any, root: any, reverseSep: any) {
  const blockGraph = new Graph();
  const graphLabel = g.graph() as any;
  const sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);

  layering.forEach((layer: any) => {
    let u: any;
    layer.forEach((v: any) => {
      const vRoot = root[v];
      blockGraph.setNode(vRoot);
      if (u) {
        const uRoot = root[u],
          prevMax = blockGraph.edge(uRoot, vRoot);
        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
      }
      u = v;
    });
  });

  return blockGraph;
}

/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
export function findSmallestWidthAlignment(g: Graph, xss: any) {
  return lodash.minBy(lodash.values(xss), function (xs: any) {
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;

    lodash.forIn(xs, function (x: any, v: any) {
      const halfWidth = width(g, v) / 2;

      max = Math.max(x + halfWidth, max);
      min = Math.min(x - halfWidth, min);
    });

    return max - min;
  });
}

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
export function alignCoordinates(xss: any, alignTo: any) {
  const alignToVals = lodash.values(alignTo),
    alignToMin = Math.min(...alignToVals),
    alignToMax = Math.max(...alignToVals);

  ['u', 'd'].forEach(vert => {
    ['l', 'r'].forEach(horiz => {
      const alignment = vert + horiz;
      const xs = xss[alignment];
      let delta: any;
      if (xs === alignTo) return;

      const xsVals = lodash.values(xs);
      delta = horiz === 'l' ? alignToMin - Math.min(...xsVals) : alignToMax - Math.max(...xsVals);

      if (delta) {
        xss[alignment] = lodash.mapValues(xs, function (x: any) {
          return x + delta;
        });
      }
    });
  });
}

export function balance(xss: any, align?: any) {
  return lodash.mapValues(xss.ul, function (ignore: any, v: any) {
    if (align) {
      return xss[align.toLowerCase()][v];
    } else {
      const xs = lodash.sortBy(lodash.map(xss, v));
      return (xs[1] + xs[2]) / 2;
    }
  });
}

export function positionX(g: Graph) {
  const layering = util.buildLayerMatrix(g);
  const conflicts = lodash.merge(findType1Conflicts(g, layering), findType2Conflicts(g, layering));

  const xss = {} as any;
  let adjustedLayering: any;
  ['u', 'd'].forEach(vert => {
    adjustedLayering = vert === 'u' ? layering : lodash.values(layering).reverse();
    ['l', 'r'].forEach(horiz => {
      if (horiz === 'r') {
        adjustedLayering = adjustedLayering.map((inner: any) => {
          return lodash.values(inner).reverse();
        });
      }

      const neighborFn = (vert === 'u' ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      let xs = horizontalCompaction(g, adjustedLayering, align.root, align.align, horiz === 'r');
      if (horiz === 'r') {
        xs = lodash.mapValues(xs, function (x: any) {
          return -x;
        });
      }
      xss[vert + horiz] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, (g.graph() as any).align);
}

function sep(nodeSep: any, edgeSep: any, reverseSep: any) {
  return function (g: any, v: any, w: any) {
    const vLabel = g.node(v);
    const wLabel = g.node(w);
    let sum = 0;
    let delta;

    sum += vLabel.width / 2;
    if (lodash.has(vLabel, 'labelpos')) {
      switch (vLabel.labelpos.toLowerCase()) {
        case 'l':
          delta = -vLabel.width / 2;
          break;
        case 'r':
          delta = vLabel.width / 2;
          break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
    sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

    sum += wLabel.width / 2;
    if (lodash.has(wLabel, 'labelpos')) {
      switch (wLabel.labelpos.toLowerCase()) {
        case 'l':
          delta = wLabel.width / 2;
          break;
        case 'r':
          delta = -wLabel.width / 2;
          break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    return sum;
  };
}

function width(g: Graph, v: any) {
  return g.node(v).width;
}
