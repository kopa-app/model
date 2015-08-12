'use strict';

var util = require('./util');
var ModelFactory = require('./model_factory');

function Schemas(opts) {
  var schemas = {};
  opts = opts || {};

  function SchemaFactory(name, fields, schemaOpts) {
    schemaOpts = schemaOpts || {};
    var _opts = util.mixinObj(schemaOpts, util.cloneObj(opts), true);
    var _fields = util.cloneObj(fields);

    // add default fields
    if (opts.fields) {
      util.mixinObj(opts.fields, _fields);
    }

    var factory = ModelFactory(name, _fields, _opts);
    schemas[name] = factory;

    return factory;
  }

  SchemaFactory.get = function (name) {
    return schemas[name] || null;
  };

  return SchemaFactory;
}

module.exports = Schemas;
