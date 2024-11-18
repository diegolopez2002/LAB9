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
        })
    ]).then(function(data) {
        var nodes = data[0];
        readyToDraw(nodes)
    });
    
function readyToDraw(nodes) {
        nodeLinkG.selectAll('.grid-node')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'grid-node')
            .style('fill', 'red')
            .style('fill-opacity', 0.6)
            .attr('r', 2);

            myMap.on('zoomend', updateLayers);
            updateLayers();

}

function updateLayers(){
    nodeLinkG.selectAll('.grid-node')
    .attr('cx', function(d){return myMap.latLngToLayerPoint(d.LatLng).x})
    .attr('cy', function(d){return myMap.latLngToLayerPoint(d.LatLng).y})
};
    
