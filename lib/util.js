'use strict';

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

module.exports = {
  isString: isString,
  isNumber: isNumber,
  isInt: isInt,
  isObject: isObject,
  isDate: isDate,
  isArray: isArray,
  isBool: isBool,
  toBool: toBool,
  isEmpty: isEmpty
};
