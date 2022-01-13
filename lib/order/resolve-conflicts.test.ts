import { Graph } from 'graphlib';
import resolveConflicts from './resolve-conflicts';
import { sortBy } from '../helpers';

describe('order/resolveConflicts', function () {
  let cg: Graph;

  beforeEach(function () {
    cg = new Graph();
  });

  it('returns back nodes unchanged when no constraints exist', function () {
    const input = [
      { v: 'a', barycenter: 2, weight: 3 },
      { v: 'b', barycenter: 1, weight: 2 },
    ];
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['a'], i: 0, barycenter: 2, weight: 3 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ]);
  });

  it('returns back nodes unchanged when no conflicts exist', function () {
    const input = [
      { v: 'a', barycenter: 2, weight: 3 },
      { v: 'b', barycenter: 1, weight: 2 },
    ];
    cg.setEdge('b', 'a');
    expect(
      resolveConflicts(input, cg).sort((a: any, b: any) => {
        const valueA = a['vs'];
        const valueB = b['vs'];
        if (valueA < valueB) {
          return -1;
        }
        if (valueA > valueB) {
          return 1;
        }

        // names must be equal
        return 0;
      }),
    ).toEqual([
      { vs: ['a'], i: 0, barycenter: 2, weight: 3 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ]);
  });

  it('coalesces nodes when there is a conflict', function () {
    const input = [
      { v: 'a', barycenter: 2, weight: 3 },
      { v: 'b', barycenter: 1, weight: 2 },
    ];
    cg.setEdge('a', 'b');
    expect(
      resolveConflicts(input, cg).sort((a: any, b: any) => {
        const valueA = a['vs'];
        const valueB = b['vs'];
        if (valueA < valueB) {
          return -1;
        }
        if (valueA > valueB) {
          return 1;
        }

        // names must be equal
        return 0;
      }),
    ).toEqual([{ vs: ['a', 'b'], i: 0, barycenter: (3 * 2 + 2 * 1) / (3 + 2), weight: 3 + 2 }]);
  });

  it('coalesces nodes when there is a conflict #2', function () {
    const input = [
      { v: 'a', barycenter: 4, weight: 1 },
      { v: 'b', barycenter: 3, weight: 1 },
      { v: 'c', barycenter: 2, weight: 1 },
      { v: 'd', barycenter: 1, weight: 1 },
    ];
    cg.setPath(['a', 'b', 'c', 'd']);
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['a', 'b', 'c', 'd'], i: 0, barycenter: (4 + 3 + 2 + 1) / 4, weight: 4 },
    ]);
  });

  it('works with multiple constraints for the same target #1', function () {
    const input = [
      { v: 'a', barycenter: 4, weight: 1 },
      { v: 'b', barycenter: 3, weight: 1 },
      { v: 'c', barycenter: 2, weight: 1 },
    ];
    cg.setEdge('a', 'c');
    cg.setEdge('b', 'c');
    const results = resolveConflicts(input, cg);
    expect(results.length).toBe(1);
    expect(results[0].vs.indexOf('c')).toBeGreaterThan(results[0].vs.indexOf('a'));
    expect(results[0].vs.indexOf('c')).toBeGreaterThanOrEqual(results[0].vs.indexOf('b'));
    expect(results[0].i).toBe(0);
    expect(results[0].barycenter).toBe((4 + 3 + 2) / 3);
    expect(results[0].weight).toBe(3);
  });

  it('works with multiple constraints for the same target #2', function () {
    const input = [
      { v: 'a', barycenter: 4, weight: 1 },
      { v: 'b', barycenter: 3, weight: 1 },
      { v: 'c', barycenter: 2, weight: 1 },
      { v: 'd', barycenter: 1, weight: 1 },
    ];
    cg.setEdge('a', 'c');
    cg.setEdge('a', 'd');
    cg.setEdge('b', 'c');
    cg.setEdge('c', 'd');
    const results = resolveConflicts(input, cg);
    expect(results.length).toBe(1);
    expect(results[0].vs.indexOf('c')).toBeGreaterThan(results[0].vs.indexOf('a'));
    expect(results[0].vs.indexOf('c')).toBeGreaterThan(results[0].vs.indexOf('b'));
    expect(results[0].vs.indexOf('d')).toBeGreaterThan(results[0].vs.indexOf('c'));
    expect(results[0].i).toBe(0);
    expect(results[0].barycenter).toBe((4 + 3 + 2 + 1) / 4);
    expect(results[0].weight).toBe(4);
  });

  it('does nothing to a node lacking both a barycenter and a constraint', function () {
    const input = [{ v: 'a' }, { v: 'b', barycenter: 1, weight: 2 }];
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['a'], i: 0 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ]);
  });

  it('treats a node w/o a barycenter as always violating constraints #1', function () {
    const input = [{ v: 'a' }, { v: 'b', barycenter: 1, weight: 2 }];
    cg.setEdge('a', 'b');
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['a', 'b'], i: 0, barycenter: 1, weight: 2 },
    ]);
  });

  it('treats a node w/o a barycenter as always violating constraints #2', function () {
    const input = [{ v: 'a' }, { v: 'b', barycenter: 1, weight: 2 }];
    cg.setEdge('b', 'a');
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['b', 'a'], i: 0, barycenter: 1, weight: 2 },
    ]);
  });

  it('ignores edges not related to entries', function () {
    const input = [
      { v: 'a', barycenter: 2, weight: 3 },
      { v: 'b', barycenter: 1, weight: 2 },
    ];
    cg.setEdge('c', 'd');
    expect(sortBy(resolveConflicts(input, cg), 'vs')).toEqual([
      { vs: ['a'], i: 0, barycenter: 2, weight: 3 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ]);
  });
});
