const fs = require("fs");
const _ = require("lodash");
const debug = require("debug")("index.router");
const settings = require("../settings/settings.js")();


let router = {
    getRoutes: function () {
        let routes = [];
        fs.readdirSync(__dirname + "/../").forEach(dir => {
            let path_string = __dirname + "/../" + dir;
            if (fs.lstatSync(path_string).isDirectory() && settings.getDirExcluded().indexOf(dir) < 0) {
                fs.readdirSync(path_string).forEach(file => {
                    try {
                        let parts = file.split(".");
                        if (parts[0] === "router" && parts[1] === "json") {
                            let path = path_string + "/" + file;
                            debug("Load route: " + path);
                            let route = require(path);
                            if (!route.routes) {
                                throw new Error("Missing routes in " + path);
                            }
                            routes = _.union([], routes, route.routes);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
            }

        });
        return routes;
    }
};

module.exports = function () {
    return router.getRoutes();
};

