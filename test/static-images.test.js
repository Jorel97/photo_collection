var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('node:path');
var staticImages = require('../lib/static-images.js');

test('resolvePublicImagePath keeps valid requests inside public images', function() {
	var resolved = staticImages.resolvePublicImagePath('/public/images/album/photo.jpg');
	assert.equal(path.basename(resolved), 'photo.jpg');
	assert.equal(path.basename(path.dirname(resolved)), 'album');
	assert.equal(path.basename(path.dirname(path.dirname(resolved))), 'images');
});

test('resolvePublicImagePath rejects path traversal attempts', function() {
	assert.equal(staticImages.resolvePublicImagePath('/public/images/../../server.js'), null);
});

test('contentTypeFor maps common image extensions', function() {
	assert.equal(staticImages.contentTypeFor('photo.jpg'), 'image/jpeg');
	assert.equal(staticImages.contentTypeFor('photo.png'), 'image/png');
	assert.equal(staticImages.contentTypeFor('photo.unknown'), 'application/octet-stream');
});
