'use-strict';

const express = require('express');
const services = require('./services');
const Router = express.Router();

Router.get('/', services.index)
	.post('/', services.index)
	.get('/captcha', services.captcha)
	// .post('/captcha', services.captcha)
	.get('/modify', services.modify)
	.post('/modify', services.modify)
	.get('/signup', services.signup)
	.post('/signup', services.signup)
	.get('/signin', services.signin)
	.post('/signin', services.signin);

module.exports = Router;