<template>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-9">
                <l-map ref="map" :zoom=zoom :center="center" v-on:contextmenu="addMarker">
                    <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
                    <l-marker
                            v-if="marker != null"
                            :lat-lng="marker"
                            v-on:click="removeMarker">
                    </l-marker>
                    <l-geo-json
                            v-on:mouseover="getProperties"
                            v-on:mouseout="clearProperties"
                            v-on:click="getGeoClick"
                            :options="geo_options"
                            v-if="geojson != null"
                            :geojson="geojson"></l-geo-json>
                    <!--<l-polygon :lat-lngs="polygon"></l-polygon>-->
                </l-map>
            </div>
            <div class="col-md-3">
                <h2>Parking</h2>
                <input class="form-control" v-model="perimeter" placeholder="Polomer okolia">
                <button class="btn-dark mr-3 w-25 mt-2"
                        v-on:click="addParking" :disabled="clickable_parking">NORMAL</button>
                <button class="btn-dark w-25"
                        v-on:click="addParkingIntersect" :disabled="clickable_parking">PRIENIK</button>
                <hr>
                <h2 class="mt-4">Sport</h2>
                <select v-model="sport_type_selected" class="form-control">
                    <option v-for="(sport) in sport_types"
                            :key="sport"
                            :value="sport">{{ sport }}
                    </option>
                </select>
                <button class="btn-dark w-50 mt-2"
                        v-on:click="addSportPark" :disabled="clickable_sport_park">SPORT-PARK</button>
                <hr>
                <h2 class="mt-4">Districts</h2>
                <button class="btn-dark mt-2 w-25"
                        v-on:click="addDistricts">DISTRICTS</button>
                <hr>
                <h2 class="mt-4">Buildings</h2>
                <button class="btn-dark mt-2 w-25"
                        v-on:click="addBuildings">BUILDINGS</button>
                <input class="form-control mt-4" v-model="perimeter_building" placeholder="Polomer okolia budovy">
                <button class="btn-dark w-50 mt-2"
                        v-on:click="addBuildingParking" :disabled="clickable_building_parking">BUILDINGS PARKING</button>
                <h2 class="mt-5">Properties</h2>
                <div v-for="(value, key) in district_property">
                    {{ key }}: {{ value }}
                </div>
                <button v-if="show_diff" class="btn-dark" v-on:click="parkingRoads">SHOW DIFF</button>
            </div>
        </div>
    </div>
</template>

