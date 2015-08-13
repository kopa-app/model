'use strict';

var Model = require('./index');
var expect = require('expect.js');

describe('Schema', function () {
  var Schema = Model();

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
    expect(Schema.get('User')).to.be(User);
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

  it('should serialize to JSON and string', function () {
    var Zooby = Schema('Zooby', {
      name: 'string',
      email: 'string'
    });

    var data = {
      name: 'Foo',
      email: 'foo@bar.com'
    };

    var zooby = Zooby(data);

    expect(zooby.toJSON()).to.eql(data);
    expect(zooby.toString()).to.be(JSON.stringify(data));
    expect(zooby.toString(true)).to.be(JSON.stringify(data, null, 2));
  });

  it('Model Constructor and instance should emit lifecycle events', function (next) {
    var Ooby = Schema('Ooby', {
      name: 'string',
      email: 'string'
    });

    var data = {
      name: 'Foo',
      email: 'foo@bar.com'
    };

    var eventsEmitted = 0;

    function onEventEmitted() {
      eventsEmitted++;

      if (eventsEmitted === 16) {
        next();
      }
    }

    function onConstrEvent(model) {
      expect(model).to.be(ooby);
      onEventEmitted();
    }

    function onModelEvent() {
      onEventEmitted();
    }

    Ooby.on('create', function (model) {
      expect(model.toJSON()).to.eql(data);
      onEventEmitted();
    });
    Ooby.on('beforeSave', onConstrEvent);
    Ooby.on('save', onConstrEvent);
    Ooby.on('beforeRemove', onConstrEvent);
    Ooby.on('remove', onConstrEvent);
    Ooby.on('change', onEventEmitted);
    Ooby.on('change:name', onEventEmitted);

    var ooby = Ooby(data);

    ooby.on('beforeSave', onModelEvent);
    ooby.on('save', onModelEvent);
    ooby.on('beforeRemove', onModelEvent);
    ooby.on('remove', onModelEvent);
    ooby.on('change', function (name, value) {
      expect(name).to.be('name');
      expect(value).to.be('Bar');
      onEventEmitted();
    });
    ooby.on('change:name', function (value) {
      expect(value).to.be('Bar');
      onEventEmitted();
    });

    ooby.name = 'Bar';
    ooby.save();
    ooby.remove();
  });

  it('should allow for custom save and remove methods', function (next) {
    var globalCalls = 0;
    var localCalls = 0;
    var account, user;

    function onCall(isGlobal) {
      if (isGlobal) {
        globalCalls++;
      } else {
        localCalls++;
      }

      if (globalCalls + localCalls == 4) {
        next();
      }
    }

    var Schema = Model({
      save: function(model, cb) {
        expect(model).to.be(account);
        cb(null);
        onCall(true);
      },
      remove: function(model, cb) {
        expect(model).to.be(account);
        cb(null);
        onCall(true);
      }
    });

    var Account = Schema('Account', {});
    account = Account();

    account.save();
    account.remove();

    var User = Schema('User', {}, {
      save: function (model, cb) {
        expect(model).to.be(user);
        cb(null);
        onCall();
      },
      remove: function (model, cb) {
        expect(model).to.be(user);
        cb(null);
        onCall();
      },
    });

    user = User();
    user.save();
    user.remove();
  });

  it('should allow default fields', function () {
    var Schema = Model({
      fields: {
        createdAt: {
          type: 'date',
          default: function () {
            return new Date();
          }
        },
        updatedAt: 'date'
      }
    });

    var User = Schema('User', {
      username: 'string',
      email: 'string'
    });

    var fields = User.getFields();
    expect(fields).to.have.property('createdAt');
    expect(fields).to.have.property('updatedAt');
    expect(fields).to.have.property('username');
    expect(fields).to.have.property('email');

    var now = new Date();
    var user = User();
    expect(user.createdAt).to.be.a(Date);
    expect(user.createdAt >= now).to.be(true);

    // should not assign default if field was already asigned in constructor
    var user2 = User({
      createdAt: new Date(5000)
    });

    expect(user2.createdAt).to.be.a(Date);
    expect(user2.createdAt.getTime()).to.be(5000);

    // should remove fields with falsy config
    var Account = Schema('Account', {
      createdAt: null,
      updatedAt: false,
      name: 'string'
    });

    var accountFields = Account.getFields();
    expect(accountFields).to.not.have.property('createdAt');
    expect(accountFields).to.not.have.property('updatedAt');
    expect(accountFields).to.have.property('name');
  });

  it('Model.save and Model.remove should return Promise', function (next) {
    require('es6-promise').polyfill();

    var user = User();
    var savePromise = user.save();
    var removePromise = user.remove();
    expect(savePromise).to.be.a(Promise);
    expect(removePromise).to.be.a(Promise);

    return savePromise
      .then(function () {
        return removePromise;
      })
      .then(function () {
        next();
      });
  });

  it('Model.save and Model.remove should detect promises', function (next) {
    require('es6-promise').polyfill();

    var Schema = Model({
      save: function(model) {
        return new Promise(function (resolve, reject) {
          resolve();
        });
      },
      remove: function(model) {
        return new Promise(function (resolve, reject) {
          resolve();
        });
      }
    });

    var User = Schema('User', {});
    var user = User();

    User.on('save', function (model) {
      expect(model).to.be(user);
      user.remove();
    });

    User.on('remove', function (model) {
      expect(model).to.be(user);
      next();
    });

    user.save();
  });

  it('should allow passing extension in options', function () {
    var Schema = Model({
      extend: {
        foo: function () {
          return 'bar';
        },
        bar: function () {
          return 'foo';
        }
      }
    });

    var User = Schema('User', {});
    var user = User();
    expect(user.foo).to.be.a('function');
    expect(user.bar).to.be.a('function');
    expect(user.foo()).to.be('bar');
    expect(user.bar()).to.be('foo');
  });

  it('should allow load and count methods on Model Constructor', function (next) {
    var called = 0;

    var q = {
      foo: 'bar'
    };

    var Schema = Model({
      load: function(query, cb) {
        expect(query).to.be(q);
        called++;
      },
      count: function(query, cb) {
        expect(query).to.be(q);
        called++;

        if (called == 2) {
          next();
        }
      }
    });

    var User = Schema('User', {});

    User.load(q);
    User.count(q);
  });

  it('shoudl detect promises in load and count methods', function (next) {
    var called = 0;

    var q = {
      foo: 'bar'
    };

    var Schema = Model({
      load: function(query, cb) {
        expect(query).to.be(q);
        return new Promise(function (resolve, reject) {
          resolve();
          called++;
        });
      },
      count: function(query, cb) {
        expect(query).to.be(q);
        return new Promise(function (resolve, reject) {
          resolve();
          called++;
          if (called == 2) {
            next();
          }
        });
      }
    });

    var User = Schema('User', {});

    User.load(q);
    User.count(q)
  });
});
