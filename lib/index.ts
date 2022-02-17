/*
Copyright (c) 2012-2014 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
import layout from './layout';
import graphlib from 'graphlib';
import * as debug from './debug';
import { time, notime } from './util';
import version from './version';

export default {
  Graph: graphlib.Graph as unknown as Graphlib.Graph,
  layout,
  debug,
  util: {
    time,
    notime,
  },
  version,
};

export namespace Graphlib {
  export interface Graph<T = {}> {
    constructor(opt?: {
      directed?: boolean | undefined;
      multigraph?: boolean | undefined;
      compound?: boolean | undefined;
    }): any;

    graph(): GraphLabel;
    isDirected(): boolean;
    isMultiGraph(): boolean;
    setGraph(label: GraphLabel): Graph<T>;

    edge(edgeObj: Edge): GraphEdge;
    edge(outNodeName: string, inNodeName: string, name?: string): GraphEdge;
    edgeCount(): number;
    edges(): Edge[];
    hasEdge(edgeObj: Edge): boolean;
    hasEdge(outNodeName: string, inNodeName: string, name?: string): boolean;
    inEdges(inNodeName: string, outNodeName?: string): Edge[] | undefined;
    outEdges(outNodeName: string, inNodeName?: string): Edge[] | undefined;
    removeEdge(outNodeName: string, inNodeName: string): Graph<T>;
    setDefaultEdgeLabel(
      callback: string | ((v: string, w: string, name?: string) => string | Label),
    ): Graph<T>;
    setEdge(params: Edge, value?: string | { [key: string]: any }): Graph<T>;
    setEdge(sourceId: string, targetId: string, value?: string | Label, name?: string): Graph<T>;

    children(parentName: string): string | undefined;
    hasNode(name: string): boolean;
    neighbors(name: string): Array<Node<T>> | undefined;
    node(id: string | Label): Node<T>;
    nodeCount(): number;
    nodes(): string[];
    parent(childName: string): string | undefined;
    predecessors(name: string): Array<Node<T>> | undefined;
    removeNode(name: string): Graph<T>;
    filterNodes(callback: (nodeId: string) => boolean): Graph<T>;
    setDefaultNodeLabel(callback: string | ((nodeId: string) => string | Label)): Graph<T>;
    setNode(name: string, label: string | Label): Graph<T>;
    setParent(childName: string, parentName: string): void;
    sinks(): Array<Node<T>>;
    sources(): Array<Node<T>>;
    successors(name: string): Array<Node<T>> | undefined;
  }

  export interface json {
    read(graph: any): Graph;
    write(graph: Graph): any;
  }

  export interface alg {
    components(graph: Graph): string[][];
    dijkstra(graph: Graph, source: string, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    dijkstraAll(graph: Graph, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    findCycles(graph: Graph): string[][];
    floydWarchall(graph: Graph, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    isAcyclic(graph: Graph): boolean;
    postorder(graph: Graph, nodeNames: string | string[]): string[];
    preorder(graph: Graph, nodeNames: string | string[]): string[];
    prim<T>(graph: Graph<T>, weightFn?: WeightFn): Graph<T>;
    tarjam(graph: Graph): string[][];
    topsort(graph: Graph): string[];
  }
}

export interface Label {
  [key: string]: any;
}
export type WeightFn = (edge: Edge) => number;
export type EdgeFn = (outNodeName: string) => GraphEdge[];

export interface GraphLabel {
  width?: number | undefined;
  height?: number | undefined;
  compound?: boolean | undefined;
  rankdir?: string | undefined;
  align?: string | undefined;
  nodesep?: number | undefined;
  edgesep?: number | undefined;
  ranksep?: number | undefined;
  marginx?: number | undefined;
  marginy?: number | undefined;
  acyclicer?: string | undefined;
  ranker?: string | undefined;
}

export interface NodeConfig {
  width?: number | undefined;
  height?: number | undefined;
}

export interface EdgeConfig {
  minlen?: number | undefined;
  weight?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  lablepos?: 'l' | 'c' | 'r' | undefined;
  labeloffest?: number | undefined;
}

export interface Edge {
  v: string;
  w: string;
  name?: string | undefined;
}

export interface GraphEdge {
  points: Array<{ x: number; y: number }>;
  [key: string]: any;
}

export type Node<T = {}> = T & {
  x: number;
  y: number;
  width: number;
  height: number;
  class?: string | undefined;
  label?: string | undefined;
  padding?: number | undefined;
  paddingX?: number | undefined;
  paddingY?: number | undefined;
  rx?: number | undefined;
  ry?: number | undefined;
  shape?: string | undefined;
};
