'use strict';

var Field = require('./field');
var mapObj = require('map-obj');
var filterObj = require('filter-obj');
var events = require('events');
var util = require('./util');

function toJSON(model) {
  var fields = model.getFields();

  return function () {
    return mapObj(fields, function (key) {
      return [key, model[key]];
    });
  };
}

function toString(model) {
  return function (pretty) {
    var json = model.toJSON();
    return pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
  };
}

function filterValidFields(fields) {
  return function (key) {
    return (fields[key]) ? true : false;
  };
}

function ModelFactory(name, fields, opts) {
  opts = opts || {};

  fields = mapObj(fields, function (name, opts) {
    return [name, Field.normalize(opts)];
  });

  // create prototype for really fast acting model instances
  var proto = new events.EventEmitter();

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

  // create constructor for model instances
  function ModelConstructor(data) {
    function Model() {
      events.EventEmitter.call(this);
    };
    Model.prototype = proto;

    var errors = {};
    var properties = {};
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

      // emit change events
      model.emit('change:' + name, value);
      ModelConstructor.emit('change:' + name, model, value);
      model.emit('change', name, value);
      ModelConstructor.emit('change', model, name, value);
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

    model.save = function (cb) {
      cb = cb || util.noop;

      function onSave(err) {
        // emit after save events
        ModelConstructor.emit('save', model, err);
        model.emit('save', err);

        cb.apply(null, arguments);
      }

      // emit before save events
      ModelConstructor.emit('beforeSave', model);
      model.emit('beforeSave');

      if (opts.save) {
        opts.save(model, onSave);
      } else {
        onSave();
      }
    };

    model.remove = function(cb) {
      cb = cb || util.noop;

      function onRemove(err) {
        // emit after remove events
        ModelConstructor.emit('remove', model, err);
        model.emit('remove', err);

        cb.apply(null, arguments);
      }

      // emit before save events
      ModelConstructor.emit('beforeRemove', model);
      model.emit('beforeRemove');

      if (opts.remove) {
        opts.remove(model, onRemove);
      } else {
        onRemove();
      }
    };

    // attach toJSON method for JSON serialization
    model.toJSON = opts.toJSON ? opts.toJSON(model) : toJSON(model);

    // attach to string method
    model.toString = toString(model);

    // set model data
    model.setProperties(data);

    // let the constructor emit the create event for this instance
    ModelConstructor.emit('create', model);

    return model;
  };

  // make an event emitter out of the constructor
  util.constructorToEventEmitter(ModelConstructor);

  // provide a way to get the model instance constructor
  proto.getConstructor = function() {
    return ModelConstructor;
  };

  // attach some static methods to the constructor
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

module.exports = ModelFactory;
