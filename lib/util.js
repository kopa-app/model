'use strict';

var mapObj = require('map-obj');
var events = require('events');

function noop() {}

function isBool(value) {
  return value === false || value === true;
}

function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number';
}

function isObject(value) {
  return typeof value === 'object';
}

function isInt(value) {
  return isNumber(value) && value.toString().indexOf('.') === -1;
}

function isDate(value) {
  return isObject(value) && value instanceof Date;
}

function isArray(value) {
  return isObject(value) && value instanceof Array;
}

function toBool(value) {
  return value ? true : false;
}

function isEmpty(value) {
  return typeof value === 'undefined' ||
         value === null ||
         value === '';
}

function constructorToEventEmitter(constr) {
  Object.keys(events.EventEmitter.prototype).forEach(function (key) {
    var value = events.EventEmitter.prototype[key];

    if (typeof value === 'function') {
      constr[key] = function () {
        return value.apply(constr, arguments);
      };
    } else {
      constr[key] = value;
    }
  });

  events.EventEmitter.call(constr);
}

function cloneObj(src, deep) {
  function map(key, value) {
    return [key, value]
  };

  return mapObj(src, map);
}

function mixinObj(src, dest, overwrite) {
  Object.keys(src).forEach(function (key) {
    if (overwrite || typeof dest[key] === 'undefined') {
      dest[key] = src[key];
    }
  });

  return dest;
}

module.exports = {
  noop: noop,
  isString: isString,
  isNumber: isNumber,
  isInt: isInt,
  isObject: isObject,
  isDate: isDate,
  isArray: isArray,
  isBool: isBool,
  toBool: toBool,
  isEmpty: isEmpty,
  constructorToEventEmitter: constructorToEventEmitter,
  mixinObj: mixinObj,
  cloneObj: cloneObj
};
