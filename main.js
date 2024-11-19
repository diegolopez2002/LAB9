
var activeMapType = 'nodes_links';
var vertices = d3.map();
var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');

// Leaflet map setup
var atlLatLng = new L.LatLng(33.7771, -84.3900);
var myMap = L.map('map').setView(atlLatLng, 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 3,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(myMap);

// Add SVG layer to Leaflet map
var svgLayer = L.svg();
svgLayer.addTo(myMap);

// SVG and group for D3 elements
var svg = d3.select('#map').select('svg');
var nodeLinkG = svg.append('g').attr('class', 'leaflet-zoom-hide');

// Scales for node radius and color
var radiusScale = d3.scaleLinear().range([3, 10]); // Adjust range as needed
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Load CSV files and process data
Promise.all([
    d3.csv('gridkit_north_america-highvoltage-vertices.csv', function(row) {
        var node = {
            v_id: +row['v_id'],
            LatLng: [+row['lat'], +row['lng']],
            type: row['type'],
            voltage: +row['voltage'],
            frequency: +row['frequency'],
            wkt_srid_4326: row['wkt_srid_4326']
        };
        vertices.set(node.v_id, node);
        node.linkCount = 0;
        return node;
    }),
    d3.csv('gridkit_north_america-highvoltage-links.csv', function(row) {
        var link = {
            l_id: +row['l_id'],
            v_id_1: +row['v_id_1'],
            v_id_2: +row['v_id_2'],
            voltage: +row['voltage'],
            cables: +row['cables'],
            wires: +row['wires'],
            frequency: +row['frequency'],
            wkt_srid_4326: row['wkt_srid_4326']
        };
        link.node1 = vertices.get(link.v_id_1);
        link.node2 = vertices.get(link.v_id_2);
        link.node1.linkCount += 1;
        link.node2.linkCount += 1;
        return link;
    })
]).then(function(data) {
    var nodes = data[0];
    var links = data[1];

    // Set domain for radius scale
    radiusScale.domain([0, d3.max(nodes, d => d.linkCount)]);

    // Set domain for color scale
    var nodeTypes = Array.from(new Set(nodes.map(d => d.type)));
    colorScale.domain(nodeTypes);

    readyToDraw(nodes, links);
});

// Function to render nodes and links
function readyToDraw(nodes, links) {
    // Draw links
    nodeLinkG.selectAll('.grid-link')
        .data(links)
        .enter().append('line')
        .attr('class', 'grid-link')
        .style('stroke', '#999')
        .style('stroke-opacity', 0.5);

    // Draw nodes
    nodeLinkG.selectAll('.grid-node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'grid-node')
        .attr('r', d => radiusScale(d.linkCount))
        .style('fill', d => colorScale(d.type));

    // Update positions
    updateLayers();
    myMap.on('zoomend moveend', updateLayers); // Sync with map interactions
}

// Function to update layers
function updateLayers() {
    nodeLinkG.selectAll('.grid-node')
        .attr('cx', d => myMap.latLngToLayerPoint(d.LatLng).x)
        .attr('cy', d => myMap.latLngToLayerPoint(d.LatLng).y);

    nodeLinkG.selectAll('.grid-link')
        .attr('x1', d => myMap.latLngToLayerPoint(d.node1.LatLng).x)
        .attr('y1', d => myMap.latLngToLayerPoint(d.node1.LatLng).y)
        .attr('x2', d => myMap.latLngToLayerPoint(d.node2.LatLng).x)
        .attr('y2', d => myMap.latLngToLayerPoint(d.node2.LatLng).y);
}

// Button event listeners
d3.selectAll('.btn-group > .btn.btn-secondary')
    .on('click', function() {
        var newMapType = d3.select(this).attr('data-type');

        // Toggle active button
        d3.selectAll('.btn.btn-secondary.active').classed('active', false);
        d3.select(this).classed('active', true);

        // Update map layers
        cleanUpMap(activeMapType);
        showOnMap(newMapType);
        activeMapType = newMapType;
    });

// Function to hide layers
function cleanUpMap(type) {
    switch (type) {
        case 'cleared':
            break;
        case 'nodes_links':
            nodeLinkG.attr('visibility', 'hidden');
            break;
    }
}

// Function to show layers
function showOnMap(type) {
    switch (type) {
        case 'cleared':
            break;
        case 'nodes_links':
            nodeLinkG.attr('visibility', 'visible');
            break;
    }
}
 

