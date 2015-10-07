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

function filterDefaultFields(name, opts) {
  return (opts.default) ? true : false;
}

function mapDefaults(name, opts) {
  return [name, typeof opts.default === 'function' ? opts.default() : opts.default];
}

function externalMethod(args, external, beforeCb, afterCb) {
  return function(cb) {
    cb = cb || util.noop;
    return new Promise(function (resolve, reject) {
      function onDone(err, res) {
        if (afterCb) {
          afterCb(err);
        }

        cb.apply(null, arguments);

        if (err) {
          return reject.apply(null, [err].concat(args));
        }

        resolve(res);
      }

      if (beforeCb) {
        beforeCb();
      }

      if (external && typeof external === 'function') {
        var promise = external.apply(null, args.concat(onDone));

        if (promise && util.isPromise(promise)) {
          promise
            .then(function (res) {
              onDone(null, res);
            })
            .catch(function (err) {
              onDone(err);
            });
        }
      } else {
        onDone();
      }
    });
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
    var saved = false;

    // attach some instance methods
    // could also be done in prototype, but that would include usage of 'this'

    // get raw properties or property (without getters)
    model.getRaw = function (name) {
      return name ? properties[name] : properties;
    };

    // sets raw property or properties (without setters and validation)
    model.setRaw = function(what, value) {
      // single property
      if (typeof what === 'string' && fields[what]) {
        properties[what] = value;

        // emit change events
        model.emit('change:' + what, value);
        ModelConstructor.emit('change:' + what, model, value);
        model.emit('change', what, value);
        ModelConstructor.emit('change', model, what, value);

      // multiple properties
      } else if (typeof what === 'object') {
        var data = filterObj(what || {}, filterValidFields(fields));

        Object.keys(data).forEach(function (name) {
          properties[name] = data[name];
        });
      }
    };

    // returns one or all properties
    model.get = function (name) {
      if (name) {
        return model[name];
      }

      var props = {};

      Object.keys(fields).forEach(function (name) {
        props[name] = model[name];
      });

      return props;
    };

    // sets one or multiple properties
    model.set = function(what, value) {
      // single property
      if (typeof what === 'string' && fields[what]) {
        model[what] = value;

      // multiple properties
      } else if (typeof what === 'object') {
        var data = filterObj(what || {}, filterValidFields(fields));

        Object.keys(data).forEach(function (name) {
          model[name] = data[name];
        });
      }
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

    model.isValid = function () {
      return !model.hasErrors();
    };

    model.isNew = function () {
      return !saved;
    };

    model.markSaved = function () {
      saved = true;
      return model;
    };

    model.save = function (cb) {
      // do not save models with errors
      if (model.hasErrors()) {
        return;
      }

      var fn = externalMethod([model], opts.save,
        function () {
          // emit before save events
          ModelConstructor.emit('beforeSave', model);
          model.emit('beforeSave');
        },
        function (err) {
          if (!err) {
            saved = true;
          }

          // emit after save events
          ModelConstructor.emit('save', model, err);
          model.emit('save', err);
        }
      );

      return fn(cb);
    };

    model.remove = externalMethod([model], opts.remove,
      function () {
        // emit before save events
        ModelConstructor.emit('beforeRemove', model);
        model.emit('beforeRemove');
      },
      function (err) {
        // emit after remove events
        ModelConstructor.emit('remove', model, err);
        model.emit('remove', err);
      }
    );

    // attach toJSON method for JSON serialization
    model.toJSON = opts.toJSON ? opts.toJSON(model) : toJSON(model);

    // attach to string method
    model.toString = toString(model);

    // set model data
    model.set(data);

    // set default properties
    var defaultFields = filterObj(fields, filterDefaultFields);
    var defaults = mapObj(defaultFields, mapDefaults);
    Object.keys(defaults).forEach(function (name) {
      if (typeof model[name] === 'undefined') {
        model[name] = defaults[name];
      }
    });

    // let the constructor emit the create event for this instance
    ModelConstructor.emit('create', model);

    return model;
  };

  // make an event emitter out of the constructor
  util.constructorToEventEmitter(ModelConstructor);

  // provide a way to get the model factory
  proto.getFactory = function() {
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

  // loads models
  ModelConstructor.load = function (query, cb) {
    var fn = externalMethod([name, query], opts.load);
    return fn(cb);
  };

  // counts models
  ModelConstructor.count = function (query, cb) {
    var fn = externalMethod([name, query], opts.count);
    return fn(cb);
  };

  if (opts.extend) {
    ModelConstructor.extend(opts.extend);
  }

  return ModelConstructor;
}

module.exports = ModelFactory;
