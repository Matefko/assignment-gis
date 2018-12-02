const _ = require("lodash");
const queries = require("../db/queries.js");
const util = require("../util/util.js");

let map = {};

map.getSportTypes = async function (db) {
    let q = queries.sport_type();

    return (await db.pg.query(q)).rows
};

map.getParkingNearby = async function (values, db) {
    values = [values.lng, values.lat, values.perimeter];
    let q = queries.parking_nearby(values);
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "parking")
};

map.getParkingNearbyIntersect = async function (values, db) {
    values = [values.lng, values.lat, values.perimeter];
    let q = queries.parking_nearby_intersect(values);
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "parking")
};


map.getSportPark = async function (values, db) {
    values = [values.lng, values.lat, values.sport];
    let q = queries.sport_park(values);
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "line")
};

map.getDistricts = async function (db) {
    let q = queries.districts();
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "district")
};

map.getDistrictParking = async function (values, db) {
    values = [values.osm_id];
    let q = queries.district_parking(values);
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "parking")
};

map.getBuildings = async function (db) {
    let q = queries.buildings();
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "building")
};

map.getBuildingParking = async function (values, db) {
    values = [values.osm_id, values.perimeter];
    let q = queries.building_parking(values);
    let res = (await db.pg.query(q)).rows;

    return util.createResponse(res, "parking")
};

map.getParkingDiff = async function (values, db) {
    values = [values.osm_id];
    let q = queries.parking_diff(values);
    let res = (await db.pg.query(q)).rows[0];
    if (typeof res === "undefined") {
        return {
            geojson: null
        }
    } else
        return {
            geojson: JSON.parse(res.geojson) || {},
            area_diff: res.area_diff
        }
};

module.exports = map;
