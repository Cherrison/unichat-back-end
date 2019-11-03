"use-strict";
const Sequelize = require('sequelize');

const connection = new Sequelize('emm', 'ohnkyta', '33554432', {
	host: '47.102.140.37',
	port: '3306',
	dialect: 'mysql',
	pool: {
		min: 0,
		max: 3,
		idle: 10000
	},
	omitNull: true,
	define: {
		charset: 'utf8',
		timestamps: true
	},
	sycn: {
		force: true
	},
	isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ
});

module.exports = connection;