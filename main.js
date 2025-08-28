// helper functions
async function getPM25(lat, lon, date) {
    // load GeoTIFF
    var filePath = "data/PM25_" + date + "_3km.tif"
    const tiff = await GeoTIFF.fromUrl(filePath)
    const image = await tiff.getImage();

    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    if(lon < minX || lon > maxX || lat < minY || lat > maxY) {
        return null;
    }

    const xRes = (maxX - minX) / width;
    const yRes = (maxY - minY) / height;

    const col = Math.floor((lon - minX) / xRes);
    const row = Math.floor((maxY - lat) / yRes);

    const raster = await image.readRasters({ window: [col, row, col + 1, row + 1] });
    const pm25Value = raster[0][0];

    return pm25Value > 0 ? pm25Value : null;
}

var date = '20211231';

var map = L.map('map', {
    center: [16.0, 108.0],
    zoom: 6,
    zoomControl: false,
    minZoom: 6,   // zoom nhỏ nhất
    maxZoom: 12,  // zoom lớn nhất
    maxBounds: [
        [7.18, 101.14],   // góc tây nam VN (gần Cà Mau)
        [24.39, 110.46]   // góc đông bắc VN (gần Hà Giang)
    ],
    maxBoundsViscosity: 1.0 
});

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
	attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
}).addTo(map);

// L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
// 	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
// }).addTo(map);

var terracottaUrl = 'http://localhost:5000/singleband/{date}/{z}/{x}/{y}.png?colormap=tab20c&stretch_range=[0,300]';
var pm25Layer = L.tileLayer(terracottaUrl.replace('{date}', date)).addTo(map);

var geojsonFeature = null;

function loadGeoJSON(filePath) {
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

                // if (feature.properties && feature.properties.NAME_1) {
                //     layer.bindTooltip(feature.properties.NAME_1, {
                //         permanent: true,   
                //         direction: "center",
                //         className: "province-label" 
                //     }).openTooltip();
                // }

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

// split
loadGeoJSON('data2/VNnew34.json');

map.on('click', async function(e) {
    var lat = e.latlng.lat.toFixed(5);
    var lon = e.latlng.lng.toFixed(5);
    var pm25Value = await getPM25(lat, lon, date);

    document.getElementById('sidebar-content').innerHTML = `
        Date: ${date    }
        <br>Lat: ${lat}, Lon: ${lon}
        <br>PM2.5: ${pm25Value !== null ? pm25Value.toFixed(2) + ' µg/m³' : 'Không có dữ liệu'}`;
});

// Điều khiển phóng to/thu nhỏ/cố định
document.getElementById('zoomIn').addEventListener('click', function() {
    map.zoomIn();
});
document.getElementById('zoomOut').addEventListener('click', function() {
    map.zoomOut();
});
document.getElementById('resetZoom').addEventListener('click', function() {
    map.setView([16.0, 108.0], 6);
});

const infoBtn = document.getElementById('mapInfoBtn');
const popupOverlay = document.getElementById('popupOverlay');
const closeBtn = document.getElementById('closeBtn');

// Hàm mở popup
function openPopup() {
    popupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Ngăn scroll khi popup mở
}

// Hàm đóng popup
function closePopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; // Cho phép scroll lại
}

// Event listeners
infoBtn.addEventListener('click', openPopup);
closeBtn.addEventListener('click', closePopup);

// Đóng popup khi click vào overlay
popupOverlay.addEventListener('click', function(e) {
    if (e.target === popupOverlay) {
        closePopup();
    }
});

// Đóng popup khi nhấn ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
        closePopup();
    }
});

// Ngăn popup đóng khi click vào nội dung popup
document.querySelector('.popup').addEventListener('click', function(e) {
    e.stopPropagation();
});

// Xử lý chọn ngày
window.addEventListener('updateMapWithNewDate', (e) => {
    var newDate = e.detail;
    var newUrl = terracottaUrl.replace('{date}', newDate);
    pm25Layer.setUrl(newUrl);
    map.invalidateSize(); 
    console.log("Map updated for date: " + newDate);
    console.log(newUrl);
});