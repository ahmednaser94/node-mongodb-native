"use strict";

var f = require('util').format;

exports['Should iterate cursor'] = {
  metadata: { requires: { topology: "single" } },

  test: function(configuration, test) {
    var Server = require('../../../lib2/topologies/server')
      , bson = require('bson').BSONPure.BSON;

    // Attempt to connect
    var server = new Server({
      host: configuration.host, port: configuration.port, bson: new bson()
    });

    // Add event listeners
    server.on('connect', function(_server) {
      var ns = f("integration_tests.cursor1");
      // Execute the write
      _server.insert(ns, [{a:1}, {a:2}, {a:3}], {
        writeConcern: {w:1}, ordered:true
      }, function(err, results) {
        test.equal(null, err);
        test.equal(3, results.result.n);

        // Execute find
        var cursor = _server.cursor(ns, {
            find: ns
          , query: {}
          , batchSize: 2
        });

        // Execute next
        cursor.next(function(err, d) {
          test.equal(null, err);
          test.equal(1, d.a);
          test.equal(1, cursor.bufferedCount());

          // Kill the cursor
          cursor.next(function(err, d) {
            test.equal(null, err);
            test.equal(2, d.a);
            test.equal(0, cursor.bufferedCount());
            // Destroy the server connection
            _server.destroy();
            // Finish the test
            test.done();
          });
        });
      });
    });

    // Start connection
    server.connect();
  }
}

exports['Should iterate cursor but readBuffered'] = {
  metadata: { requires: { topology: "single" } },

  test: function(configuration, test) {
    var Server = require('../../../lib2/topologies/server')
      , bson = require('bson').BSONPure.BSON;

    // Attempt to connect
    var server = new Server({
      host: configuration.host, port: configuration.port, bson: new bson()
    });

    var ns = f("%s.cursor2", configuration.db);
    // Add event listeners
    server.on('connect', function(_server) {
      // Execute the write
      _server.insert(ns, [{a:1}, {a:2}, {a:3}, {a:4}, {a:5}], {
        writeConcern: {w:1}, ordered:true
      }, function(err, results) {
        test.equal(null, err);
        test.equal(5, results.result.n);

        // Execute find
        var cursor = _server.cursor(ns, {
            find: ns
          , query: {}
          , batchSize: 5
        });

        // Execute next
        cursor.next(function(err, d) {
          test.equal(null, err);
          test.equal(1, d.a);
          test.equal(4, cursor.bufferedCount());

          // Read the buffered Count
          var items = cursor.readBufferedDocuments(cursor.bufferedCount());

          // Get the next item
          cursor.next(function(err, d) {
            test.equal(null, err);
            test.equal(null, d);

            // Destroy the server connection
            _server.destroy();
            // Finish the test
            test.done();
          });
        });
      });
    });

    // Start connection
    server.connect();
  }
}

exports['Should callback exhausted cursor with error'] = {
  metadata: { requires: { topology: "single" } },

  test: function(configuration, test) {
    var Server = require('../../../lib2/topologies/server')
      , bson = require('bson').BSONPure.BSON;

    // Attempt to connect
    var server = new Server({
      host: configuration.host, port: configuration.port, bson: new bson()
    });

    var ns = f("%s.cursor3", configuration.db);
    // Add event listeners
    server.on('connect', function(_server) {
      // Execute the write
      _server.insert(ns, [{a:1}], {
        writeConcern: {w:1}, ordered:true
      }, function(err, results) {
        test.equal(null, err);
        test.equal(1, results.result.n);

        // Execute find
        var cursor = _server.cursor(ns, { find: ns, query: {}, batchSize: 5 });

        // Execute next
        cursor.next(function(err, d) {
          test.equal(null, err);
          test.equal(1, d.a);

          // Get the next item
          cursor.next(function(err, d) {
            test.equal(null, err);
            test.equal(null, d);

            cursor.next(function(err, d) {
              test.ok(err);
              test.equal(null, d);
              // Destroy the server connection
              _server.destroy();
              // Finish the test
              test.done();
            });
          });
        });
      });
    })

    // Start connection
    server.connect();
  }
};

exports['Should force a getMore call to happen'] = {
  metadata: { requires: { topology: "single" } },

  test: function(configuration, test) {
    var Server = require('../../../lib2/topologies/server')
      , bson = require('bson').BSONPure.BSON;

    // Attempt to connect
    var server = new Server({
      host: configuration.host, port: configuration.port, bson: new bson()
    });

    var ns = f("%s.cursor4", configuration.db);
    // Add event listeners
    server.on('connect', function(_server) {
      // Execute the write
      _server.insert(ns, [{a:1}, {a:2}, {a:3}], {
        writeConcern: {w:1}, ordered:true
      }, function(err, results) {
        test.equal(null, err);
        test.equal(3, results.result.n);

        // Execute find
        var cursor = _server.cursor(ns, { find: ns, query: {}, batchSize: 2 });

        // Execute next
        cursor.next(function(err, d) {
          test.equal(null, err);
          test.equal(1, d.a);

          // Get the next item
          cursor.next(function(err, d) {
            test.equal(null, err);
            test.equal(2, d.a);

            cursor.next(function(err, d) {
              test.equal(null, err);
              test.equal(3, d.a);
              // Destroy the server connection
              _server.destroy();
              // Finish the test
              test.done();
            });
          });
        });
      });
    })

    // Start connection
    server.connect();
  }
};

exports['Should force a getMore call to happen then call killCursor'] = {
  metadata: { requires: { topology: "single" } },

  test: function(configuration, test) {
    var Server = require('../../../lib2/topologies/server')
      , bson = require('bson').BSONPure.BSON;

    // Attempt to connect
    var server = new Server({
      host: configuration.host, port: configuration.port, bson: new bson()
    });

    var ns = f("%s.cursor4", configuration.db);
    // Add event listeners
    server.on('connect', function(_server) {
      // Execute the write
      _server.insert(ns, [{a:1}, {a:2}, {a:3}], {
        writeConcern: {w:1}, ordered:true
      }, function(err, results) {
        test.equal(null, err);
        test.equal(3, results.result.n);

        // Execute find
        var cursor = _server.cursor(ns, { find: ns, query: {}, batchSize: 2 });

        // Execute next
        cursor.next(function(err, d) {
          test.equal(null, err);
          test.equal(1, d.a);

          // Get the next item
          cursor.next(function(err, d) {
            test.equal(null, err);
            test.equal(2, d.a);

            // Kill cursor
            cursor.kill(function() {

              // Should error out
              cursor.next(function(err, d) {
                test.equal(null, err);
                test.equal(null, d);
                // Destroy the server connection
                _server.destroy();
                // Finish the test
                test.done();
              });
            });
          });
        });
      });
    })

    // Start connection
    server.connect();
  }
};
