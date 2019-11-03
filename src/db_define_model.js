"use-strict";

const connection = require('./db_config')
const Sequelize = require('sequelize');



const define_model = (name) => {
	const model_path = './model/' + name + '_model.json';
	const fs = require('fs');
	let config = null;
	try {
		config = fs.readFileSync(model_path);
	} catch (err) {
		console.warn(err);
		return null;
	}
	const json_config = JSON.parse(config);
	// console.log(json_config);
	let model_config = {};
	const type_mapping = {
		"INT": Sequelize.INTEGER,
		"STRING": Sequelize.STRING
	}
	for (const col of json_config.cols) {
		const name = col.name;
		const type = col.type;
		model_config[name] = {
			type: type_mapping[type],
			validate: {
				allowNull: false
			}
		};
		if (!col.restrict) continue;
		let flag = false;
		if (col.restrict.min_length) {
			model_config[name].validate["min"] = col.restrict.min_length;
			flag = true;
		}
		if (col.restrict.max_length) {
			model_config[name].validate["max"] = col.restrict.max_length;
			flag = true;
		}
		if (!flag && JSON.stringify(col.restrict) != '{}')
			console.warn('[cannot recognize restriction]' + JSON.stringify(col.restrict));
	}
	console.log(model_config);
	const model = connection.define(
		't_' + json_config.name, model_config, {
			timestamps: true
		}
	);
	console.log('[created model] : ' + model);

	return model;
}

module.exports = define_model;