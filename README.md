# Kopa.io Model

Tiny model schema definitions for client and server used in kopa.io

This module only provides basic model schema definitions and factories without a binding to a certain framework or backend/adapter.

It works in browsers and on server side.

## Install

```bash
$ npm install kopa-app/model
```

## Hacking

Prepare for development:

```bash
$ npm install
```

Run the tests with:

```bash
$ npm test
```

## Usage

### Create a Schema

Schemas can create model factories.

You can think of a Schema like a link to a database/your backend.

By passing it `save`, `remove`, `load` and `count` methods you can basically create an adapter for all models defined in this schema.
All these methods can return promises instead of using the passed in callback.


By passing it a `fields` object you can also define default fields, that will exist in every defined model within that Schema.

```javascript
var Model = require('kopa-model');

// var Schema = Model(options);
var Schema = Model({
  // global options here
  save: function (model, callback) {
    // store your model in the backend
  },
  remove: function (model, callback) {
    // remove your model from the backend
  },
  load: function (modelName, query, callback) {
    // load your models from the backend
  },
  count: function (modelName, query, callback) {
    // count your models from the backend
  },
  // default fields, that will be mixed into every model type
  fields: {
    createdAt: {
      type: 'date',
      // use a default function/value to create an initial value
      default: function () {
        return new Date();
      }
    },
    updatedAt: 'date'
  }
});
```

### Define a model

After you've create your Schema, you can define Models on it.

The Schema returns a model factory for each model you define.

You can override anything you've passed to the Schema's options.

The model factory itself can extend every model instance at runtime using it's `extend` method.

```javascript
function isEmail(email) {
  return (/* put your email validation in here */) ?
    true : 'invalid email';
}

function noop() {}

// define a model
// Schema(modelName, fields, options);

var User = Schema('User', {
  username: {
    type: 'string',
    required: true
  },
  email: {
    type: 'string',
    required: true,
    validate: isEmail
  },
  createdAt: {
    type: 'date',
    immutable: true
  },
  firstname: 'string',
  lastname: 'string',

  // computed property, with noop setter
  fullname: {
    get: function (model) {
      return model.firstname + ' ' + model.lastname;
    },
    set: noop
  },

  // remove default fields, by assigning them a falsy value
  updatedAt: false
}, {
  // additional options here
  toJSON: function (model) {
    return {
      // override build in toJSON here
    };
  },
  // you can override anything you've passed to Model() before here too
});

// extend model instances
// you can also pass an object to extend multiple things at once
User.extend('greet', function (model) {
  return "Hi, I'm " + model.fullname + ".";
});
```

### Creating model instances

Model instances are created by calling the factory created by our `Schema`.

```javascript
// create a model instance
var peter = User({
  username: 'peter.parker',
  firstname: 'Peter',
  lastname: 'Parker',
  email: 'peter.parker@example.com',
  createdAt: new Date()
});

// remember we extended User before with a greet method
peter.greet(); // Hi, I'm Peter Parker.

// set properties
peter.lastname = 'Smith';

// will not update createdAt, as it's immutable
peter.createdAt = new Date(50000);
```

### Model factory methods

```javascript
// returns field definitions
User.getFields();

// returns model schema name
User.getModelName();

// calls your own load implementation
// returns a promise, callback can be omitted
User.load(query, callback);

// calls your own count implementation
// returns a promise, callback can be omitted
User.cont(query, callback);
```

### Model instance methods

```javascript
// check if model has validation errors
user.hasErrors();

// returns validation errors (keys are field names, values the error messages)
user.getErrors();

// returns errors for a field
user.getFieldErrors(name);

// set errors for a field
user.setFieldErrors(name, errors);

// removes any validation errors
user.clearErrors();

// gets a property
// same as user.username
user.get('username');

// returns all properties
user.get();

// sets a property
// same as user.username = 'dooby'
user.set('username', 'dooby');

// sets multiple properties at once
user.set({
  username: 'dooby',
  email: 'foo@bar.com'
});

// returns raw property or all properties (no getters)
user.getRaw('username');

// sets raw property (no setters and validation)
user.setRaw('username', 'dooby');

// sets multiple raw properties (no setters and validation)
user.setRaw({
  username: 'dooby',
  email: 'foo@bar.com'
});

// returns field definitions
user.getFields();

// returns model schema name
user.getModelName();

// returns factory method
user.getFactory();

// returns plain object representation of the model
// usefull for JSON.stringify
user.toJSON();

// returns a string represantation of the model
// set pretty to true for prettier output
user.toString(pretty);

// calls your own save implementation
// returns a promise, callback can be omitted
user.save(callback);

// calls your own remove implementation
// returns a promise, callback can be omitted
user.remove(callback);
```

### Lifecycle events

Model Constructors and model instances emit lifecycle events.

```javascript
User.on('create', function (model) {
  // when a model was created
});

User.on('beforeSave', function (model) {
  // before a model instance gets saved
});

user.on('beforeSave', function () {
  // same as with constructor
  // but no model instance gets passed
});

User.on('save', function (model, error) {
  // after a model instance got saved,
  // if an error occured it's passed as second argument
});

user.on('save', function () {
  // same as with constructor
  // but no model instance gets passed
});

User.on('beforeRemove', function (model) {
  // before a model instance gets removed
});

user.on('beforeRemove', function () {
  // same as with constructor
  // but no model instance gets passed
});

User.on('remove', function (model, error) {
  // after a model instance got removed,
  // if an error occured it's passed as second argument
});

user.on('remove', function (error) {
  // same as with constructor
  // but no model instance gets passed
});

User.on('change', function (model, name, value) {
  // called when property has changed
});

user.on('change', function (name, value) {
  // same as with constructor
  // but no model instance gets passed
});

User.on('change:username', function (model, value) {
  // called when the username property has changed
});

user.on('change:username', function (value) {
  // same as with constructor
  // but no model instance gets passed
});
```
