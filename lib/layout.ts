import acyclic from './acyclic';
import * as normalize from './normalize';
import { rank } from './rank';
import { normalizeRanks, removeEmptyRanks } from './util';
import { parentDummyChains } from './parent-dummy-chains';
import * as nestingGraph from './nesting-graph';
import { addBorderSegments } from './add-border-segments';
import * as coordinateSystem from './coordinate-system';
import order from './order';
import position from './position';
import * as util from './util';
import { Edge, Graph } from 'graphlib';

export default layout;

function layout(g: Graph, opts?: any) {
  const time = opts && opts.debugTiming ? util.time : util.notime;
  time('layout', function () {
    const layoutGraph = time('  buildLayoutGraph', function () {
      return buildLayoutGraph(g);
    });
    time('  runLayout', function () {
      runLayout(layoutGraph, time);
    });
    time('  updateInputGraph', function () {
      updateInputGraph(g, layoutGraph);
    });
  });
}

function runLayout(g: Graph, time: (id: string, func: () => void) => void) {
  time('    makeSpaceForEdgeLabels', function () {
    makeSpaceForEdgeLabels(g);
  });
  time('    removeSelfEdges', function () {
    removeSelfEdges(g);
  });
  time('    acyclic', function () {
    acyclic.run(g);
  });
  time('    nestingGraph.run', function () {
    nestingGraph.run(g);
  });
  time('    rank', function () {
    rank(util.asNonCompoundGraph(g));
  });
  time('    injectEdgeLabelProxies', function () {
    injectEdgeLabelProxies(g);
  });
  time('    removeEmptyRanks', function () {
    removeEmptyRanks(g);
  });
  time('    nestingGraph.cleanup', function () {
    nestingGraph.cleanup(g);
  });
  time('    normalizeRanks', function () {
    normalizeRanks(g);
  });
  time('    assignRankMinMax', function () {
    assignRankMinMax(g);
  });
  time('    removeEdgeLabelProxies', function () {
    removeEdgeLabelProxies(g);
  });
  time('    normalize.run', function () {
    normalize.run(g);
  });
  time('    parentDummyChains', function () {
    parentDummyChains(g);
  });
  time('    addBorderSegments', function () {
    addBorderSegments(g);
  });
  time('    order', function () {
    order(g);
  });
  time('    insertSelfEdges', function () {
    insertSelfEdges(g);
  });
  time('    adjustCoordinateSystem', function () {
    coordinateSystem.adjust(g);
  });
  time('    position', function () {
    position(g);
  });
  time('    positionSelfEdges', function () {
    positionSelfEdges(g);
  });
  time('    removeBorderNodes', function () {
    removeBorderNodes(g);
  });
  time('    normalize.undo', function () {
    normalize.undo(g);
  });
  time('    fixupEdgeLabelCoords', function () {
    fixupEdgeLabelCoords(g);
  });
  time('    undoCoordinateSystem', function () {
    coordinateSystem.undo(g);
  });
  time('    translateGraph', function () {
    translateGraph(g);
  });
  time('    assignNodeIntersects', function () {
    assignNodeIntersects(g);
  });
  time('    reversePoints', function () {
    reversePointsForReversedEdges(g);
  });
  time('    acyclic.undo', function () {
    acyclic.undo(g);
  });
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(inputGraph: Graph, layoutGraph: Graph) {
  inputGraph.nodes().forEach(v => {
    const inputLabel = inputGraph.node(v);
    const layoutLabel = layoutGraph.node(v);

    if (inputLabel) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;

      if (layoutGraph.children(v).length) {
        inputLabel.width = layoutLabel.width;
        inputLabel.height = layoutLabel.height;
      }
    }
  });

  inputGraph.edges().forEach(e => {
    const inputLabel = inputGraph.edge(e);
    const layoutLabel = layoutGraph.edge(e);

    inputLabel.points = layoutLabel.points;
    if (Object.keys(layoutLabel).includes('x')) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
    }
  });

  (inputGraph.graph() as any).width = (layoutGraph.graph() as any).width;
  (inputGraph.graph() as any).height = (layoutGraph.graph() as any).height;
}

