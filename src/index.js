'use-strict';

const express = require('express');
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const log = require('./logger');
const urlLog = require('./urlLog');
const router = require('./router');
const Status = require('./status');

const app = express();
const serverPort = 10010;

app.use(session({
		secret: 'yingyingying',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: true,
			// httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 30 * 2 // 2 months
		}
	}))
	// icon
	.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
	// 日志
	.use((req, res, next) => {
		urlLog(req);
		next();
	})
	// 限制频率
	.use((req, res, next) => {
		let frequency = 0;
		if (req.session.isvalid) {
			frequency = 1000 / 8;
		} else {
			frequency = 1000 * 2;
		}

		let lastAccess = new Date();
		if (req.session.lastAccess && (lastAccess.getTime() - req.session.lastAccess) < frequency) {
			req.session.lastAccess = lastAccess.getTime();
			res.send({
				status: Status.FAILED,
				desc: 'you access this app too frequently',
				msg: 'だが断る'
			});
			return;
		} else if (req.session.lastAccess) {
			log.debug(`访问的间隔 ${lastAccess.getTime() - req.session.lastAccess}`);
		}
		req.session.lastAccess = lastAccess.getTime();
		next();
	})
	// 解析请求体
	.use(bodyParser.json()) // for parsing application/json
	.use(bodyParser.urlencoded({
		extended: true
	})) // for parsing application/x-www-form-urlencoded
	// 路由表
	.use('/', router);
const server = https.createServer({
		key: fs.readFileSync('privatekey.pem'),
		cert: fs.readFileSync('certificate.pem'),
		ca: fs.readFileSync('certrequest.csr')
	}, // 证书
	app
);
log.warn('server created.');
server.listen(serverPort);
module.exports = server;