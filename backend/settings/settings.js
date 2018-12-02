const _ = require("lodash");
const debug = require("debug")("index.settings");

module.exports = function () {
	let config = {};

	try {
		config = require("../config");
	} catch (err) {
		if (_.includes(err.toString(), "SyntaxError")) {
			console.log("!!!", err.toString());
		} else {
			throw(err);
		}
	}

	let settings = {};

	settings.getPort = () => {
		return config.port;
	};

	settings.getPg = () => {
		return config.pg;
	};

    settings.getDirExcluded = function () {
        return config.dir.excluded;
    };

	return settings;
};