<script>
    import L from "leaflet"
    import Vue2Leaflet from "vue2-leaflet"
    import _ from "lodash"
    let { LMap, LTileLayer, LMarker, LGeoJson, LPolygon } = Vue2Leaflet;

    function getColor(d) {
        return d > 1000000 ? '#800026' :
            d > 900000  ? '#BD0026' :
                d > 800000  ? '#E31A1C' :
                    d > 700000  ? '#FC4E2A' :
                        d > 600000   ? '#FD8D3C' :
                            d > 500000   ? '#FEB24C' :
                                d > 400000   ? '#FED976' :
                                    '#FFEDA0';
    }

    const high_style = {
        fillColor: '#BD0026',
        weight: 3,
        opacity: 1,
        color: 'red',
        fillOpacity: 0.8

    };

    const high_style_building = {
        fillColor: '#3ebd14',
        weight: 3,
        opacity: 1,
        color: '#3ebd14',
        fillOpacity: 0.8

    };

    let default_style = {
        weight: 2,
        color: '#3b36bd',
        fillColor: '#3b36bd',
        dashArray: '',
        fillOpacity: 0.7
    }

    export default {
        components: { LMap, LTileLayer, LMarker, LGeoJson, LPolygon },
        name: 'Map',
        data: () => {
            return {
                map: null,
                zoom:12,
                center: L.latLng(48.1386, 17.121506),
                url:'https://api.mapbox.com/styles/v1/matefko/cjp77kzwj3lvp2sqjkvowuy6w/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWF0ZWZrbyIsImEiOiJjam5ycXNnbzYwYTdyM3BsOG55MnhyaHI1In0.bemuMa-aC4Cj3MeCGQeXfg',
                attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                marker: null,
                polygon : [],
                geojson: null,
                sport_types: [],
                sport_type_selected: null,
                geo_options: {
                    style: function style(feature) {
                        if (_.has(feature, 'properties.district')) {
                            return {
                                fillColor: getColor(parseFloat(feature.properties.area)),
                                weight: 2,
                                opacity: 1,
                                color: 'white',
                                dashArray: '3',
                                fillOpacity: 0.7
                            };
                        } else if (_.has(feature, 'properties.building')) {
                            return high_style_building

                        } else {
                            return default_style
                        }
                    }
                },
                perimeter: null,
                district_property: null,
                perimeter_building: null,
                highlighted: null,
                geo_clicked: false
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.map = this.$refs.map.mapObject
            });
            this.getSportTypes()

        },
        methods: {
            addParking() {
                let params = {
                    lat: this.marker.lat,
                    lng: this.marker.lng,
                    perimeter: this.perimeter
                };
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/parking_nearby`, {params: params})
                    .then(function (data) {
                        this.geojson = data.body;
                        this.resetProperties()
                    });
            },
            addParkingIntersect() {
                let params = {
                    lat: this.marker.lat,
                    lng: this.marker.lng,
                    perimeter: this.perimeter
                };
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/parking_nearby_intersect`, {params: params})
                    .then(function (data) {
                        this.geojson = data.body
                        this.resetProperties()
                    });
            },
            addSportPark() {
                let params = {
                    lat: this.marker.lat,
                    lng: this.marker.lng,
                    sport: this.sport_type_selected
                };
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/sport_park`, {params: params})
                    .then(function (data) {
                        this.geojson = data.body
                        this.resetProperties()
                    });
            },
            addMarker(event) {
                console.log("Coordinates: " + event.latlng.toString());
                this.marker = event.latlng;
            },
            removeMarker() {
                this.marker = null;
                this.geojson = null;
            },
            getSportTypes() {
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/sport_types`)
                    .then(function (data) {
                        this.sport_types = [];
                        for (let item of data.body) {
                            this.sport_types.push(item.sport)
                        }
                    });
            },
            addDistricts() {
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/districts`)
                    .then(function (data) {
                        this.geojson = data.body
                        this.resetProperties()
                    });
            },
            addBuildings() {
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/buildings`)
                    .then(function (data) {
                        this.geojson = data.body
                        this.resetProperties()
                    });
            },
            addBuildingParking() {
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/building/${this.highlighted.feature.properties.osm_id}/parking/${this.perimeter_building}`)
                    .then(function (data) {
                        this.geojson = data.body;
                        this.geojson.push(this.highlighted.feature);
                        this.resetProperties()
                    });
            },
            parkingRoads() {
                this.$http.get(`${process.env.VUE_APP_ROOT_API}/parking/${this.highlighted.feature.properties.osm_id}/diff`)
                    .then(function (data) {
                        let obj = this.geojson.filter(geo => geo.properties.osm_id === this.highlighted.feature.properties.osm_id)[0];
                        if (data.body.geojson === null) {
                            obj.properties.area_diff = obj.properties.area;
                        } else {
                            obj.geometry = data.body.geojson;
                            obj.properties.area_diff = data.body.area_diff;
                        }
                        this.geo_clicked = false
                    });
            },
            getGeoClick(e) {
                if (_.has(e, ['layer', 'feature', 'properties', 'district'])) {
                    this.$http.get(`http://localhost:3000/district/${e.layer.feature.properties.osm_id}/parking`)
                        .then(function (data) {
                            this.geojson = data.body;
                            this.resetProperties()
                        });
                }
                else {
                    if (this.geo_clicked) {
                        if (Object.is(this.highlighted, e.layer)){
                            this.geo_clicked = false
                        } else {
                            this.reset_highlight(this.highlighted);
                            this.highlighted = e.layer;
                            this.geo_clicked = false;
                            this.getProperties(e);
                            this.geo_clicked = true;
                            e.layer.setStyle(high_style)
                        }
                    } else {
                        this.geo_clicked = true
                    }
                }
            },
            getProperties(e) {
                if (_.has(e, ['layer', 'feature', 'properties']) && !this.geo_clicked) {
                   this.district_property = e.layer.feature.properties;
                }
                if (_.has(e, ['layer', 'feature', 'properties', 'building']) || _.has(e, ['layer', 'feature', 'properties', 'parking'])) {
                    if (!this.geo_clicked) {
                        this.highlighted = e.layer;
                        e.layer.setStyle(high_style)
                    }
                }
            },
            clearProperties(e) {
                if (_.has(e, ['layer', 'feature', 'properties', 'building']) || _.has(e, ['layer', 'feature', 'properties', 'parking'])) {
                    if (!this.geo_clicked) {
                        this.reset_highlight(this.highlighted);
                        //this.highlighted.setStyle(default_style);
                        this.district_property = null;
                    }
                }
            },
            resetProperties() {
                this.geo_clicked = false;
                this.highlighted = null;
                this.district_property = null
            },
            reset_highlight(highlighted) {
               if (highlighted.feature.properties.building) {
                   highlighted.setStyle(high_style_building)
               } else {
                   highlighted.setStyle(default_style)
               }
            },
        },
        computed: {
            clickable_parking() {
                return this.marker === null || this.perimeter === null;
            },
            clickable_sport_park() {
                return this.marker === null || this.sport_type_selected === null;
            },
            clickable_building_parking() {
                return this.geo_clicked === false || this.perimeter_building === null || !_.has(this.highlighted, ['feature', 'properties', 'building']);
            },
            show_diff() {
                return this.geo_clicked === true &&  _.has(this.highlighted, ['feature', 'properties', 'parking']);
            }
        }
    }
</script>

<style scoped>
    .row {
        height: 90vh;
    }
</style>
