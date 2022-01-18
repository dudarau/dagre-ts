// eslint-disable-next-line no-redeclare
/* global window */

let lodash: any;

if (typeof require === 'function') {
  try {
    lodash = {
      cloneDeep: require('lodash/cloneDeep'),
      constant: require('lodash/constant'),
      defaults: require('lodash/defaults'),
      each: require('lodash/each'),
      flatten: require('lodash/flatten'),
      forEach: require('lodash/forEach'),
      forIn: require('lodash/forIn'),
      has: require('lodash/has'),
      last: require('lodash/last'),
      mapValues: require('lodash/mapValues'),
      merge: require('lodash/merge'),
      minBy: require('lodash/minBy'),
      pick: require('lodash/pick'),
      range: require('lodash/range'),
      reduce: require('lodash/reduce'),
      sortBy: require('lodash/sortBy'),
      uniqueId: require('lodash/uniqueId'),
      values: require('lodash/values'),
      zipObject: require('lodash/zipObject'),
    };
  } catch (e) {
    // continue regardless of error
  }
}

if (!lodash) {
  // @ts-ignore
  lodash = window._;
}

export default lodash;
