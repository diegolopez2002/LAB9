var vertices = d3.map();
var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');
var atlLatLng = new L.LatLng(33.7771, -84.3900);
var myMap = L.map('map').setView(atlLatLng, 5);
var activeMapType = 'nodes_links';

var svgLayer = L.svg();
svgLayer.addTo(myMap)

var svg = d3.select('#map').select('svg');
var nodeLinkG = svg.select('g')
    .attr('class', 'leaflet-zoom-hide');

Promise.all([
        d3.csv('gridkit_north_america-highvoltage-vertices.csv', function(row) {
            var node = {v_id: +row['v_id'], LatLng: [+row['lat'], +row['lng']], type: row['type'],
           voltage: +row['voltage'], frequency: +row['frequency'], wkt_srid_4326: row['wkt_srid_4326']};
       vertices.set(node.v_id, node);
       return node;
        }),
        d3.csv('gridkit_north_america-highvoltage-links.csv', function(row) {
            var link = {l_id: +row['l_id'], v_id_1: +row['v_id_1'], v_id_2: +row['v_id_2'],
            voltage: +row['voltage'], cables: +row['cables'], wires: +row['wires'],
            frequency: +row['frequency'], wkt_srid_4326: row['wkt_srid_4326']};
            link.node1 = vertices.get(link.v_id_1);
            link.node2 = vertices.get(link.v_id_2);
       return link;
    })     
    ]).then(function(data) {
        var nodes = data[0];
        var links = data[1];
        readyToDraw(nodes, links)
    });

function readyToDraw(nodes, links) {
    var nodeTypes = d3.map(nodes, function(d){return d.type;}).keys();
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(nodeTypes);
        nodeLinkG.selectAll('.grid-node')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'grid-node')
            .style('fill', function(d){
                return colorScale(d['type']);
            })  
            .style('fill-opacity', 0.6)
            .attr('r', 2);
        
        nodeLinkG.selectAll('.grid-link')
            .data(links)
            .enter().append('line')
            .attr('class', 'grid-link')
            .style('stroke', '#999')
            .style('stroke-opacity', 0.5);
        
        myMap.on('zoomend', updateLayers);
        updateLayers();

}

function updateLayers(){
    nodeLinkG.selectAll('.grid-node')
    .attr('cx', function(d){return myMap.latLngToLayerPoint(d.LatLng).x})
    .attr('cy', function(d){return myMap.latLngToLayerPoint(d.LatLng).y})

    nodeLinkG.selectAll('.grid-link')
       .attr('x1', function(d){return myMap.latLngToLayerPoint(d.node1.LatLng).x})
       .attr('y1', function(d){return myMap.latLngToLayerPoint(d.node1.LatLng).y})
       .attr('x2', function(d){return myMap.latLngToLayerPoint(d.node2.LatLng).x})
       .attr('y2', function(d){return myMap.latLngToLayerPoint(d.node2.LatLng).y});

};
    

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	     {
	       maxZoom: 10,
	       minZoom: 3,
	       attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
             }).addTo(myMap);


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
                }
            }
            
            function showOnMap(type) {
                switch(type) {
                    case 'cleared':
                        break;
                    case 'nodes_links':
                        nodeLinkG.attr('visibility', 'visible');
                        break;
                }
            }
            


             

  




             


