import { Edge, Graph } from 'graphlib';
import lodash from './lodash';

export function adjust(g: Graph) {
  const rankDir = (g.graph() as any).rankdir.toLowerCase();
  if (rankDir === 'lr' || rankDir === 'rl') {
    swapWidthHeight(g);
  }
}

export function undo(g: Graph) {
  const rankDir = (g.graph() as any).rankdir.toLowerCase();
  if (rankDir === 'bt' || rankDir === 'rl') {
    reverseY(g);
  }

  if (rankDir === 'lr' || rankDir === 'rl') {
    swapXY(g);
    swapWidthHeight(g);
  }
}

function swapWidthHeight(g: Graph) {
  g.nodes().forEach(v => {
    swapWidthHeightOne(g.node(v));
  });
  g.edges().forEach((e: Edge) => {
    swapWidthHeightOne(g.edge(e));
  });
}

function swapWidthHeightOne(attrs: any) {
  const w = attrs.width;
  attrs.width = attrs.height;
  attrs.height = w;
}

function reverseY(g: Graph) {
  g.nodes().forEach(v => {
    reverseYOne(g.node(v));
  });

  g.edges().forEach(e => {
    const edge = g.edge(e);
    edge.points.forEach(reverseYOne);
    if (lodash.has(edge, 'y')) {
      reverseYOne(edge);
    }
  });
}

function reverseYOne(attrs: any) {
  attrs.y = -attrs.y;
}

function swapXY(g: Graph) {
  g.nodes().forEach(v => {
    swapXYOne(g.node(v));
  });

  g.edges().forEach(e => {
    const edge = g.edge(e);
    edge.points.forEach(swapXYOne);
    if (lodash.has(edge, 'x')) {
      swapXYOne(edge);
    }
  });
}

function swapXYOne(attrs: any) {
  const x = attrs.x;
  attrs.x = attrs.y;
  attrs.y = x;
}
