import barycenter from './barycenter';
import resolveConflicts from './resolve-conflicts';
import sort from './sort';
import { Graph } from 'graphlib';
import lodash from '../lodash';

export default function sortSubgraph(g: Graph, v: any, cg: any, biasRight?: any) {
  let movable = g.children(v);
  const node = g.node(v);
  console.log('***', node, movable);
  const bl = node ? node.borderLeft : undefined;
  const br = node ? node.borderRight : undefined;
  const subgraphs = {} as any;

  console.log('****', 'movable', movable, bl, br);

  if (bl) {
    movable = movable.filter(w => {
      console.log('movable filter', w, bl, br);
      return w !== bl && w !== br;
    });
  }

  console.log('*****', movable);

  const barycenters = barycenter(g, movable);
  console.log('***** output', barycenters);
  barycenters?.forEach((entry: any) => {
    if (g.children(entry.v).length) {
      const subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
      subgraphs[entry.v] = subgraphResult;
      if (lodash.has(subgraphResult, 'barycenter')) {
        mergeBarycenters(entry, subgraphResult);
      }
    }
  });

  const entries = resolveConflicts(barycenters, cg);
  expandSubgraphs(entries, subgraphs);

  const result = sort(entries, biasRight);

  if (bl) {
    result.vs = lodash.flatten([bl, result.vs, br], true);
    const predecessors = g.predecessors(bl) as any;
    if (predecessors.length) {
      const blPred = g.node(predecessors[0]),
        brPred = g.node(predecessors[0]);
      console.log('******', result);
      if (!lodash.has(result, 'barycenter')) {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter =
        (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
      console.log('******1', result.barycenter, result.weight, blPred.order, brPred.order, result.weight);
      result.weight += 2;
    }
  }

  console.log('******2', result);
  return result;
}

function expandSubgraphs(entries: any, subgraphs: Graph[]) {
  entries.forEach((entry: any) => {
    entry.vs = lodash.flatten(
      entry.vs.map((v: any) => {
        if (subgraphs[v]) {
          return (subgraphs[v] as any).vs;
        }
        return v;
      }),
      true,
    );
  });
}

function mergeBarycenters(target: any, other: any) {
  if (target.barycenter !== undefined) {
    target.barycenter =
      (target.barycenter * target.weight + other.barycenter * other.weight) /
      (target.weight + other.weight);
    target.weight += other.weight;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
}
