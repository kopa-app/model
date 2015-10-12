'use strict';

var util = require('./util');

var typeValidations = {
  'string': util.isString,
  'object': util.isObject,
  'number': util.isNumber,
  'int': util.isInt,
  'float': util.isNumber,
  'date': util.isDate,
  'array': util.isArray,
  'bool': util.isBool
};

var typeAliases = {
  'boolean': 'bool',
  'integer': 'int',
  'datetime': 'date'
};

var validTypes = ['string', 'object', 'number', 'int', 'float', 'date', 'array', 'bool'];

function Validate(opts) {
  return function (value) {
    var errors = [];

    // use value serializer
    if (opts.serialize) {
      value = opts.serialize(value);
    }

    if (typeValidations[opts.type]) {
      if (!typeValidations[opts.type](value) && !opts.requried && !util.isEmpty(value)) {
        errors.push('invalid ' + opts.type + ' value');
      }
    }

    if (opts.required && util.isEmpty(value)) {
      errors.push('is required');
    }

    opts.validate.forEach(function (validator) {
      var valid = validator(value);
      var error;

      if (valid === true) {
        return;
      }

      if (typeof valid == 'string') {
        error = valid;
      } else {
        error = 'invalid ' + (validator.name || '');
      }

      errors.push(error);
    });

    return errors;
  }
}

function Field(model, name, opts) {
  opts = Field.normalize(opts);

  // create validation function for this field
  var validate = Validate(opts);
  var wasSet = false;

  var descr = {
    enumerable: true,
    configurable: false,
    //value: opts.default || null,
    //writable: !(opts.immutable),

    get: function () {
      if (opts.get) {
        // use provided getter
        return opts.get(this);
      } else if (opts.unserialize) {
        // use unserialize
        return opts.unserialize(this.getRaw(name));
      } else {
        // or get directly
        return this.getRaw(name);
      }

      return undefined;
    },

    set: function (value) {
      // do nothing for immutable fields that have already been set
      if (wasSet && opts.immutable) {
        return;
      }

      var errors = validate(value);

      // set and abort on errors
      if (errors.length) {
        this.setFieldErrors(name, errors);
        return;
      }

      if (opts.set) {
        // use setter
        opts.set(this, value)
      } else if (opts.serialize) {
        // set using serializer
        this.setRaw(name, opts.serialize(value));
      } else {
        // set directly
        this.setRaw(name, value);
      }

      wasSet = true;
    }
  };

  Object.defineProperty(model, name, descr);
}

Field.DEFAUTL_TYPE = 'string';

Field.normalize = function (opts) {
  var _opts = {};

  var type = Field.DEFAUTL_TYPE;

  if (util.isString(opts)) {
    type = opts;
    opts = {};
  } else if (util.isObject(opts)) {
    type = opts.type || type;
  }

  // convert type aliases
  if (typeAliases[type]) {
    type = typeAliases[type];
  }

  // fallback to default type
  if (validTypes.indexOf(type) === -1) {
    type = Field.DEFAULT_TYPE;
  }

  _opts.type = type;
  _opts.required = util.toBool(opts.required);
  _opts.immutable = util.toBool(opts.immutable);
  _opts.default = opts.default || null;

  _opts.validate = [];

  if (util.isArray(opts.validate)) {
    _opts.validate = opts.validate;
  } else if (opts.validate) {
    _opts.validate.push(opts.validate);
  }

  _opts.get = opts.get || null;
  _opts.set = opts.set || null;
  _opts.serialize = opts.serialize || null;
  _opts.unserialize = opts.unserialize || null;

  return _opts;
};

module.exports = Field;
