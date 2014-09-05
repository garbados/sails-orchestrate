/**
 * Test dependencies
 */

var Adapter;
if (process.env.NODE_DEBUG === 'true') {
  Adapter = require('../../');
} else {
  Adapter = require('../../lib-cov/adapter');
}


describe('registerCollection', function () {

	it('should not hang or encounter any errors', function (done) {
		Adapter.registerCollection({
			identity: 'foo'
		}, done);
	});

	// e.g.
	// it('should create a mysql connection pool', function () {})
	// it('should create an HTTP connection pool', function () {})
	// ... and so on.
});