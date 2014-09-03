![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# waterline-orchestrate

Provides easy access to `orchestrate` from Sails.js & Waterline.

This module is a Waterline/Sails adapter, an early implementation of a rapidly-developing, tool-agnostic data standard.  Its goal is to provide a set of declarative interfaces, conventions, and best-practices for integrating with all sorts of data sources.  Not just databases-- external APIs, proprietary web services, or even hardware.

Strict adherence to an adapter specification enables the (re)use of built-in generic test suites, standardized documentation, reasonable expectations around the API for your users, and overall, a more pleasant development experience for everyone.


### Installation

To install this adapter, run:

```sh
$ npm install waterline-orchestrate
```




### Usage

This adapter exposes the following methods:

###### `find()`

+ **Completed**
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
    This will pull values from Orchestrate.io if they have the parameter of name that is the value of Bob Marley and if age is 16.

###### `create()`

+ **Completed**
    ```javascript

        var foo =  {
            bar: zoo,
            id: blah
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

+ **Completed**

    How to grab a single value from a collection from Orchestrate.

    ```javascript
    Model.find(id).exec(function (err, results){
        console.log(err);
        console.log(results);
    });
    ```

    Or you can grab a group of objects to be returned in an array by passing an object by describing which parameters to search for a value by.

    ```javascript
    Model.find()
    .where({ age: 21 })
    .limit(10)
    .exec(function(err, users) {
      // Now we have an array of users
    });
    ```

    To view more methods for finding records please visit the waterline documentation. [Waterline](https://github.com/balderdashy/waterline).
###### `destroy()`

+ **Status**
  + Planned



### Getting Started
