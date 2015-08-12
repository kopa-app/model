'use strict';

var g = typeof window !== 'undefined' ? window : global;
var util = require('./lib/util');

// create noop promises
if (typeof g.Promise === 'undefined') {
  g.Promise = function (cb) {
    cb(noop, noop)
  };
}

module.exports = require('./lib/schema');
