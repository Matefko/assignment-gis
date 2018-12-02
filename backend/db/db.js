const pg = require("pg");
const q = require("squel");
const debug = require("debug")("index:pg");

module.exports = function(config) {

    let db = {};
    db.q = q.useFlavour("postgres");

    let ret = {
        pg: {},
        q: db.q,
    };

    if (!db.pg) {
        db.pg = new pg.Pool({
            "host": config.host,
            "port": config.port,
            "user": config.user,
            "database": config.database,
            "max": config.max,
            "idleTimeoutMillis": config.idleTimeoutMillis
        });
    }

    ret.pg.query = async function(q) {
        try {
            debug(q, 'q');
            return await db.pg.query(q);
        } catch(error) {
            console.error(error.stack, 'Postgres error stacktrace');
            throw new Error(error);
        }
    };

    ret.pg.end = function(){
        debug("Connection end");
        return db.pg.end();
    };

    return ret;
};
