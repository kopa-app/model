# Kopa.io Model

Tiny model schema definitions for client and server used in kopa.io

## Install

```bash
$ npm install kopa-app/model
```

## Hacking

Run the tests with:

```bash
$ npm test
```

## Usage

```javascript
var Schema = require('kopa-model');

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
  }
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
```
