/**
 * Module Dependencies
 */
var assert = require("assert"),
    lucene = require("./lucene");

module.exports = (function () {


  var connections = {};
  var db = undefined;

  var adapter = {
     identity: 'sails-orchestrate',
     syncable: false,
    // Default configuration for connections
    defaults: {
      masterkey: "",
      developmentkey: "",
      status: "live"
    },



    /**
     *
     * This method runs when a model is initially registered
     * at server-start-time.  This is the only required method.
     *
     * @param  {[type]}   connection [description]
     * @param  {[type]}   collection [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    registerConnection: function(connection, collections, cb) {
      if(db == undefined) {

        if (connection.status == "live"){

          db = require("orchestrate")(connection.masterkey);
        }
        else if (connection.status == "dev"){
          db = require("orchestrate")(connection.developmentkey);
        }
        else {
          assert.fail(connection.status, "Your app status must either be live or dev");
        }
      }

      if(!connection.identity) return cb(new Error('Connection is missing an identity.'));
      if(connections[connection.identity]) return cb(new Error('Connection is already registered.'));

      connections[connection.identity] = connection;

      cb();
    },

    /**
     *
     * This method is used to interface with orchestrate search function
     * @param {object} connection
     * @param {string} collection
     * @param {object} options
     * @param {function} cb
     *
     */

    find: function (connection, collection, options, cb) {

      var limit = options.limit ? options.limit : 20;
      var offset = options.skip ? options.skip : 0;

      if (options.where == null) {
        query =  "*";
      } else {
        var query = lucene.parse(options.where)
      }

		  if (options.where && options.where.id) {
        db.get(collection, options.where.id)
          .then(function (results){
            cb(null, results.body);
          })
          .fail(function (err){
            cb(err);
          });
      } else {
        db.newSearchBuilder()
          .collection(collection)
          .limit(limit)
          .offset(offset)
          .query(query)
          .then(function (results){
            cb(null, results.body.results)
          })
          .fail(function (err){
            cb(err)
          });
      }

    },

    /**
      * this function is what creates records in selected orchestreate
      * app.
      *
      * @param {object} connection
      * @param {string} collection
      * @param {object} values
      * @param {function} cb
      */

    create: function (connection, collection, values, cb) {


      if (!values.id || values.id == ""){
        delete values.id;
        db.post(collection, values).fail(function (err){
          cb(err, undefined);
        })
        .then(function (results){
          orchestrateGenKey = results.headers.location.split("/")[3];
          cb(undefined, {key: orchestrateGenKey});
        })
      } else {

        var key = values.id;
        delete values.id;

        db.put(collection, key, values)
          .then(function (results){
            cb(undefined, {key: key})
          })
          .fail(function (err){
            cb(err, undefined);
          })
      }
    },


    /**
      * this function is what update records in selected orchestrate
      * app.
      *
      * @param {object} connection
      * @param {string} collection
      * @param {object} options (used to identify how to fetch records)
      * @param {object} values
      * @param {function} cb
      */

    update: function (connection, collection, options, values, cb) {
      var self = this;
      var finalResults = [];
      self.find(connection, collection, options, function (err, results){
        if(err) cb(err)

        if(results.length > 0){
          results.forEach(function (obj, i){

            results[i].value = updateObject(values, obj.value);
            results[i].value.id = obj.path.key;

            iterUpdate(collection, results[i].value, i, function (err, response, it){
              if(err) cb(err);
              finalResults.push(response);

              if(finalResults.length == results.length){
                cb(null, finalResults);
              }
            });
          });
        }

        else if(typeof results == "object"){

          updateValues = updateObject(values, results);

          updateValues.id = options.where.id;

          self.create(connection, collection, updateValues).exec(function (err, results){

            delete updateValues.id;
            cb(err, updateValues);

          });
        }
      });

      // model.find(options).exec(function (err, results){
      //   console.log(results);
      // });
      //return cb();
    },

    /**
      * this function is what destroys records in selected orchestrate
      * app.
      *
      * @param {object} connection
      * @param {string} collection
      * @param {object} options (used to identify how to fetch records)
      * @param {object} values
      * @param {function} cb
      */

    destroy: function (connection, collection, options, values, cb) {
      return cb();
    },

    /**
      * This will allow users to create a graph between two
      * records.
      *
      * @param {object} connection
      * @param {string} collection
      * @param {object} values
      * @param {function} cb
      */
    graphCreate: function (connection, collection, values, cb){

      checkValues(values);

      var startkey = values.key,
        endCol = values.toCollection,
        endKey = values.toKey,
        relation = values.relation;

      db.newGraphBuilder()
      .create()
      .from(collection, startkey)
      .related(relation)
      .to(endCol, endKey)
      .then(function (results){
        cb(null, results.body);
      })
      .fail(function (err){
        cb(err.body);
      });
  },

  /**
    * Reads the graph elements from a key/value object
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  graphRead: function (connection, collection, values, cb) {
    var g = db.newGraphReader()
              .get()
              .from(collection, values.key)

    if(typeof values.relation == "array") {
      g = g.related(relation[0], relation[1])

    } else if(typeof values.relation == "string"){
      g = g.related(values.relation)
    } else {
      // assert.fail()
    }

    g.then(function(results){
      cb(null, results.body)
    })
    .fail(function (err){
      cb(err);
    });
  },


  /**
    * Deletes a graph element from a key/value object
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  graphDelete: function (connection, collection, values, cb) {
    db.newGraphBuilder()
      .remove()
      .from(collection, values.fromKey)
      .related(values.relation)
      .to(values.toCollection, values.toKey)
      .then(function (results){
        cb(null, results.body)
      })
      .fail(function (err){
        cb(err)
      });
  },

  /**
    * Event creation object
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  eventCreate: function (connection, collection, values, cb) {
    var eventDB = db.newEventBuilder()
      .from(collection, values.key)
      .type(values.type);

      if(values.time){
        eventDB.time(values.time);
      }

      eventDB.data(values.data)
      .create()
      .then(function (results){
        cb(null, results.body);
      })
      .fail(function (err){
        cb(err)
      });
  },


  /**
    * Event display list of objects
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  eventList: function (connection, collection, values, cb) {
    eventsDb = db.newEventReader().from(collection, values.key);

    if(values.start){
      eventsDb.start(values.start)
    }

    if(values.end){
      eventsDb.end(values.end)
    }

    eventsDb.type(values.type)
    .list()
    .then(function (results){
      cb(null, results.body)
    })
    .fail(function (err){
      cb(err);
    });
  },

  /**
    * Event display a single object.
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  eventRead: function (connection, collection, values, cb) {
    eventsDb = db.newEventReader().from(collection, values.key)
    if(values.time){
      eventsDb.time(values.time)
    }

    if(values.ordinal){
      eventsDb.ordinal(values.ordinal)

    }
    eventsDb.type('update')
      .get()
      .then(function(results){
        cb(null, results.body);
      })
      .fail(function (err){
        cb(err);
      })
  },


  /**
    * Update an event object
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  eventUpdate: function (connection, collection, values, cb) {
    eventsDB = db.newEventBuilder()
      .from(collection, values.key)
      .type(values.type)
      .time(values.time)
      .ordinal(values.ordinal)
      .data(values.data)
      .ref(values.ref)
      .update()
      .then(function (results){
        cb(null, results);
      })
      .fail(function (err){
        cb(err);
      });
  },

  /**
    * Event delete object
    *
    * @param {object} connection
    * @param {string} collection
    * @param {object} values
    * @param {function} cb
    */

  eventDelete: function (connection, collection, values, cb) {
    eventsDB = db.newEventBuilder()
      .from(collection, values.key)
      .type(values.type)
      .time(values.time)
      .ordinal(values.ordinal)
      .remove()
      .then(function (results){
        cb(null, results);
      })
      .fail(function (err){
        cb(err);
      });
  }
};


//private functions
function checkValues(values){
  assert.equal(!values.hasOwnProperty("key"), false, "You must provide a" +
    "starting key");

  assert.equal(!values.hasOwnProperty("toCollection"), false, "You must provide a" +
    "end collection.");

  assert.equal(!values.hasOwnProperty("toKey"), false, "You must provide a" +
    "ending key.");

  assert.equal(!values.hasOwnProperty("relation"), false, "You must provide a" +
    "relationship.");
}

/**
  * This is a function to update stored objects
  *
  * @param {object} updatedValues
  * @param {object} objectToUpdate
  *
  */

function updateObject(updatedValues, objectToUpdate){

  for(var key in updatedValues) {
    objectToUpdate[key] = updatedValues[key];
  }

  return objectToUpdate;
}

/**
  * This funtion is made for a iteration update
  *
  * @param {object} value
  * @param {int} interator
  * @param {function} cb
  *
  */
  function iterUpdate(collection, value, iterator, cb){
    var key = value.id;
    delete value.id;

    db.put(collection, key, value)
      .then(function (results){
        cb(undefined, {key: key}, iterator);
      })
      .fail(function (err){
        cb(err, undefined);
      })
  }


  // Expose adapter definition
  return adapter;

})();
