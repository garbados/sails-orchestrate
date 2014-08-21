var assert = require("assert");

/**
  * The purpose of this file to parse sails
  * objects into lucene queries that can be
  * used on Orchestrate module
  */

  /**
    * Main function to parse sails object from the
    * obj[where] onwards
    */


  function LuceneParse() {

  }

  /**
    * builds the inital query
    *
    * @param {object} fieldObj
    * @return {string}
    */

  LuceneParse.prototype.parse = function(fieldObj) {
    var searchString = "";
    var howMany = Object.keys(fieldSearch).length;
    var cycled = 0;
    for(var field in fieldSearch){

      if(typeof fieldSearch[field] != "object"){
        if(field != "id"){
          searchString += field + ": " + fieldSearch[field];
        } else {
          searchString += fieldSearch[field];
        }
      }

      if(field == "or"){

        var cField = fieldSearch[field];
        searchString += "(";

        for(var i = 0; i <= cField.length - 1; i++){
          if(typeof cField[i] == "object"){
            searchString += subLucene(cField[i]);
          }

          if(i < cField.length - 1){
            searchString += " OR ";
          }
        }

        searchString += ")";

      } else if (typeof fieldSearch[field] == "object") {
        var param = fieldSearch[field];

        searchString += parseObject(param, field);
      }

      cycled ++;

      if (cycled < howMany) {
        searchString += " AND ";
      }
    }
    return searchString;
  }

  /**
   * parses the sub objects of waterline generated
   * queries
   *
   * @param {object} object
   * @return {string}
   */

  function subLucene (object){
    string = "";
    var howmany = Object.keys(object).length;

    var done = 0;
    for(var key in object){
      done++;
      var params = object[key];
      if(typeof params == "object"){
        string += parseObject(params, key);
      }
    else {
      string += key + ": '" + object[key] + "'";
    }

    }
    return string;
  }

  /**
    * the finshes off the parse by look in the sub object
    * for the sails generated parameters that will then
    * be parsed into the lucene search query.
    *
    * @param {objrct} params
    * @param {string} key
    * @return {string}
    */

  function parseObject (params, key) {
    var string = "";

    for(var p in params){
      if(p == "startsWith") string += key + ": " + params[p] + "*";
      if(p == "contains") string +=  key + ": " + "*" + params[p] + "*";
      if(p == "notContains") string += NOT + "'" + params[p] + "'";
      if(p == "weight") string += "^" + params[p];
    }

    return string;
  }

module.exports = new LuceneParse();
