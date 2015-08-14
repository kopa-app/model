'use strict';

var util = require('./util');
var ModelFactory = require('./model_factory');
var filterObj = require('filter-obj');

function filterEmptyFields(name, opts) {
  return (opts) ? true : false;
}

function Schemas(opts) {
  var schemas = {};
  opts = opts || {};

  function SchemaFactory(name, fields, schemaOpts) {
    if (!name) {
      throw new Error('You must provide a model name.');
    }

    if (!fields) {
      throw new Error('You must provide model fields.');
    }

    schemaOpts = schemaOpts || {};
    var _opts = util.mixinObj(schemaOpts, util.cloneObj(opts), true);
    var _fields = util.cloneObj(fields);

    // add default fields
    if (opts.fields) {
      util.mixinObj(opts.fields, _fields);
      delete schemaOpts.fields;
    }

    // remove null fields, as those have been removed
    _fields = filterObj(_fields, filterEmptyFields);

    var factory = ModelFactory(name, _fields, _opts);
    schemas[name] = factory;

    return factory;
  }

  SchemaFactory.get = function (name) {
    return name ? schemas[name] || null : schemas;
  };

  return SchemaFactory;
}

module.exports = Schemas;
