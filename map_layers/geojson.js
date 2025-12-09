export function addGeoJSONLayer(map) {
    var geojsonFeature = null;
    const filePath = "data2/VNnew34.json"

    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            geojsonFeature = data;

            function style(feature) {
                return {
                    color: "#333333",      
                    weight: 0.5,           
                    fillColor: "#4a90e2",  
                    fillOpacity: 0       
                };
            }

            function highlightFeature(e) {
                var layer = e.target;
                layer.setStyle({
                    weight: 2,             
                    color: "#003e71ff",     
                    fillColor: "#4a90e2",  
                    fillOpacity: 0.2
                });
                layer.bringToFront();
            }

            function resetHighlight(e) {
                geojsonLayer.resetStyle(e.target);
            }

            function onEachFeature(feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight
                });

                if (feature.properties && feature.properties.NAME_1) {
                    var center = layer.getBounds().getCenter();

                    var label = L.tooltip({
                        permanent: true,
                        direction: "center",
                        className: "province-label"
                    })
                    .setContent(feature.properties.NAME_1)
                    .setLatLng(center);

                    label.addTo(map);
                }
            }

            var geojsonLayer = L.geoJSON(geojsonFeature, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
            var geojsonLayer = L.geoJSON(
                {
                    ...geojsonFeature,
                    features: [geojsonFeature.features[18]]
                },
                {
                    style: style,
                    onEachFeature: onEachFeature
                }
            ).addTo(map);

        })
        .catch(error => console.error('Lỗi:', error));
}