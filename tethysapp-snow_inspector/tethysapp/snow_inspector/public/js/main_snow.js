console.log("Snow inspector! main_snow.js");

var chart;
var pixelBoundaries;
var styleCache = {};

function getUrlVars() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i = 0; i < hashes.length; i++)
	{
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}   return vars;
}


function get_date_for_chart(date) {
    var year = date.substring(0,4);
	var mon = parseInt(date.substring(5,7));
	var day = date.substring(8,10);
	return Date.UTC(year, mon-1, day);
}

var sequential_update = function(url){
	return function() {
		console.log('starting ' + url);
		//todo put ajax here
		$.getJSON(url).done(function () {
			console.log('received!');
		})
	}
}

function add_data_to_chart(beginDate, response_data, myChart) {

	var timeSeries = [];
	for (var i = 0; i < response_data.data.length; i++){
		if (response_data.data[i] !== null) {
			timeSeries.push([beginDate + (86400000 * i), response_data.data[i]]);
		}
	}
	myChart.series[0].setData(timeSeries);
}

function add_data_to_chart2(response_data, myChart, iRequest, layer) {
    myChart.addSeries({});
	var n = myChart.series[0].data.length;
	var beginDate = Date.parse(response_data.query.startdate);
	for (var i = 0; i < response_data.data.length; i++){
		if (response_data.data[i] !== null) {
			var newPoint = [beginDate + (86400000 * i), response_data.data[i]];
			myChart.series[0].addPoint(newPoint);
			//color and assign 0 to values over 100 corresponding to the error classification
			if (layer == "MODIS_Terra_NDSI_Snow_Cover"){
			    //if "missing data
                if (response_data.data[i] == 101) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: 'null'//black
                        }
                    });
                }
                //if "no decision"
                else if (response_data.data[i] == 102) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#f4a742'//orange
                        }
                    });
                }
                //if "night"
                else if (response_data.data[i] == 103) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#e542f4'//purple
                        }
                    });
                }
                //if "inland water"
                else if (response_data.data[i] == 104) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#45f442'//green
                        }
                    });
                }
                //if "ocean"
                else if (response_data.data[i] == 105) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#4283f4'//blue
                        }
                    });
                }
                //if "cloud"
                else if (response_data.data[i] == 106) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#42f4f1' //light blue
                        }
                    });
                }
                //if "detector saturated"
                else if (response_data.data[i] == 107) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: 'red'
                        }
                    });
                }
                //if "fill"
                else if (response_data.data[i] == 108) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#f442b0' //pink
                        }
                    });
                }
                if (response_data.data[i] > 100) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        y: 0
                    });
                }
            } else if (layer == "AMSR2_Snow_Water_Equivalent") { //color and assign 0 if value is greater than 40
                //if "fill"
                if (response_data.data[i] == 41) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#f442b0'//pink
                        }
                    });
                }
                //if "land"
                else if (response_data.data[i] == 42) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#45f442' //green
                        }
                    });
                }
                //if "ice"
                else if (response_data.data[i] == 43) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#42f4f1' //light blue
                        }
                    });
                }
                //if "water"
                else if (response_data.data[i] == 44) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: '#4283f4' //blue
                        }
                    });
                }
                //if "no data"
                else if ((response_data.data[i] == 45)||(response_data.data[i] ==46)) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        marker:{
                            fillColor: 'null' //black
                        }
                    });
                }
                if (response_data.data[i] > 40) {
                    myChart.series[0].data[i + (iRequest * 15)].update({
                        y: 0
                    });
                }
            }
		}
	}
}

function set_chart_tooltip(myChart, tile_url, xpixel, ypixel, layer) {
    var array = tooltip_units(layer);
    var parameter = array[0], unit = array[1];
	myChart.tooltip.options.formatter = function() {
		var x_date = (new Date(this.x)).toISOString().substring(0, 10);
		var url = tile_url.replace("DATE_PLACEHOLDER", x_date);
		var html = '<p>Original Data: ' + x_date + parameter + this.y + unit + '</p><div class="img-container" style="position: relative"><img width="256px" height="256px" style="border:1px solid #000000" src="' + url + '" /><p style="position: absolute; left: ' +
xpixel +'px; top: ' + ypixel +'px; color: #000000; font-weight:bold">X</p></div>';
                //console.log(html);
		return html;
	}
}

