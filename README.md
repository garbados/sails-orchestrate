![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# waterline-orchestrate (Sails 0.10.x)

Provides easy access to `orchestrate` from Sails.js & Waterline.

### Installation

To install this adapter, run:

```sh
$ npm install waterline-orchestrate
```

### Usage

This adapter exposes the following methods:

###### `find()`

  ```javascript
  Model.find(id).exec(function (err, results) {
      console.log(err);
      console.log(results);
  });
  ```
  Or you can target multiples.
  ```javascript

      Model.find({
          name: "Bob Marley",
          age: 16
      }).exec(function (err, results) {
          console.log(err);
          console.log(results);
      });

  ```
  This will pull values from Orchestrate.io if they have
  the parameter of name that is the value of Bob Marley and if age is 16.


  To view more methods for finding records please visit the waterline
  documentation. [Waterline](https://github.com/balderdashy/waterline).
###### `create()`

  To create a value

  ```javascript
    var foo = {
      "id" : "key"
      "name": "Steve Kaliski",
      "hometown": "New York, NY",
      "twitter": "@stevekaliski"
    };

    Model.create(foo).exec(function (err, results){
          console.log(err);
          console.log(results);
    });
  ```

  If you do not pass an id to the object before passing to the create
  function, one will be created for you.

  The results returned is the key for the value.

###### `update()`

  How to grab a single value from a collection from Orchestrate.

  ```javascript
  Model.find(id).exec(function (err, results){
      console.log(err);
      console.log(results);
  });
  ```

  Or you can grab a group of objects to be returned in an array by passing an
  object by describing which parameters to search for a value by.

  ```javascript
  Model.find()
  .where({ age: 21 })
  .limit(10)
  .exec(function(err, users) {
    // Now we have an array of users
  });
  ```

  To view more methods for finding records please visit the waterline
  documentation. [Waterline](https://github.com/balderdashy/waterline).

###### `destroy()`

  To remove a value:

  ```javascript
    Model.destroy('key').exec(function (err, results){

    });
  ```
  To remove batch values
  ```javascript
    Model.destroy({
      name: "Steve"
    }).exec(function (err, results){

    });
  ```

## Graphing

An awesome feature Orchestrate includes is the ability to
generate graphs between collections. For example,
consider the collections users and movies. Some user
Steve will like a variety of movies. We can generate this
relationship:

###### `graphCreate()`

+ **Completed**

  Here is how to create a graph between two values. Notice
  that we are passing two collection names, because the "starting"
  collection is your Model name.

  ```javascript
    Users.graphCreate({
      key: "Steve",
      relation: "likes",
      toCollection: "movies",
      toKey: "Superbad"
    }, function (err, results){

    });
  ```

###### `graphRead()`

+ **Completed**

We can then look up all the different items Steve likes:
  ```javascript
    Users.graphRead({
      key: "Steve",
      relation: "likes"
    }, function (err, results){

    });
  ```
We can even take this another step further:
  ```javascript
  Users.graphRead({
    key: "Steve",
    relation: ["friends", "likes"]
  }, function (err, results){

  });
  ```
###### `graphDelete()`
+ **Completed**

This will return all of the things that friends of Steve have liked. This assumes a friend relation has previously been defined between Steve and another user.

If we want to delete a graph relationship:
  ```javascript
    Users.graphDelete({
      key: "Steve",
      relation: "likes",
      toCollection: "movies",
      toKey: "Superbad"
    }, function (err, results){

    });
  ```
## Events

  Events are time-ordered objects that exist with the context of a Key-Value object. Consider comments on a post or messages in a thread.

###### `eventCreate()`
  Creating an event:

  ```javascript
    Users.eventCreate({
      key: 'Steve',
      type: "update",
      data: {
        "test" : "Hello!"
      }
    }, function (err. results){

    });
  ```

  Creating an event at a specified time:

  ```javascript
    Users.eventCreate({
      key: 'Steve',
      type: "update",
      data: {
        "test" : "Hello!"
      },
      time: 1384534722568
    }, function (err. results){

    });
  ```

###### `eventList()`

  Listing events:

  ```javascript
  Users.eventList({
    key: 'Steve',
    start: 1384534722568,
    end: 1384534722568,
    type: "update"
  }, function (err, results){

  });
  ```

###### `eventRead()`

  Getting a specific event:

  ```javascript
  Users.eventRead({
    key: "Steve",
    time: 1369832019085,
    ordinal: 9,
    type: 'update'
  }, function (err, results){

  });
  ```

###### `eventUpdate()`

  Updating an event:
  ```javascript
  Users.eventUpdate({
    key: 'Steve',
    type: 'update',
    time: 1369832019085,
    ordinal: 9,
    data: {
      "text": "Orchestrate is awesome!"
    }
  }, function (err, results){

  });
  ```

  Updating an event, conditionally:

  ```javascript
  Users.eventUpdate({
    key: 'Steve',
    type: 'update',
    time: 1369832019085,
    ordinal: 9,
    data: {
      "text": "Orchestrate is awesome!"
    },
    ref : 'ae3dfa4325abe21e'
  }, function (err, results){

  });

  ```

###### `eventDelete()`

  Deleting an event:

  ```javascript
  Users.eventDelete({
    key: 'Steve',
    type: 'update',
    time: 1369832019085,
    ordinal: 9
  }, function (err, results){

  });
  ```
###### `orchesNative()`

+ **Status**
  + Planned

### Getting Started
```javascript
    /*Add this config/connections.js*/
    orchestrateServer : {
        adapter: "sails-orchestrate",
        masterkey: your master key,
        developmentkey: your developmentkey,
        status: process.env.NODE_ENV || "dev"
    },
```
Make sure that if you are using correct app status as the adapter
will automatically select the appropriate key based on whether the app
is production or not.
