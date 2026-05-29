var test = require('node:test');
var assert = require('node:assert/strict');
var httpHelpers = require('../lib/http.js');

test('requireFields returns blank and missing fields', function() {
	assert.deepEqual(httpHelpers.requireFields({ email: 'user@example.com', password: '  ' }, ['email', 'password', 'name']), [
		'password',
		'name'
	]);
});

test('requireFields accepts present non-empty values', function() {
	assert.deepEqual(httpHelpers.requireFields({ user_no: '42' }, ['user_no']), []);
});
