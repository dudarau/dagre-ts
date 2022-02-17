import { Edge, Graph } from 'graphlib';
import lodash from './lodash';

/*
 * Adds a dummy node to the graph and return v.
 */
export function addDummyNode(g: Graph, type: any, attrs: any, name: any) {
  let v;
  do {
    v = lodash.uniqueId(name);
  } while (g.hasNode(v));

  attrs.dummy = type;
  g.setNode(v, attrs);
  return v;
}

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
export function simplify(g: Graph) {
  const simplified = new Graph().setGraph(g.graph());
  g.nodes().forEach(v => {
    simplified.setNode(v, g.node(v));
  });
  g.edges().forEach(e => {
    const simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
    const label = g.edge(e);
    simplified.setEdge(e.v, e.w, {
      weight: simpleLabel.weight + label.weight,
      minlen: Math.max(simpleLabel.minlen, label.minlen),
    });
  });
  return simplified;
}

export function asNonCompoundGraph(g: Graph) {
  const simplified = new Graph({ multigraph: g.isMultigraph() }).setGraph(g.graph());
  g.nodes().forEach(v => {
    if (!g.children(v).length) {
      simplified.setNode(v, g.node(v));
    }
  });
  g.edges().forEach(e => {
    simplified.setEdge(e, g.edge(e));
  });
  return simplified;
}

export function successorWeights(g: Graph) {
  const weightMap = g.nodes().map(v => {
    const sucs = {} as any;
    (g.outEdges(v) as Edge[]).forEach(e => {
      sucs[e.w] = (sucs[e.w] || 0) + g.edge(e).weight;
    });
    return sucs;
  });
  return lodash.zipObject(g.nodes(), weightMap);
}

export function predecessorWeights(g: Graph) {
  const weightMap = g.nodes().map(v => {
    const preds = {} as any;
    (g.inEdges(v) as Edge[]).forEach(e => {
      preds[e.v] = (preds[e.v] || 0) + g.edge(e).weight;
    });
    return preds;
  });
  return lodash.zipObject(g.nodes(), weightMap);
}

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
export function intersectRect(rect: any, point: any) {
  const x = rect.x;
  const y = rect.y;

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  const dx = point.x - x;
  const dy = point.y - y;
  let w = rect.width / 2;
  let h = rect.height / 2;

  if (!dx && !dy) {
    throw new Error('Not possible to find intersection inside of the rectangle');
  }

  let sx;
  let sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = (h * dx) / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = (w * dy) / dx;
  }

  return { x: x + sx, y: y + sy };
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * function will produce a matrix with the ids of each node.
 */
export function buildLayerMatrix(g: Graph) {
  const layering = lodash.range(maxRank(g) + 1).map(() => {
    return [];
  }) as any;
  g.nodes().forEach(v => {
    const node = g.node(v);
    const rank = node.rank;
    if (rank !== undefined) {
      layering[rank][node.order] = v;
    }
  });
  return layering;
}

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
export function normalizeRanks(g: Graph) {
  const min = Math.min(
    ...g.nodes().map(v => {
      return g.node(v).rank;
    }).filter(value => !isNaN(Number(value))),
  );
  g.nodes().forEach(v => {
    const node = g.node(v);
    console.log(node, min)
    if (lodash.has(node, 'rank')) {
      node.rank -= min;
    }
  });
}

export function removeEmptyRanks(g: Graph) {
  // Ranks may not start at 0, so we need to offset them
  const offset = Math.min(
    ...g.nodes().map(v => {
      return g.node(v).rank;
    }),
  );

  const layers = [] as any[];

  g.nodes().forEach(v => {
    const rank = g.node(v).rank - offset;
    if (!layers[rank]) {
      layers[rank] = [];
    }
    layers[rank].push(v);
  });

  for(let i = 0; i< layers.length; i ++) {
    if (!layers[i]) {
      layers[i] = undefined;
    }
  }

  let delta = 0;
  const nodeRankFactor = (g.graph() as any).nodeRankFactor;
  layers.forEach((vs, i) => {
    if (typeof vs === 'undefined' && i % nodeRankFactor !== 0) {
      --delta;
    } else if (delta && vs) {
      vs.forEach((v: string) => {
        g.node(v).rank += delta;
      });
    }
  });
}

export function addBorderNode(g: Graph, prefix: any, rank?: any, order?: any) {
  const node = {
    width: 0,
    height: 0,
  } as any;
  if (arguments.length >= 4) {
    node.rank = rank;
    node.order = order;
  }
  return addDummyNode(g, 'border', node, prefix);
}

export function maxRank(g: Graph) {
  const ranks = g.nodes().map(v => {
    const rank = g.node(v).rank as number;
    if (rank !== undefined) {
      return rank;
    }

    return 0;
  });
  return Math.max(...ranks);
}

/*
 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
 * function returns true for an entry it goes into `lhs`. Otherwise it goes
 * into `rhs.
 */
export function partition(collection: any, fn: any) {
  const result = { lhs: [] as any[], rhs: [] as any[] };
  collection.forEach((value: any) => {
    if (fn(value)) {
      result.lhs.push(value);
    } else {
      result.rhs.push(value);
    }
  });
  return result;
}

/*
 * Returns a new function that wraps `fn` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
export function time(name: string, fn: any) {
  const start = Date.now();
  try {
    return fn();
  } finally {
    console.log(name + ' time: ' + (Date.now() - start) + 'ms');
  }
}

export function notime(name: string, fn: any) {
  console.log(name);
  return fn();
}
