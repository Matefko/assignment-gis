const map = require("./map.js");

let ctrl = {};

ctrl.getSportTypes = async function (params) {
    return await map.getSportTypes(params.db);
};

ctrl.getParkingNearby = async function (params) {
    return await map.getParkingNearby(params.values, params.db);
};

ctrl.getParkingNearbyIntersect = async function (params) {
    return await map.getParkingNearbyIntersect(params.values, params.db);
};

ctrl.getSportPark = async function (params) {
    return await map.getSportPark(params.values, params.db);
};

ctrl.getDistricts = async function (params) {
    return await map.getDistricts(params.db);
};

ctrl.getDistrictParking = async function (params) {
    return await map.getDistrictParking(params.values, params.db);
};

ctrl.getBuildings = async function (params) {
    return await map.getBuildings(params.db);
};

ctrl.getBuildingParking = async function (params) {
    return await map.getBuildingParking(params.values, params.db);
};

ctrl.getParkingDiff = async function (params) {
    return await map.getParkingDiff(params.values, params.db);
};


module.exports = ctrl;