function tooltip_units(layer) {
    var parameter, unit;
    if (layer == "MODIS_Terra_NDSI_Snow_Cover") {
        parameter = ' snow: ';
        unit = '%';
    } else if (layer = "SMAP_L4_Snow_Mass") {
        parameter = ' mass: ';
        unit = 'km/m2';
    } else if (layer == "AMSR2_Snow_Water_Equivalent") {
        parameter = ' water: ';
        unit = 'mm';
    }
    return [parameter, unit];
}



function add_days(time_ms, days) {
	return (new Date(time_ms + 86400000 * days)).toISOString().substring(0, 10);
}

//gets the proper URL requests for the AJAX function call
function get_ajax_urls(lat, lon, begin_ms, end_ms, step, zoom, layer, level) {
	var base_url = "/apps/snow-inspector/snow_data/?layer=" + layer + "&level=" + level + "&zoom=" + zoom + "&lat=" + lat + "&lon=" + lon;
	var urls = [];
	var nSteps = ((end_ms - begin_ms) / 86400000) / step;
	var begin_ms1 = begin_ms - 86400000;
	for (i=0; i < nSteps; i++) {
		var iBegin = add_days(begin_ms1, i*step + 1);
		var iEnd = add_days(begin_ms, i*step + step);
		var iUrl = base_url + "&start=" + iBegin + "&end=" + iEnd;
		urls.push(iUrl);
	}
	var iBeginLast = begin_ms + (nSteps * step * 86400000);
	if (iBeginLast < end_ms) {
		urls.push(base_url + "&start=" + iBeginLast + "&end=" + iEnd);
	}
	return(urls);
}

var xhr_array = [];

function update_chart(lat, lon, begin, end, zoom, layer, level) {

   var beginDate = Date.parse(begin);
   var endDate = Date.parse(end);
   var urls = get_ajax_urls(lat, lon, beginDate, endDate, 15, zoom, layer, level);
   for (var u=0; u< urls.length; u++) {
   	console.log(urls[u]);
   }

   //the number of the request currently executed
   var iRequest = 0;

        //adds data to chart with existing data
        function ajax2() {
            console.log("ajax2! " + urls[iRequest]);

                var xhr;
                if (xhr){
                    xhr.abort();
                }

                xhr = $.ajax({
                url: urls[iRequest],
                type: "GET",
                dataType: "json",

                success: function(response_data){

                    var response_tile = response_data.tile;

                    if (response_tile.includes(layer)) {

                        if (iRequest === 0) {
                            set_chart_tooltip(chart, response_data.tile,
                                                  response_data.xpixel,response_data.ypixel, layer);
                        }

                        add_data_to_chart2(response_data, chart, iRequest, layer);

                        iRequest++;
                        if (iRequest < urls.length) {
                            xhr_array.push(ajax2());
                        }
                    }
                },
                error: function() {
                    //try to repeat data retrieval..
                    console.log("error for URL: " + urls[iRequest]);
                    //xhr_array.push(ajax2()); drew made this.

                }
            });

            return xhr;
        }

   xhr_array.push(ajax2());
}


function make_point_layer() {
	var source = new ol.source.Vector();
	var vector = new ol.layer.Vector({
	  source: source,
	  style: new ol.style.Style({
		fill: new ol.style.Fill({
		  color: 'rgba(255, 255, 255, 0.2)'
		}),
		stroke: new ol.style.Stroke({
		  color: '#ffcc33',
		  width: 2
		}),
		image: new ol.style.Circle({
		  radius: 7,
		  fill: new ol.style.Fill({
			color: '#ffcc33'
		  })
		})
	  })
	});
	return(vector);
}


function add_point_to_map(layer, coordinates){
	var coords = ol.proj.transform(coordinates, 'EPSG:4326','EPSG:3857');
	var geometry = new ol.geom.Point(coords);
	var feature = new ol.Feature({
		geometry: geometry,
		attr: '1'
	});
	layer.getSource().clear();
	layer.getSource().addFeature(feature);
}

