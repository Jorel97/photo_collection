var fs = require('fs');
var path = require('path');

var IMAGE_ROOT = path.resolve(__dirname, '..', 'public', 'images');
var CONTENT_TYPES = {
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp'
};

function resolvePublicImagePath(requestPath) {
	var relativePath = String(requestPath || '').replace(/^\/public\/images\/?/, '');
	var absolutePath = path.resolve(IMAGE_ROOT, relativePath);
	if (absolutePath.indexOf(IMAGE_ROOT + path.sep) !== 0 && absolutePath !== IMAGE_ROOT) {
		return null;
	}
	return absolutePath;
}

function contentTypeFor(filePath) {
	return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

exports.resolvePublicImagePath = resolvePublicImagePath;
exports.contentTypeFor = contentTypeFor;

exports.streamPublicImage = function(requestPath, resp) {
	var absolutePath = resolvePublicImagePath(requestPath);
	if (!absolutePath) {
		resp.writeHead(400, { 'Content-Type': 'application/json' });
		resp.end(JSON.stringify({ error: 'invalid_image_path' }));
		return;
	}

	fs.stat(absolutePath, function(err, stats) {
		if (err || !stats.isFile()) {
			resp.writeHead(404, { 'Content-Type': 'application/json' });
			resp.end(JSON.stringify({ error: 'image_not_found' }));
			return;
		}
		resp.writeHead(200, { 'Content-Type': contentTypeFor(absolutePath) });
		fs.createReadStream(absolutePath).pipe(resp);
	});
};
