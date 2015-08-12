'use strict';

var util = require('./util');
var ModelFactory = require('./model_factory');

function Schemas(opts) {
  var schemas = {};
  opts = opts || {};

  function SchemaFactory(name, fields, schemaOpts) {
    schemaOpts = schemaOpts || {};
    var _opts = util.mixinObj(schemaOpts, util.cloneObj(opts), true);

    var factory = ModelFactory(name, fields, _opts);
    schemas[name] = factory;

    return factory;
  }

  SchemaFactory.get = function (name) {
    return schemas[name] || null;
  };

  return SchemaFactory;
}

module.exports = Schemas;