function add_snow_pixels_to_map(map, map_date, zoom, layer, level) {
	var extent = map.getView().calculateExtent(map.getSize());

	var extentLatLon = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
	var xmin = extentLatLon[0];
	var ymin = extentLatLon[1];
	var xmax = extentLatLon[2];
	var ymax = extentLatLon[3];

	var baseurl = '/apps/snow-inspector/pixel-borders/';

	var pixel_url = baseurl + '?layer=' + layer + '&level=' + level + '&zoom=' + zoom + '&lonmin=' + xmin + '&latmin=' + ymin + '&lonmax=' + xmax + '&latmax=' + ymax + '&date=' + map_date;

	var pixel_source = new ol.source.GeoJSON({
		projection : 'EPSG:3857',
		url : pixel_url
	});

	if (typeof pixelBoundaries === 'undefined') {
		pixelBoundaries = new ol.layer.Vector({
			source : pixel_source,
			style : function(feature, resolution) {

				var text = feature.get('val');
				var pixel_color = get_pixel_color(layer, text);
				var pixel_value = get_pixel_value(layer, text);

				if (!styleCache[text]) {
					styleCache[text] = [new ol.style.Style({
						fill : new ol.style.Fill({
							color : 'rgba(255, 255, 255, 0.1)'
						}),
						stroke : new ol.style.Stroke({
							color : '#319FD3',
							width : 1
						}),
						text : new ol.style.Text({
							font : '12px sans-serif',
							text : pixel_value,
							fill : new ol.style.Fill({
								color : pixel_color//'#000'
							}),
							stroke : new ol.style.Stroke({
								color : '#fff',
								width : 3
							})
						}),
						zIndex : 999
					})];
				}
				return styleCache[text]
			}
		});
		map.addLayer(pixelBoundaries);
	} else {
		pixelBoundaries.setSource(pixel_source);
	}
}

function get_pixel_value(layer, text) {

    var pixel_val;

    if (layer == "MODIS_Terra_NDSI_Snow_Cover") {
        if (text > 100) {
            pixel_val = 0;
        } else {
            pixel_val = text;
        }
    } else if (layer == "AMSR2_Snow_Water_Equivalent") {
        if (text > 40) {
            pixel_val = 0;
        } else {
            pixel_val = text;
        }
    }
    return pixel_val;
}


function get_pixel_color(layer, value) {

    var fillColor;

    if (layer == "MODIS_Terra_NDSI_Snow_Cover"){
        //if "missing data
        if (value == 101) {
            fillColor = 'null';//black
        }
        //if "no decision"
        else if (value == 102) {
            fillColor = '#f4a742';//orange
        }
        //if "night"
        else if (value == 103) {
            fillColor = '#e542f4';//purple
        }
        //if "inland water"
        else if (value == 104) {
            fillColor = '#45f442';//green
        }
        //if "ocean"
        else if (value == 105) {
            fillColor = '#4283f4';//blue
        }
        //if "cloud"
        else if (value == 106) {
            fillColor = '#42f4f1';//light blue
        }
        //if "detector saturated"
        else if (value == 107) {
            fillColor = 'red';
        }
        //if "fill"
        else if (value == 108) {
            fillColor = '#f442b0' //pink
            console.log("SHOULD BE PINK!");
        }
        else if (value < 100) {
            fillColor = '#000';
        }
    } else if (layer == "AMSR2_Snow_Water_Equivalent") { //color and assign 0 if value is greater than 40
        //if "fill"
        if (value == 41) {
            fillColor = '#f442b0';//pink
        }
        //if "land"
        else if (value == 42) {
            fillColor = '#45f442'; //green
        }
        //if "ice"
        else if (value == 43) {
            fillColor = '#42f4f1'; //light blue
        }
        //if "water"
        else if (value == 44) {
            fillColor = '#4283f4'; //blue
        }
        //if "no data"
        else if ((value == 45)||(value ==46)) {
            fillColor ='#000000' //black
        } else {
            fillColor = '#000';
        }
    } else {
        fillColor = '#000';
    }
    return fillColor;
}

function make_base_layer() {

	var params = getUrlVars();
	var layerName = params.layer;

	// build the BING Map layer
	if (layerName === 'bing') {
		var bing_layer = new ol.layer.Tile({
			source: new ol.source.BingMaps({
				imagerySet: 'AerialWithLabels',
				key: 'AkCPywc954jTLm72zRDvk0JpSJarnJBYPWrNYZB1X8OajN_1DuXj1p5u1Hy2betj'
			})
		})
		return bing_layer;
	}

    //build OpenStreet map layer
	if (layerName == 'osm') {
		var openstreet_layer = new ol.layer.Tile({
			source: new ol.source.OSM()
		});
		return openstreet_layer;
	}

    //build MapQuest map layer
	if (layerName == 'mapQuest') {
		var mapQuest_layer = new ol.layer.Tile({
			source: new ol.source.MapQuest({layer: 'sat'})
		});
		return mapQuest_layer;
	}

    //default option: build Esri map layer
	layerName = 'esri';
	if (layerName == 'esri') {
		var esri_layer = new ol.layer.Tile({
			source: new ol.source.XYZ({
				attribution: [new ol.Attribution({
					html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
					'rest/services/World_Topo_Map/MapServer>ArcGIS</a>'
				})],
				url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
				'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
			})
		});
		return esri_layer;
	}
}

