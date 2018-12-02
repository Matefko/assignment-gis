const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const _ = require("lodash");
const cors = require('cors')
const routes = require("./router/router.js")();
const settings = require("./settings/settings.js")();
const db = require("./db/db.js")(settings.getPg());

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.disable('etag');

let controller = {};

routes.forEach(route => {
    app[route.method](route.url, async function (req, res) {
        try {
            let ret = {};
            let params = {};
            params.req = req;
            params.res = res;

            params.db = db;
            params.values = _.merge({}, params.req.params, params.req.body, params.req.query);
            if (!controller[route.controller]) {
                controller[route.controller] = require("./" + route.controller + "/controller.js");
            }
            ret = await controller[route.controller][route.call](params);
            return res.json(ret);
        } catch (error) {
            console.warn(error);
            return res.status(error.code ? error.code : 500).json(error.message);
        }
    });
});

app.listen(settings.getPort(), "0.0.0.0", function () {
    console.log("PDT App listening on port ", settings.getPort());
}).on("error", function (error) {
    console.error("connection error: ", error);
}).on("finish", function () {
    db.pg.end();
    console.error("listen end!");
});

module.exports = app;
