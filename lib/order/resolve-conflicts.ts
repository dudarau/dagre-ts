/*
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the contraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 */
import { Edge } from 'graphlib';
import lodash from "../lodash";

export default function resolveConflicts(entries: any, cg: any) {
  const mappedEntries = {} as any;
  entries?.forEach((entry: any, i: number) => {
    const tmp = (mappedEntries[entry.v] = {
      indegree: 0,
      in: [],
      out: [],
      vs: [entry.v],
      i: i,
    } as any);
    if (!entry.barycenter !== undefined) {
      tmp.barycenter = entry.barycenter;
      tmp.weight = entry.weight;
    }
  });

  cg.edges().forEach((e: Edge) => {
    const entryV = mappedEntries[e.v];
    const entryW = mappedEntries[e.w];
    if (entryV !== undefined && entryW !== undefined) {
      entryW.indegree++;
      entryV.out.push(mappedEntries[e.w]);
    }
  });

  const sourceSet = lodash.filter(mappedEntries, function(entry: any) {
    return !entry.indegree;
  });

  return doResolveConflicts(sourceSet);
}

function doResolveConflicts(sourceSet : any) {
  const entries = [];

  function handleIn(vEntry: any) {
    return function (uEntry: any) {
      if (uEntry.merged) {
        return;
      }
      if (
        typeof uEntry.barycenter === 'undefined' ||
        typeof vEntry.barycenter === 'undefined' ||
        uEntry.barycenter >= vEntry.barycenter
      ) {
        mergeEntries(vEntry, uEntry);
      }
    };
  }

  function handleOut(vEntry: any) {
    return function (wEntry: any) {
      wEntry['in'].push(vEntry);
      if (--wEntry.indegree === 0) {
        sourceSet.push(wEntry);
      }
    };
  }

  while (sourceSet.length) {
    const entry = sourceSet.pop();
    entries.push(entry);
    entry['in'].reverse().forEach(handleIn(entry));
    entry.out.forEach(handleOut(entry));
  }

  return entries.filter((entry) =>{
      return !entry.merged;
    }).map((entry) => {
      return lodash.pick(entry, ['vs', 'i', 'barycenter', 'weight']);
    });
}

function mergeEntries(target: any, source: any) {
  let sum = 0;
  let weight = 0;

  if (target.weight) {
    sum += target.barycenter * target.weight;
    weight += target.weight;
  }

  if (source.weight) {
    sum += source.barycenter * source.weight;
    weight += source.weight;
  }

  target.vs = source.vs.concat(target.vs);
  target.barycenter = sum / weight;
  target.weight = weight;
  target.i = Math.min(source.i, target.i);
  source.merged = true;
}
