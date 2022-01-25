import * as util from '../util';
import lodash from '../lodash';

export default function sort(entries: any, biasRight?: any) {
  const parts = util.partition(entries, function (entry: any) {
    return lodash.has(entry, 'barycenter');
  });
  const sortable = parts.lhs,
    unsortable = lodash.sortBy(parts.rhs, function (entry: any) {
      return -entry.i;
    });
  const vs = [] as any[];
  let sum = 0;
  let weight = 0;
  let vsIndex = 0;

  sortable.sort(compareWithBias(!!biasRight));

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

  sortable.forEach(entry => {
    vsIndex += entry.vs.length;
    vs.push(entry.vs);
    sum += entry.barycenter * entry.weight;
    weight += entry.weight;
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
  });

  const result = { vs: lodash.flatten(vs, true) } as any;
  if (weight) {
    result.barycenter = sum / weight;
    result.weight = weight;
  }
  return result;
}

function consumeUnsortable(vs: any, unsortable: any, index: number) {
  let last;
  while (unsortable.length && (last = lodash.last(unsortable)).i <= index) {
    unsortable.pop();
    vs.push(last.vs);
    index++;
  }
  return index;
}

function compareWithBias(bias: any) {
  return function (entryV: any, entryW: any) {
    if (entryV.barycenter < entryW.barycenter) {
      return -1;
    } else if (entryV.barycenter > entryW.barycenter) {
      return 1;
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
  };
}
