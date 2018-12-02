let queries = {};

queries.parking_nearby = function (values) {
    let q = `WITH point as (
                SELECT ST_SetSRID(ST_MakePoint($1, $2),4326)::geography
            ), buffer as (
                SELECT st_buffer((SELECT * FROM point), $3, 64)
            ), distances as (
                SELECT ROUND(st_distance((SELECT * FROM point), sub.parking_way::geography)::numeric, 2) as distance, sub.*
                FROM (
                    SELECT p.way as parking_way, p.osm_id, p.name FROM planet_osm_polygon p
                    WHERE p.amenity = 'parking' and p.way && (SELECT * FROM buffer)
                ) sub
            ) SELECT st_asgeojson(distances.parking_way) as geojson, 
                     ROUND(st_area(distances.parking_way::geography)::numeric, 2) as area, 
                     distances.distance, distances.name, distances.osm_id FROM distances WHERE distance <= $3`;

     return {
        name: 'parking-nearby',
        text: q,
        values: values
    }
};

queries.parking_nearby_intersect = function (values) {
    let q = `WITH point as (
                SELECT ST_SetSRID(ST_MakePoint($1, $2),4326)::geography
            ), buffer as (
                SELECT st_buffer((SELECT * FROM point), $3, 64)
            ), intersections as (
                SELECT
                  ST_Intersection(sub.parking_way, (SELECT * FROM buffer))
                   AS geom, ROUND(st_area(sub.parking_way::geography)::numeric, 2) as area, sub.osm_id, sub.name
                  FROM (
                      SELECT p.way::geography as parking_way, p.osm_id, p.name FROM planet_osm_polygon p
                      WHERE p.amenity = 'parking' and (select * from buffer) && p.way
                      ) sub 
            ) SELECT st_asgeojson(intersections.geom) as geojson, 
                     ROUND(st_distance(intersections.geom, (SELECT * from point))::numeric, 2) as distance, 
                     intersections.area, intersections.osm_id, intersections.name FROM intersections`;

    return {
        name: 'parking-nearby-intersect',
        text: q,
        values: values
    }
};

queries.sport_park = function(values) {
    let q = `WITH sport_park as (
              SELECT sport_sport as sport, sport_osm_id as osm_id, sport_way, distance, park_way FROM sport_park_distance WHERE sport_sport=$3
            ), point as (
              SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326) as point
            ), point_sport as (
              SELECT sport_park.osm_id, sport_park.sport_way, st_distance((SELECT * FROM point), sport_park.sport_way) as distance, park_way FROM sport_park
            ), close_sport as (
             SELECT * FROM point_sport WHERE distance = (SELECT MIN(distance) FROM point_sport) LIMIT 1
            )
         SELECT st_asgeojson(line_sub.line) as geojson, 
                ROUND(st_length(line_sub.line::geography)::numeric, 2) as distance 
            FROM (SELECT st_linefrommultipoint(st_collect(sub.arr)) as line  FROM (SELECT ARRAY[(SELECT * FROM point), st_centroid((SELECT sport_way FROM close_sport)), st_centroid(((SELECT park_way FROM close_sport)))] as arr) sub) line_sub;`;

    return {
        name: 'sport-park',
        text: q,
        values: values
    };
};

queries.sport_type = function() {
    let q = `SELECT DISTINCT sport, count(*) FROM sport_places sp GROUP BY sport order by count desc LIMIT 10`;

    return {
        text: q,
        values: []
    };
};

queries.districts = function() {
    let q = `with districts as (
         SELECT way, name, osm_id FROM planet_osm_polygon WHERE admin_level = '8' and  st_within(way, (SELECT way FROM planet_osm_polygon WHERE admin_level = '6'))
        ), parkings as (
         SELECT * from planet_osm_polygon where amenity = 'parking'
        ) SELECT ROUND(SUM(st_area(p.way::geography))::numeric, 2) as area, d.name, d.osm_id, 
            st_asgeojson(d.way) as geojson 
          FROM districts d, parkings p 
          WHERE st_contains(d.way, p.way) 
          GROUP BY d.osm_id, d.name, d.way`;

    return {
        text: q,
        values: []
    };
};

queries.district_parking = function(values) {
    let q = `WITH district as (
             (SELECT way FROM planet_osm_polygon WHERE osm_id = $1)
            )
            SELECT st_asgeojson(way) as geojson, name, osm_id, round(st_area(way::geography)::numeric, 2) as area from planet_osm_polygon WHERE amenity = 'parking' and st_contains((SELECT * FROM district), way)`;


    return {
        name: 'district-parking',
        text: q,
        values: values
    };
}

queries.buildings = function() {
    let q = `SELECT st_asgeojson(way) as geojson, name, osm_id FROM planet_osm_polygon WHERE construction IN ('residential', 'apartments')`;

    return {
        name: 'buildings',
        text: q,
        values: []
    };
}

queries.building_parking = function(values) {
    let q = `with building as (
              SELECT way FROM planet_osm_polygon WHERE osm_id = $1
            ), buffer as (
                            SELECT st_buffer((SELECT * FROM building)::geography, $2, 64))
              SELECT st_asgeojson(p.way) as geojson, p.osm_id, p.name, st_distance(p.way::geography, (SELECT * FROM building)) as distance,
               round(st_area(p.way::geography)::numeric, 2) as area FROM planet_osm_polygon p
                                WHERE p.amenity = 'parking' AND st_intersects(p.way, (SELECT * FROM buffer))`;

    return {
        name: 'building-parking',
        text: q,
        values: values
    };
}

queries.parking_diff = function(values) {
    let q = `with roads as (
              SELECT p.osm_id, p.way, r.osm_id, r.highway, r.name, r.way as aisle
              FROM planet_osm_polygon p
                     JOIN planet_osm_roads r ON st_intersects(p.way, r.way)
              WHERE p.osm_id = $1
              UNION
              SELECT p.osm_id, p.way, l.osm_id, l.highway, l.name, l.way as aisle
              FROM planet_osm_polygon p
                     JOIN planet_osm_line l ON st_intersects(p.way, l.way)
              WHERE p.osm_id = $1
            ), difference as (
              SELECT st_difference(way, st_buffer(st_intersection(st_union(aisle), way)::geography, 0.9)::geometry) as diff FROM roads GROUP BY way
            ) SELECT round(st_area(diff::geography)::numeric, 2) as area_diff, st_asgeojson(diff) as geojson FROM difference`;

    return {
        name: 'parking_diff',
        text: q,
        values: values
    };
}

module.exports = queries;