$("#selectedGraph").change(function(e) {
    var graph_selected = this.value;
    var layer_level = "8", zoom = 8,lat = $("#lat").text(), lon = $("#lon").text();
    var active_requests = $.active;

    //Don't start a new chart until the previous one is finished
    if (active_requests == 1) {
        alert("Please allow the procedure to finish in order to prevent bugs and graph erros");
        e.preventDefault();
        $("#selectedGraph").val($("#last_value").val());
    } else {
        if (graph_selected == "MODIS_Terra_NDSI_Snow_Cover") {
            chart.yAxis[0].update({
                title: {
                    text: "Snow Coverage (%)"
                    },
                max: 100
            });
            chart.setTitle({text: 'Snow Coverage' + ' at: ' + lat + 'N ' + lon + 'E'});
            $("#level").val("8");
            $("#zoom").val(8);
            $("#snow-cover-legend").show();
            $("#snow-water-equivalent-legend").hide();
        } else if (graph_selected == "SMAP_L4_Snow_Mass") {
            chart.yAxis[0].update({
                title: {
                    text: 'Snow Mass (km/m2)'
                    },
                max: 200.0
            });
            chart.setTitle({text: 'Snow Mass' + ' at: ' + lat + 'N ' + lon + 'E'});
            $("#level").val("6");
            $("#zoom").val(6);
            $("#snow-cover-legend").hide();
            $("#snow-water-equivalent-legend").hide();
        } else if (graph_selected == "AMSR2_Snow_Water_Equivalent") {
            chart.yAxis[0].update({
                title: {
                    text: "Snow Water Equivalent (mm)"
                    },
                max: 40.0
            });
            chart.setTitle({text: 'Snow Water Equivalent' + ' at: ' + lat + 'N ' + lon + 'E'});
            $("#level").val("6");
            $("#zoom").val(6);
            $("#snow-cover-legend").hide();
            $("#snow-water-equivalent-legend").show();
        }
        var lat = $("#lat").text();
        var lon = $("#lon").text();
        var begin_date = $("#startDate").text();
        var end_date = $("#endDate").text();''
        layer_level = $("#level").val();
        zoom = $("#zoom").val();
        chart.series[0].remove();
        update_chart(lat, lon, begin_date, end_date, zoom, graph_selected, layer_level);
        $("#last_value").val(graph_selected);
    }
});

//spit out parameters according to the layer previously selected
function assign_parameters (layer) {
    var level, zoom, y_max_value, y_axis_text, title_text;
    if (layer == "MODIS_Terra_NDSI_Snow_Cover") {
        level = "8";
        zoom = 8;
        y_max_value = 100.0;
        y_axis_text = "Snow Coverage (%)";
        title_text = "Snow Coverage";
    } else if (layer == "SMAP_L4_Snow_Mass") {
        level = "6";
        zoom = 6;
        y_max_value = 200.0;
        y_axis_text = '<p>Snow Mass (km/m^2)</p>';
        title_text = "Snow Mass";
    } else if (layer == "AMSR2_Snow_Water_Equivalent") {
        level = "6";
        zoom = 6;
        y_max_value = 40.0;
        y_axis_text = "Snow Water Equivalent (mm)";
        title_text = "Snow Water Equivalent"
    }
    return [layer, level, zoom, y_max_value, y_axis_text, title_text];
}

//create the legend
function initiate_legend (layer) {
    if (layer == "MODIS_Terra_NDSI_Snow_Cover") {
        $("#snow-cover-legend").show();
        $("#snow-water-equivalent-legend").hide();
    } else if (layer == "SMAP_L4_Snow_Mass") {
        $("#snow-cover-legend").hide();
        $("#snow-water-equivalent-legend").hide();
    } else if (layer == "AMSR2_Snow_Water_Equivalent") {
        $("#snow-cover-legend").hide();
        $("#snow-water-equivalent-legend").show();
    }
}

