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
      filter: require('lodash/filter'),
      find: require('lodash/find'),
      flatten: require('lodash/flatten'),
      forEach: require('lodash/forEach'),
      forIn: require('lodash/forIn'),
      has: require('lodash/has'),
      last: require('lodash/last'),
      map: require('lodash/map'),
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

export default lodash;
