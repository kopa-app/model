'use strict';

var Field = require('./field');
var mapObj = require('map-obj');
var filterObj = require('filter-obj');

function toJSON(model) {
  var fields = model.getFields();

  return function () {
    return mapObj(fields, function (key) {
      return [key, model[key]];
    });
  };
}

function filterValidFields(fields) {
  return function (key) {
    return (fields[key]) ? true : false;
  };
}

function Schema(name, fields, opts) {
  opts = opts || {};

  fields = mapObj(fields, function (name, opts) {
    return [name, Field.normalize(opts)];
  });

  // create prototype for really fast acting model instances
  var proto = {};

  // returns the name of this model
  proto.getModelName = function () {
    return name;
  };

  // returns field definitions
  proto.getFields = function () {
    return fields;
  };

  // returns options if any
  proto.getOptions = function() {
    return opts;
  };

  // attach field properties
  Object.keys(fields).forEach(function (fieldName) {
    Field(proto, fieldName, fields[fieldName]);
  });

  // create constructor
  function ModelConstructor(data) {
    function Model() {};
    var errors = {};
    var properties = {};
    Model.prototype = proto;
    var model = new Model();

    // attach some instance methods
    // could also be done in prototype, but that would include usage of 'this'

    model.getProperties = function () {
      return properties;
    };

    // get raw property (overrides any getters)
    model.getProperty = function(name) {
      return properties[name];
    };

    // sets raw property (overrides any setters and validation)
    model.setProperty = function(name, value) {
      properties[name] = value;
    };

    model.setProperties = function(data) {
      data = filterObj(data || {}, filterValidFields(fields));

      Object.keys(data).forEach(function (name) {
        model[name] = data[name];
      });
    };

    model.clearErrors = function () {
      Object.keys(errors, function (name) {
        delete errors[name];
      });
    };

    model.setFieldErrors = function(name, _errors) {
      errors[name] = _errors;
    };

    model.getFieldErrors = function(name) {
      return errors[name] ? errors[name] : [];
    };

    model.getErrors = function() {
      return errors;
    };

    model.hasErrors = function() {
      for (name in errors) {
        if (model.getFieldErrors(name).length) {
          return true;
        }
      }

      return false;
    };

    // attach toJSON method for JSON serialization
    model.toJSON = opts.toJSON ? opts.toJSON(model) : toJSON(model);

    // set model data
    model.setProperties(data);

    return model;
  };

  // provide a way to get the model instance constructor
  proto.getConstructor = function() {
    return ModelConstructor;
  };

  // attach some prototype methods to the constructor
  ModelConstructor.getFields = proto.getFields;
  ModelConstructor.getOptions = proto.getOptions;
  ModelConstructor.getModelName = proto.getModelName;

  // extends model with anything
  // provide an object to extend multiple
  ModelConstructor.extend = function(name, value) {
    if (!name) {
      return;
    }

    if (typeof name === 'object') {
      Object.keys(name).forEach(function(key) {
        ModelConstructor.extend(key, name[key])
      });
    } else if (typeof name === 'string') {
      if (typeof value === 'function') {
        proto[name] = function () {
          return value(this);
        };
      } else {
        proto[name] = value;
      }
    }
  };

  // adds a field to the model
  ModelConstructor.addField = function (name, opts) {
    fields[name] = Field.normalize(opts);
    Field(proto, name, fields[name]);
  };

  // removes a field from the model
  ModelConstructor.removeField = function (name) {
    delete fields[name];
    delete proto[name];
  };

  return ModelConstructor;
}

module.exports = Schema;
