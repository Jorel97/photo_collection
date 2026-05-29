var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var mkdirp = require('mkdirp');
var formidable = require('formidable');
var fileServer = require('./lib/fileserver.js');
var mysql = require('mysql');
var httpHelpers = require('./lib/http.js');
var staticImages = require('./lib/static-images.js');
var uploads = require('./lib/uploads.js');

var PORT = Number(process.env.PORT || 3030);
var db = mysql.createConnection({
	host: process.env.MYSQL_HOST || '127.0.0.1',
	user: process.env.MYSQL_USER || 'root',
	password: process.env.MYSQL_PASSWORD || '',
	database: process.env.MYSQL_DATABASE || 'photo_collection'
});

function handleDbError(err, resp) {
	if (!err) return false;
	console.error(err);
	httpHelpers.sendJson(resp, 500, { error: 'database_error' });
	return true;
}

db.connect(function(err) {
	if (err) throw err;
	console.log('connected');
});

http.createServer(function(req, resp) {
	var parsedUrl = url.parse(req.url || '');

	if (req.method === 'GET') {
		if (parsedUrl.pathname.indexOf('/public/images') === 0) {
			staticImages.streamPublicImage(parsedUrl.pathname, resp);
			return;
		}

		if (parsedUrl.pathname === '/api') {
			if (parsedUrl.query == null) {
				fs.createReadStream('./public/form.html').pipe(resp);
				return;
			}

			var params = qs.parse(parsedUrl.query);
			var missing = httpHelpers.requireFields(params, ['email', 'password']);
			if (missing.length) {
				httpHelpers.sendJson(resp, 400, {
					error: 'missing_fields',
					fields: missing
				});
				return;
			}

			db.query('select * from users where email = ?', params.email, function(err, row) {
				if (handleDbError(err, resp)) return;
				if (row.length === 0) {
					fileServer.addUser(db, params.email, params.password, function(addErr) {
						if (handleDbError(addErr, resp)) return;
						httpHelpers.sendJson(resp, 201, { status: 'created' });
					});
				} else {
					resp.setHeader('exist_before', true);
					httpHelpers.sendJson(resp, 200, row);
				}
			});
			return;
		}

		httpHelpers.sendJson(resp, 404, { error: 'not_found' });
		return;
	}

	if (req.method === 'POST') {
		if (parsedUrl.pathname === '/addcollection') {
			httpHelpers.readFormBody(req, function(err, parameters) {
				if (err) {
					httpHelpers.sendJson(resp, 400, { error: 'invalid_form_body' });
					return;
				}
				var missing = httpHelpers.requireFields(parameters, ['collection_name', 'user_no']);
				if (missing.length) {
					httpHelpers.sendJson(resp, 400, { error: 'missing_fields', fields: missing });
					return;
				}
				db.query(
					'insert into collections (collection_name, user_no) values (?,?)',
					[parameters.collection_name, parameters.user_no],
					function(insertErr) {
						if (handleDbError(insertErr, resp)) return;
						fileServer.listCollection(db, parameters.user_no, resp);
					}
				);
			});
			return;
		}

		if (parsedUrl.pathname === '/login') {
			httpHelpers.readFormBody(req, function(err, parameters) {
				if (err) {
					httpHelpers.sendJson(resp, 400, { error: 'invalid_form_body' });
					return;
				}
				var missing = httpHelpers.requireFields(parameters, ['email', 'password']);
				if (missing.length) {
					httpHelpers.sendJson(resp, 400, { error: 'missing_fields', fields: missing });
					return;
				}
				fileServer.login(db, parameters, resp);
			});
			return;
		}

		if (parsedUrl.pathname === '/listcollection') {
			httpHelpers.readFormBody(req, function(err, parameters) {
				if (err) {
					httpHelpers.sendJson(resp, 400, { error: 'invalid_form_body' });
					return;
				}
				var missing = httpHelpers.requireFields(parameters, ['user_no']);
				if (missing.length) {
					httpHelpers.sendJson(resp, 400, { error: 'missing_fields', fields: missing });
					return;
				}
				fileServer.listCollection(db, parameters.user_no, resp);
			});
			return;
		}

		if (parsedUrl.pathname.indexOf('/listphoto') === 0) {
			var collectionNo = parsedUrl.pathname.split('/')[2];
			if (!collectionNo) {
				httpHelpers.sendJson(resp, 400, { error: 'missing_collection_number' });
				return;
			}
			fileServer.listPhoto(db, collectionNo, resp);
			return;
		}

		if (parsedUrl.pathname === '/upload') {
			var form = new formidable.IncomingForm();
			form.parse(req, function(err, fields, files) {
				if (err) {
					httpHelpers.sendJson(resp, 400, { error: 'invalid_upload' });
					return;
				}
				var missing = httpHelpers.requireFields(fields, ['file_details']);
				if (missing.length || !files.uploaded_file) {
					httpHelpers.sendJson(resp, 400, {
						error: 'missing_fields',
						fields: missing.concat(files.uploaded_file ? [] : ['uploaded_file'])
					});
					return;
				}

				db.query('select * from photographs where collection_number = ?', fields.file_details, function(queryErr) {
					if (handleDbError(queryErr, resp)) return;
					var target = uploads.buildUploadTarget(fields.file_details, files.uploaded_file.name);
					mkdirp(target.directory, function(mkdirErr) {
						if (mkdirErr) {
							httpHelpers.sendJson(resp, 500, { error: 'upload_directory_error' });
							return;
						}
						fs.rename(files.uploaded_file.path, target.absolutePath, function(renameErr) {
							if (renameErr) {
								httpHelpers.sendJson(resp, 500, { error: 'upload_write_error' });
								return;
							}
							fileServer.addPhoto(db, target.publicPath, fields.file_details, resp);
						});
					});
				});
			});
			return;
		}

		httpHelpers.sendJson(resp, 404, { error: 'not_found' });
		return;
	}

	httpHelpers.sendJson(resp, 405, { error: 'method_not_allowed' });
}).listen(PORT, function() {
	console.log('Listening to ' + PORT);
});

fileServer.printcwd('running');