$(document).ready(function () {
    //determine what the original parameters are gonna be (layer, lever, zoom, y-axis)
    var original_layer = $("#originalLayer").val()
    var parameters = assign_parameters(original_layer);

    //input used to keep track of the layer currently being processed, used for visual commodity
    $("#last_value").val(original_layer);

    //assign those parameters to inputs on html for easy jQuery access
    $("#selectedGraph").val(original_layer);
    $("#level").val(parameters[1]);
    $("#zoom").val(parameters[2]);
    $("#title_text").val(parameters[5]);

    var original_level = $("#level").val();
    var original_zoom = $("#zoom").val();
    var original_y_axis_text = parameters[4];
    var title_text = $("#title_text").val();

	var base_layer = make_base_layer();
	var snow_point_layer = make_point_layer();
	var map = new ol.Map({
		layers: [base_layer, snow_point_layer],
		controls: ol.control.defaults(),
		target: 'detail-map',
		view: new ol.View({
			center: [0, 0],
			zoom: 14
		})
	});

	var snow_lat = parseFloat($("#lat").text());
	var snow_lon = parseFloat($("#lon").text());
	var snow_coords = [snow_lon, snow_lat];
	add_point_to_map(snow_point_layer, snow_coords);
	var coords_mercator = ol.proj.transform(snow_coords, 'EPSG:4326','EPSG:3857');
	map.getView().setCenter(coords_mercator);

	if (!($("#snow-chart").length)) {
        	console.log("no snow-chart element found!");
                return;
        } else {
		var lat = $("#lat").text();
		var lon = $("#lon").text();
		var begin_date = $("#startDate").text();
		var end_date = $("#endDate").text();
		var begin_ms = Date.parse(begin_date);
		var end_ms = Date.parse(end_date);
		console.log("lat: " + lat + " lon: " + lon + " begin_date: " + begin_date + " end_date: " + end_date);
	}

	var chart_options = {
		chart: {
			renderTo: 'snow-chart',
			zoomType: 'x'
		},
		loading: {
			labelStyle: {
				top: '45%',
				left: '50%',
				backgroundImage: 'url("/static/snow_inspector/images/ajax-loader.gif")',
				display: 'block',
				width: '134px',
				height: '100px',
				backgroundColor: '#000'
			}
		},
		title: {
			text: title_text + ' at: ' + lat + 'N ' + lon + 'E'
		},
		xAxis: {
			type: 'datetime',
			min: begin_ms,
			max: end_ms
		},
		yAxis: {
			title: {
				text: original_y_axis_text
			},
			min: 0.0,
			max: parameters[3]
		},
		legend: {
			enabled: false,
		},
        tooltip: {
            useHTML: true
        },
		plotOptions: {
			series: {
				cursor: 'pointer',
				allowPointSelect: true,
				point: {
					events: {
						click: function (e) {
							// mouse click event
							console.log('you clicked the chart!');
							var selected_date = Highcharts.dateFormat('%Y-%m-%d', this.x);
							add_snow_pixels_to_map(map, selected_date, $("#zoom").val(), $("#selectedGraph").val(), $("#level").val());
						},
						mouseOver: function() {
							// mouse hover event
							console.log('mouse over!');
							var selected_date = Highcharts.dateFormat('%Y-%m-%d', this.x);
							add_snow_pixels_to_map(map, selected_date, $("#zoom").val(), $("#selectedGraph").val(), $("#level").val());
						}
					}
				}
			},
			line: {
				color: Highcharts.getOptions().colors[0],
				marker: {
					radius: 3.5,
					states: {
                		select: {
                    		fillColor: 'red',
                    		lineWidth: 0,
							radius: 4
                		}
            		}
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},
		series: [{}]
	};

	chart_options.series[0].type = 'line';
	chart_options.series[0].name = 'Snow Coverage';
	chart = new Highcharts.Chart(chart_options);

	//setup some default values
	var resTitle = 'MODIS Snow coverage at ' + lon + ', ' + lat;

	var resAbstr = 'This resource contains an automatically created WaterML representing a time series of fractional snow cover ' +
            'from the MODIS TERRA MOD10_L3 data set at lat: ' + lat + ', lon: ' + lon + ' in the time period: ' + begin_date +
			' - ' + end_date + '. It was retrieved from the NASA GIBS web service and ' +
			'processed using the MODIS Snow Inspector application.';


    var resKwds = 'snow, MODIS';

	$("#resource-title").val(resTitle);
	$("#resource-abstract").val(resAbstr);
	$("#resource-keywords").val(resKwds);

    initiate_legend(original_layer);
	update_chart(lat, lon, begin_date, end_date, original_zoom, original_layer, original_level);
});