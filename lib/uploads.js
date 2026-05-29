var path = require('path');

var IMAGE_ROOT = path.resolve(__dirname, '..', 'public', 'images');
var SAFE_EXTENSIONS = {
	'.gif': true,
	'.jpeg': true,
	'.jpg': true,
	'.png': true,
	'.webp': true
};

function sanitizeSegment(value) {
	return String(value || '')
		.replace(/[^a-zA-Z0-9_-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || 'uncategorized';
}

function safeExtension(filename) {
	var ext = path.extname(filename || '').toLowerCase();
	return SAFE_EXTENSIONS[ext] ? ext : '.jpg';
}

exports.sanitizeSegment = sanitizeSegment;
exports.safeExtension = safeExtension;

exports.buildUploadTarget = function(collectionNumber, originalName) {
	var collectionDir = sanitizeSegment(collectionNumber);
	var filename = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + safeExtension(originalName);
	var directory = path.join(IMAGE_ROOT, collectionDir);
	var absolutePath = path.join(directory, filename);
	return {
		directory: directory,
		absolutePath: absolutePath,
		publicPath: 'public/images/' + collectionDir + '/' + filename
	};
};
