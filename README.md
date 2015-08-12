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

```javascript
var Schema = require('kopa-model')({
  // global options here
  save: function (model, cb) {
    // store your model in the backend
  },
  remove: function (model, cb) {
    // remove your model from the backend
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

function isEmail(email) {
  return (/* put your email validation in here */) ? true : 'invalid email';
}

function noop() {}

// define a model schema
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
  // you can override 'save()' and 'remove()' here
});

// extend model instances
// you can also pass an object to extend multiple things at once
User.extend('greet', function (model) {
  return "Hi, I'm " + model.fullname + ".";
});

// create a model instance
var peter = User({
  username: 'peter.parker',
  firstname: 'Peter',
  lastname: 'Parker',
  email: 'peter.parker@example.com',
  createdAt: new Date()
});

peter.greet(); // Hi, I'm Peter Parker.

// set properties
peter.lastname = 'Smith';
peter.createdAt = new Date(50000); // will not update createdAt, as it's immutable
```

### Model Constructor methods

```javascript
User.getFields(); // returns field definitions
User.getModelName(); // returns model schema name
```

### Model instance methods

```javascript
user.hasErrors(); // check if model has validation errors
user.getErrors(); // returns validation errors (keys are field names, values the error messages)
user.getFieldErrors(name); // returns errors for a field
user.setFieldErrors(name, errors); // set errors for a field
user.clearErrors(); // removes any validation errors

user.getProperty(name); // returns raw property (no getters)
user.setProperty(name, value); // sets raw property (no setters and validation)
user.setProperties(props); // like setProperty() but for multiple values
user.getProperties(); // returns raw properties (without getters)

user.getFields(); // returns field definitions
user.getModelName(); // returns model schema name
user.getConstructor(); // returns constructor method
user.toJSON(); // returns plain object representation of the model (usefull for JSON.stringify)
user.toString(pretty); // returns a string represantation of the model (set pretty to true for prettier output)
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
  // same as with constructor but no model instance gets passed
});

User.on('save', function (model, error) {
  // after a model instance got saved, if an error occured it's passed as second argument
});

user.on('save', function () {
  // same as with constructor but no model instance gets passed
});

User.on('beforeRemove', function (model) {
  // before a model instance gets removed
});

user.on('beforeRemove', function () {
  // same as with constructor but no model instance gets passed
});

User.on('remove', function (model, error) {
  // after a model instance got removed, if an error occured it's passed as second argument
});

user.on('remove', function (error) {
  // same as with constructor but no model instance gets passed
});

User.on('change', function (model, name, value) {
  // called when property has changed
});

user.on('change', function (name, value) {
  // same as with constructor but no model instance gets passed
});

User.on('change:username', function (model, value) {
  // called when the username property has changed
});

user.on('change:username', function (value) {
  // same as with constructor but no model instance gets passed
});
```
