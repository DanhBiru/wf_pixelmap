// ---------------------------------------- //
// ---------- GLOBAL VARIABLES ------------ //
// ---------------------------------------- //

var date_today = '20211004';
var date = '20211004'; //TODO: đổi tên biến này thành today
let currentMarker = null;

// ---------------------------------------- //
// ---------- HELPER FUNCTIONS ------------ //
// ---------------------------------------- //

// get PM25 at a location with given latitude and longtitude
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

// get a string with 5 days before and after the given date in YYYYMMDD format
function get11DaysAround(dateStr) {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JS month = 0-11
    const day = parseInt(dateStr.slice(6, 8), 10);

    const baseDate = new Date(year, month, day);
    const rawDates = [];
    const formattedDates = [];

    for (let i = -4; i <= 4; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');

        formattedDates.push(`${dd}/${m}`)
        rawDates.push(`${y}${m}${dd}`);
    }

    return {rawDates, formattedDates };
}

// generate tabels with given dates and PM25 indexes
function renderPM25Table(dates, values) {
    let html = `
      <table border="1" cellspacing="0" cellpadding="5">
        <tr>
          <th>date</th>
          <th>PM25</th>
        </tr>
    `;

    for (let i = 0; i < dates.length; i++) {
        html += `
          <tr>
            <td>${dates[i]}</td>
            <td>${values[i]}</td>
          </tr>
        `;
    }

    html += `</table>`;
    return html;
}

// ---------------------------------------- //
// ------------ MAP AND LAYERS ------------ //
// ---------------------------------------- //

// map initialization
var map = L.map('map', {
    center: [16.0, 102.0],
    zoom: 6,
    zoomControl: false,
    minZoom: 6,   
    maxZoom: 12, 
    maxBounds: [
        [7.18, 96.14],   
        [24.39, 110.46]   
    ],
    maxBoundsViscosity: 1.0 
});

// base map tiles and tile control button
var OpenStreetMap_Mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

var Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

var Stadia_StamenTerrain = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 18,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

const baseMaps = [
   Stadia_AlidadeSatellite,
   Stadia_AlidadeSmooth, 
   Stadia_StamenTerrain,
   OpenStreetMap_Mapnik
];

let currentMapTileIndex = 0;
baseMaps[currentMapTileIndex].addTo(map);

function switchTile(direction) {
    map.removeLayer(baseMaps[currentMapTileIndex]);
    currentMapTileIndex = (currentMapTileIndex + direction + baseMaps.length) % baseMaps.length;
    baseMaps[currentMapTileIndex].addTo(map);
}

document.getElementById('tile-prev').addEventListener('click', function() {
   switchTile(-1); 
});

document.getElementById('tile-next').addEventListener('click', function() {
   switchTile(1); 
});

// PM25 tiff files visualized with terrcotta
var terracottaUrl = 'http://localhost:5000/singleband/{date}/{z}/{x}/{y}.png?colormap=pm25&stretch_range=[0,150]';
var pm25Layer = L.tileLayer(terracottaUrl.replace('{date}', date_today), { zIndex: 2 }).addTo(map);

// geojson layer with province boundary
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

loadGeoJSON('data2/VNnew34.json');

// ------------------------------------ //
// ---------- MAP INTERACTION ----------//
// ------------------------------------ //

// popup and marker showing when clicking on the map
map.on('click', async function(e) {
    const lat = parseFloat(e.latlng.lat.toFixed(5));
    const lon = parseFloat(e.latlng.lng.toFixed(5))
    const { rawDates, formattedDates } = get11DaysAround(date_today);
    const pm25Values = [];
    const pm25today = await getPM25(lat, lon, date);

    var table = "Không có dữ liệu";
    if (pm25today != null) {
        const sidebarPM25 = document.getElementById("sidebar-pm25index");
        sidebarPM25.innerHTML = `<p>Nồng độ bụi mịn PM25: ${pm25today.toFixed(2)} μg/m³</p>`;  

        let colorVar;
        if (pm25today < 12) {
            colorVar = "--pm25-1-bg";
        } else if (pm25today < 35) {
            colorVar = "--pm25-2-bg";
        } else if (pm25today < 55) {
            colorVar = "--pm25-3-bg";
        } else if (pm25today < 150) {
            colorVar = "--pm25-4-bg";
        } else if (pm25today < 250) {
            colorVar = "--pm25-5-bg";
        } else {
            colorVar = "--pm25-6-bg";
        }

        sidebarPM25.style.backgroundColor = `var(${colorVar})`;

        //
        for (let i = 0; i < rawDates.length; i++) {
            const pm25Value = await getPM25(lat, lon, rawDates[i]);
            pm25Values.push(pm25Value);
        }

        const chart = document.getElementById("sidebar-chart");
        chart.innerHTML = "";  

        const ymin = Math.min(...pm25Values) - 5;
        const ymax = Math.max(...pm25Values) + 5;

        const pm25Bands = [
            {min: 0,    max: 12,  color: "rgb(0,228,0)"},     
            {min: 12,   max: 35,  color: "rgb(255,255,0)"},   
            {min: 35,   max: 55,  color: "rgb(255,126,0)"},   
            {min: 55,   max: 150, color: "rgb(255,0,0)"},    
            {min: 150,  max: 250, color: "rgb(143,63,151)"},  
            {min: 250,  max: 500, color: "rgb(126,0,35)"}     
        ];

        const visibleBands = pm25Bands.filter(b => b.max >= ymin && b.min <= ymax);

        const shapes = visibleBands.map(b => ({
            type: "rect",
            xref: "paper",
            yref: "y",
            x0: 0,
            x1: 1,
            y0: Math.max(b.min, ymin),
            y1: Math.min(b.max, ymax),
            fillcolor: b.color,
            opacity: 0.7,   
            line: {width: 0},
            layer: "below"
        }));

        const trace = {
            x: formattedDates,
            y: pm25Values,
            type: 'scatter', // "bar" "scatter"
            mode: 'lines+markers',
            hoverinfo: 'skip',
            line: {color: "#0057FC"},
            opacity: 1,
        };

        const layout = {
            margin: { t: 20, r: 20, l: 30, b: 50},
            shapes: shapes,
            dragmode: false,
            hovermode: false,
            xaxis: { tickangle: -45, showgrid: false },
            yaxis: { title: "PM2.5", range: [ymin, ymax], showgrid: true, dtick: 2 }
        };
        
        const config = {
            displayModeBar: false,
        }
        Plotly.newPlot(chart, [trace], layout, config);
        table = renderPM25Table(formattedDates, pm25Values)
    }

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    currentMarker = L.marker([lat, lon]).addTo(map)
        .openPopup();
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
    date = newDate;
    var newUrl = terracottaUrl.replace('{date}', newDate);
    pm25Layer.setUrl(newUrl);
    map.invalidateSize(); 
});