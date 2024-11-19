var nodeFeatures = [];
var vertices = d3.map();
var activeMapType = 'nodes_links';
var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');

var atlLatLng = new L.LatLng(33.7771, -84.3900);
var myMap = L.map('map').setView(atlLatLng, 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	     {
	       maxZoom: 10,
	       minZoom: 3,
	       attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
             }).addTo(myMap);

             
var svgLayer = L.svg();
svgLayer.addTo(myMap)
             
var svg = d3.select('#map').select('svg');
var nodeLinkG = svg.select('g')
.attr('class', 'leaflet-zoom-hide');
             



Promise.all([
    d3.csv('gridkit_north_america-highvoltage-vertices.csv', function(row) {
        return {v_id: +row['v_id'], LatLng: [+row['lat'], +row['lng']], type: row['type'],
                    voltage: +row['voltage'], frequency: +row['frequency'], wkt_srid_4326: row['wkt_srid_4326']};
    }),
    d3.csv('gridkit_north_america-highvoltage-links.csv', function(row) {
        return {l_id: +row['l_id'], v_id_1: +row['v_id_1'], v_id_2: +row['v_id_2'],
                  voltage: +row['voltage'], cables: +row['cables'], wires: +row['wires'],
                  frequency: +row['frequency'], wkt_srid_4326: row['wkt_srid_4326']};

    }),
    d3.json('states.json')     
]).then(function(data) {
    var nodes = data[0];
    var links = data[1];
    readyToDraw(nodes, links, states)
});


function readyToDraw(nodes, links, states) {
    nodeLinkG.selectAll('.grid-link')
    .data(links)
    .enter().append('line')
    .attr('class', 'grid-link')
    .style('stroke', '#999')
    .style('stroke-opacity', 0.5);
    nodeLinkG.selectAll('.grid-node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'grid-node')
        .style('fill', function(d){
                      return colorScale(d['type']);
        })
        .style('fill-opacity', 0.6)
        .attr('r', function(d) {
                   return radiusScale(d.linkCount);
        });   
        myMap.on('zoomend', updateLayers);
        updateLayers();
        
        var nodeCollection = turf.featureCollection(nodeFeatures);
        var chorostates = turf.collect(states, nodeCollection, 'v_id', 'values')
        var bbox = turf.bbox(nodeCollection);
        var cellSize = 250;
        var options = {units: 'kilometers'};
        var triangleGrid = turf.triangleGrid(bbox, cellSize, options);
        var triangleBins = turf.collect(triangleGrid, nodeCollection, 'v_id', 'values');
        triangleBins.features = triangleBins.features.filter(function(d){
        return d.properties.values.length > 0;
    });

        var triangleLayer = L.geoJson(triangleBins, {style: triangleStyle});
        triangleLayer.addTo(myMap);

        var triangleExtent = d3.extent(triangleBins.features, function(d){
            return d.properties.values.length;
        });
        var triangleScale = d3.scaleSequential(d3.interpolateMagma)
            .domain(triangleExtent.reverse());
        
        var triangleStyle = function(f) {
                return {
                    weight: 0.5,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7,
                    fillColor: triangleScale(f.properties.values.length)
                }
            };
        

        var statesStyle = function(f) {
            return {
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7,
                fillColor: choroScale(f.properties.values.length)
            }
        };

        
        statesLayer = L.geoJson(chorostates, {style: statesStyle});
        var choroScale = d3.scaleThreshold()
	.domain([10,20,50,100,200,500,1000])
	.range(d3.schemeYlOrRd[8]);

}

function updateLayers(){
    nodeLinkG.selectAll('.grid-node')
    .attr('cx', function(d){return myMap.latLngToLayerPoint(d.LatLng).x})
    .attr('cy', function(d){return myMap.latLngToLayerPoint(d.LatLng).y});
    nodeLinkG.selectAll('.grid-link')
       .attr('x1', function(d){return myMap.latLngToLayerPoint(d.node1.LatLng).x})
       .attr('y1', function(d){return myMap.latLngToLayerPoint(d.node1.LatLng).y})
       .attr('x2', function(d){return myMap.latLngToLayerPoint(d.node2.LatLng).x})
       .attr('y2', function(d){return myMap.latLngToLayerPoint(d.node2.LatLng).y});
};

d3.selectAll('.btn-group > .btn.btn-secondary')
    .on('click', function() {
        var newMapType = d3.select(this).attr('data-type');

        d3.selectAll('.btn.btn-secondary.active').classed('active', false);

        cleanUpMap(activeMapType);
        showOnMap(newMapType);

        activeMapType = newMapType;
    });
    function cleanUpMap(type) {
        switch(type) {
            case 'cleared':
                break;
            case 'nodes_links':
                nodeLinkG.attr('visibility', 'hidden');
                break;
            case 'states':
                myMap.removeLayer(statesLayer);
                break;
            case 'triangle_bins':
               myMap.removeLayer(triangleLayer);
               break;

        }
    }
    
    function showOnMap(type) {
        switch(type) {
            case 'cleared':
                break;
            case 'nodes_links':
                nodeLinkG.attr('visibility', 'visible');
                break;
            case 'states':
                statesLayer.addTo(myMap);
                break;
            case 'triangle_bins':
                    triangleLayer.addTo(myMap);
                    break;
                    
                    
        }
    }
    
    
    
    
