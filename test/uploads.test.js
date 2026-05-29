var test = require('node:test');
var assert = require('node:assert/strict');
var uploads = require('../lib/uploads.js');

test('sanitizeSegment removes path and shell-sensitive characters', function() {
	assert.equal(uploads.sanitizeSegment('../album 42!!'), 'album-42');
});

test('safeExtension preserves known image extensions and falls back to jpg', function() {
	assert.equal(uploads.safeExtension('selfie.PNG'), '.png');
	assert.equal(uploads.safeExtension('payload.exe'), '.jpg');
});

test('buildUploadTarget returns a public image path for sanitized collection id', function() {
	var target = uploads.buildUploadTarget('../album 42', 'selfie.png');
	assert.match(target.publicPath, /^public\/images\/album-42\/\d+-[a-z0-9]+\.png$/);
	assert.match(target.absolutePath, /public[\\/]images[\\/]album-42[\\/]\d+-[a-z0-9]+\.png$/);
});
