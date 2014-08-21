/**
 * Module Dependencies
 */
var assert = require("assert"),
    parser = require("./lucene");

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
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     *
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    // Teardown a Connection
    teardown: function (conn, cb) {

      if (typeof conn == 'function') {
        cb = conn;
        conn = null;
      }
      if (!conn) {
        connections = {};
        return cb();
      }
      if(!connections[conn]) return cb();
      delete connections[conn];
      cb();
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     */
    drop: function (connection, collection, relations, cb) {
			// Add in logic here to delete a collection (e.g. DROP TABLE logic)
			return cb();
    },

    /**
     *
     * REQUIRED method if users expect to call Model.find(), Model.findOne(),
     * or related.
     *
     * You should implement this method to respond with an array of instances.
     * Waterline core will take care of supporting all the other different
     * find methods/usages.
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

    update: function (connection, collection, options, values, cb) {
      return cb();
    },

    destroy: function (connection, collection, options, values, cb) {
      return cb();
    },

    /**
      * This will allow users to create a graph between two
      * records.
      * @param {object} values
      * @param {function} cb
      */
    graphCreate: function (connection, collection, values, cb){

      checkValues(values);

      var startkey = values.key,
        endCol = values.collection,
        endKey = values.tokey,
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
    }
  },

  graphRead: function (connection, collection, values, cb) {

  },

  graphDelete: function (connection, collection, values, cb) {

  },

  eventCreate: function (connection, collection, values, cb) {
    db.newEventBuilder()
      .from('users', 'Steve')
      .type('update')
      .data({"text": "Hello!"})
      .create()
  },

  eventList: function (connection, collection, values, cb) {
    db.newEventReader()
      .from('users', 'Steve')
      .start(1384534722568)
      .end(1384535726540)
      .type('update')
      .list()
  },


  eventRead: function (connection, collection, values, cb) {
    db.newEventReader()
      .from('users', 'Steve')
      .time(1369832019085)
      .ordinal(9)
      .type('update')
      .get()
  },

  eventUpdate: function (connection, collection, values, cb) {
    db.newEventBuilder()
      .from('users', 'Steve')
      .type('update')
      .time(1369832019085)
      .ordinal(9)
      .data({
        "text": "Orchestrate is awesome!"
      })
      .ref('ae3dfa4325abe21e')
      .update()
  },
  eventDelete: function () {
    db.newEventBuilder()
      .from('users', 'Steve')
      .type('update')
      .time(1369832019085)
      .ordinal(9)
      .remove()
  }

  //private functions
  function checkValues(values){
    assert.equal(!values.hasOwnProperty("key"), false, "You must provide a" +
    "starting key");

    assert.equal(!values.hasOwnProperty("collection"), false, "You must provide a" +
    "end collection.");

    assert.equal(!values.hasOwnProperty("tokey"), false, "You must provide a" +
    "ending key.");

    assert.equal(!values.hasOwnProperty("relation"), false, "You must provide a" +
    "relationship.");
  }

  // Expose adapter definition
  return adapter;



})();