const graphNumAttrs = ['nodesep', 'edgesep', 'ranksep', 'marginx', 'marginy'];
const graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: 'tb' };
const graphAttrs = ['acyclicer', 'ranker', 'rankdir', 'align'];
const nodeNumAttrs = ['width', 'height'];
const nodeDefaults = { width: 0, height: 0 };
const edgeNumAttrs = ['minlen', 'weight', 'width', 'height', 'labeloffset'];
const edgeDefaults = {
  minlen: 1,
  weight: 1,
  width: 0,
  height: 0,
  labeloffset: 10,
  labelpos: 'r',
};
const edgeAttrs = ['labelpos'];

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph: Graph) {
  const g = new Graph({ multigraph: true, compound: true });
  const graph = canonicalize(inputGraph.graph());

  const newGraph = {
    ...graphDefaults,
    ...selectNumberAttrs(graph, graphNumAttrs),
    ...Object.keys(graphAttrs).reduce((acc, key) => {
      return {
        ...acc,
        ...graph[key],
      };
    }, {}),
  };

  g.setGraph(newGraph);

  inputGraph.nodes().forEach(v => {
    const node = canonicalize(inputGraph.node(v));

    const defaults = (...args: any[]) =>
      args.reverse().reduce((acc, obj) => ({ ...acc, ...obj }), {});
    g.setNode(v, defaults(selectNumberAttrs(node, nodeNumAttrs), nodeDefaults));
    g.setParent(v, inputGraph.parent(v) as string);
  });

  inputGraph.edges().forEach(e => {
    const edge = canonicalize(inputGraph.edge(e));
    const newEdge = {
      ...edgeDefaults,
      ...selectNumberAttrs(edge, edgeNumAttrs),
      ...Object.keys(edgeAttrs).reduce((acc, key) => {
        return {
          ...acc,
          ...edge[key],
        };
      }, {}),
    };
    g.setEdge(e, newEdge);
  });

  return g;
}

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
function makeSpaceForEdgeLabels(g: Graph) {
  const graph = g.graph() as any;
  graph.ranksep /= 2;
  g.edges().forEach((e: Edge) => {
    const edge = g.edge(e);
    edge.minlen *= 2;
    if (edge.labelpos.toLowerCase() !== 'c') {
      if (graph.rankdir === 'TB' || graph.rankdir === 'BT') {
        edge.width += edge.labeloffset;
      } else {
        edge.height += edge.labeloffset;
      }
    }
  });
}

/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
function injectEdgeLabelProxies(g: Graph) {
  g.edges().forEach((e: Edge) => {
    const edge = g.edge(e);
    if (edge.width && edge.height) {
      const v = g.node(e.v);
      const w = g.node(e.w);
      const label = { rank: (w.rank - v.rank) / 2 + v.rank, e: e };
      util.addDummyNode(g, 'edge-proxy', label, '_ep');
    }
  });
}

function assignRankMinMax(g: Graph) {
  let maxRank = 0;
  g.nodes().forEach(v => {
    const node = g.node(v);
    if (node.borderTop) {
      node.minRank = g.node(node.borderTop).rank;
      node.maxRank = g.node(node.borderBottom).rank;
      maxRank = Math.max(maxRank, node.maxRank);
    }
  });
  (g.graph() as any).maxRank = maxRank;
}

function removeEdgeLabelProxies(g: Graph) {
  g.nodes().forEach(v => {
    const node = g.node(v);
    if (node.dummy === 'edge-proxy') {
      g.edge(node.e).labelRank = node.rank;
      g.removeNode(v);
    }
  });
}

function translateGraph(g: Graph) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = 0;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = 0;
  const graphLabel = g.graph() as any;
  const marginX = graphLabel.marginx || 0;
  const marginY = graphLabel.marginy || 0;

  function getExtremes(attrs: any) {
    const x = attrs.x;
    const y = attrs.y;
    const w = attrs.width;
    const h = attrs.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  }

  g.nodes().forEach(v => {
    getExtremes(g.node(v));
  });
  g.edges().forEach(e => {
    const edge = g.edge(e);
    if (Object.keys(edge).includes('x')) {
      getExtremes(edge);
    }
  });

  minX -= marginX;
  minY -= marginY;

  g.nodes().forEach(v => {
    const node = g.node(v);
    node.x -= minX;
    node.y -= minY;
  });

  g.edges().forEach(e => {
    const edge = g.edge(e);
    edge.points.forEach((p: any) => {
      p.x -= minX;
      p.y -= minY;
    });
    if (Object.keys(edge).includes('x')) {
      edge.x -= minX;
    }
    if (Object.keys(edge).includes('y')) {
      edge.y -= minY;
    }
  });

  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}

