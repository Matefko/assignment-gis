const _ = require("lodash");

let util = {};

util.createResponse = function (rows, type) {
    let response = [];
    for (let row of rows) {
        let obj = {
            "type": "Feature",
            "geometry": JSON.parse(row.geojson),
            "properties": {
                [type]: true
            }
        };
        delete row.geojson;
        for (let key of Object.keys(row)) {
            switch (key) {
                case 'name':
                    row.name = row.name || type;
                    break;
                case 'distance':
                    row.distance = `${row.distance} m`;
                    break;
                case 'area':
                    row.area = `${row.area} m2`
            }
            _.set(obj,['properties', key], row[key]);
        }
        response.push(obj)
    }

    return response
}

module.exports = util;