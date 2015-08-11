'use strict';

var Schema = require('./index');
var expect = require('expect.js');

describe('Schema', function () {
  var User = Schema('User', {
    username: 'string',
    email: 'string',
    roles: { type: 'array', default: ['user'] },
    createdAt: { type: 'date', immutable: true },
    invalidType: 'invalid type'
  });

  it('should create a Model constructor', function () {
    expect(User).to.be.a('function');
    expect(User.getModelName()).to.be('User');
    var user = User();
    expect(user.getModelName()).to.be('User');
  });

  it('should normalize fields', function () {
    var fields = User.getFields();
    expect(fields).to.be.an('object');
    expect(fields).to.have.property('username');
    expect(fields).to.have.property('email');
    expect(fields).to.have.property('roles');
    expect(fields).to.have.property('createdAt');
    expect(fields).to.have.property('invalidType');

    // check that fields are normalized
    Object.keys(fields).forEach(function(name) {
      var opts = fields[name];
      expect(opts).to.have.property('type');
      expect(opts).to.have.property('required');
      expect(opts).to.have.property('immutable');
      expect(opts).to.have.property('default');
      expect(opts).to.have.property('validate');
      expect(opts).to.have.property('get');
      expect(opts).to.have.property('set');
    });
  });

  it('should add default values', function () {
    var user = User();
    expect(user.roles).to.eql(['user']);
  });

  it('should set initial values and persist default values', function () {
    var user = User({
      username: 'Foo',
      email: 'foo@bar.com'
    });
    expect(user.roles).to.eql(['user']);
    expect(user.username).to.be('Foo');
    expect(user.email).to.be('foo@bar.com');
  });

  it('should not allow writing immutable values', function () {
    var now = new Date();
    var user = User({
      createdAt: now
    });

    expect(user.createdAt).to.be(now);

    user.createdAt = new Date(now.getTime() + 10000);
    expect(user.createdAt).to.be(now);
  });

  it('should allow custom setters and getters', function () {
    var magicValue = 'unset';

    var Magician = Schema('Magician', {
      whatIsMagic: {
        get: function () {
          return 'this is magic';
        }
      },
      magic: {
        set: function (model, value) {
          magicValue = value;
        },
        get: function () {
          return magicValue;
        }
      }
    });

    var magician = Magician();

    expect(magician.whatIsMagic).to.be('this is magic');
    expect(magician.magic).to.be('unset');
    magician.magic = 'it\'s magic';
    expect(magician.magic).to.be('it\'s magic');
    expect(magicValue).to.be('it\'s magic');
  });

  it('should allow Model extension', function () {
    var Simple = Schema('Simple', {
      firstname: 'string',
      lastname: 'string'
    });

    Simple.extend('getFullName', function (model) {
      return model.firstname + ' ' + model.lastname;
    });

    var extended = Simple({
      firstname: 'Foo',
      lastname: 'Bar'
    });

    expect(extended.getFullName).to.be.a('function');
    expect(extended.getFullName()).to.be('Foo Bar');

    Simple.extend({
      getShortName: function (model) {
        return model.firstname.charAt(0) + '. ' + model.lastname;
      },
      random: 'some randomness'
    });

    expect(extended.getShortName).to.be.a('function');
    expect(extended.getShortName()).to.be('F. Bar');
    expect(extended.random).to.be('some randomness');
  });

  it('should validate', function () {
    var ValidatedUser = Schema('User', {
      username: { required: true, validate: [
        function isValid(username) {
          return (username === 'foobar') ? true : 'invalid username';
        },
        function isLonghEnough(username) {
          return (username.length > 4);
        }
      ] },
      email: { required: true, validate: function isEmail(email) {
        return email === 'foo@bar.com';
      }},
      roles: { type: 'array', default: ['user'] }
    });

    var user = ValidatedUser({
      username: 'bar',
      email: 'bar@foo.com',
      roles: 'not an array'
    });

    expect(user.hasErrors()).to.be(true);
    expect(user.getErrors()).to.eql({
      username: ['invalid username', 'invalid isLonghEnough'],
      email: ['invalid isEmail'],
      roles: ['invalid array value']
    });
  });
});