function assignNodeIntersects(g: Graph) {
  g.edges().forEach((e: Edge) => {
    const edge = g.edge(e);
    const nodeV = g.node(e.v);
    const nodeW = g.node(e.w);
    let p1, p2;
    if (!edge.points) {
      edge.points = [];
      p1 = nodeW;
      p2 = nodeV;
    } else {
      p1 = edge.points[0];
      p2 = edge.points[edge.points.length - 1];
    }
    edge.points.unshift(util.intersectRect(nodeV, p1));
    edge.points.push(util.intersectRect(nodeW, p2));
  });
}

function fixupEdgeLabelCoords(g: Graph) {
  g.edges().forEach((e: Edge) => {
    const edge = g.edge(e);
    if (Object.keys(edge).includes('x')) {
      if (edge.labelpos === 'l' || edge.labelpos === 'r') {
        edge.width -= edge.labeloffset;
      }
      switch (edge.labelpos) {
        case 'l':
          edge.x -= edge.width / 2 + edge.labeloffset;
          break;
        case 'r':
          edge.x += edge.width / 2 + edge.labeloffset;
          break;
      }
    }
  });
}

function reversePointsForReversedEdges(g: Graph) {
  g.edges().forEach((e: Edge) => {
    const edge = g.edge(e);
    if (edge.reversed) {
      edge.points.reverse();
    }
  });
}

function removeBorderNodes(g: Graph) {
  g.nodes().forEach(v => {
    if (g.children(v).length) {
      const node = g.node(v);
      const t = g.node(node.borderTop);
      const b = g.node(node.borderBottom);
      const l = g.node(node.borderLeft[node.borderLeft.length - 1]);
      const r = g.node(node.borderRight[node.borderRight - 1]);

      node.width = Math.abs(r.x - l.x);
      node.height = Math.abs(b.y - t.y);
      node.x = l.x + node.width / 2;
      node.y = t.y + node.height / 2;
    }
  });

  g.nodes().forEach(v => {
    if (g.node(v).dummy === 'border') {
      g.removeNode(v);
    }
  });
}

function removeSelfEdges(g: Graph) {
  g.edges().forEach(e => {
    if (e.v === e.w) {
      const node = g.node(e.v);
      if (!node.selfEdges) {
        node.selfEdges = [];
      }
      node.selfEdges.push({ e: e, label: g.edge(e) });
      g.removeEdge(e);
    }
  });
}

function insertSelfEdges(g: Graph) {
  const layers = util.buildLayerMatrix(g);
  layers.forEach((layer: any) => {
    let orderShift = 0;
    Object.keys(layer).forEach((v, i) => {
      const node = g.node(v);
      node.order = i + orderShift;
      node.selfEdges.forEach((selfEdge: any) => {
        util.addDummyNode(
          g,
          'selfedge',
          {
            width: selfEdge.label.width,
            height: selfEdge.label.height,
            rank: node.rank,
            order: i + ++orderShift,
            e: selfEdge.e,
            label: selfEdge.label,
          },
          '_se',
        );
      });
      delete node.selfEdges;
    });
  });
}

function positionSelfEdges(g: Graph) {
  g.nodes().forEach(v => {
    const node = g.node(v);
    if (node.dummy === 'selfedge') {
      const selfNode = g.node(node.e.v);
      const x = selfNode.x + selfNode.width / 2;
      const y = selfNode.y;
      const dx = node.x - x;
      const dy = selfNode.height / 2;
      g.setEdge(node.e, node.label);
      g.removeNode(v);
      node.label.points = [
        { x: x + (2 * dx) / 3, y: y - dy },
        { x: x + (5 * dx) / 6, y: y - dy },
        { x: x + dx, y: y },
        { x: x + (5 * dx) / 6, y: y + dy },
        { x: x + (2 * dx) / 3, y: y + dy },
      ];
      node.label.x = node.x;
      node.label.y = node.y;
    }
  });
}

const mapValues = (obj: any, iterator: (arg: any) => any) =>
  Object.entries(obj).reduce((acc, [key, value]: [string, any]) => {
    acc[key] = iterator ? iterator(value.number) : value.number;
    return acc;
  }, {} as any);

const pick = (obj: any, attrs: any) =>
  Object.keys(attrs).reduce((acc, key) => {
    return {
      ...acc,
      ...obj[key],
    };
  }, {});

function selectNumberAttrs(obj: any, attrs: any) {
  return mapValues(pick(obj, attrs), Number);
}

function canonicalize(attrs: any) {
  const newAttrs = {} as any;
  Object.keys(attrs).forEach((v) => {
    newAttrs[v.toLowerCase()] = v;
  });
  return newAttrs;
}
