// ---------------------------------------- //
// ---------- GLOBAL VARIABLES ------------ //
// ---------------------------------------- //

var date_today = '20211006';
var date = '20211006'; //TODO: đổi tên biến này thành today
let currentMarker = null;
var isDEM = false;

const pm25Bands = [
    {min: 0,    max: 12,  color: "rgb(0,228,0)"},     
    {min: 12,   max: 35,  color: "rgb(255,255,0)"},   
    {min: 35,   max: 55,  color: "rgb(255,126,0)"},   
    {min: 55,   max: 150, color: "rgb(255,0,0)"},    
    {min: 150,  max: 250, color: "rgb(143,63,151)"},  
    {min: 250,  max: 500, color: "rgb(126,0,35)"}     
];

let pm25scale = [12,35,55,150,250,350]; // PM25 standard
let pm25colors = ["#00e400b3", "#ffff00b3", "#ff7e00b3", "#ff0000b3", "#8f3f97b3", "#7e0023b3"]; 
let pm25labels = ["Tốt", "Trung bình", "Không lành mạnh", "Xấu", "Rất xấu", "Nguy hại"];
let pm25notes = [
    "Chất lượng không khí được coi là đạt yêu cầu, ô nhiễm không khí hầu như không gây rủi ro",
    "Chất lượng không khí có thể chấp nhận được; tuy nhiên, với một số chất ô nhiễm có thể có mối lo ngại ở mức vừa phải đối với một số ít người nhạy cảm bất thường với ô nhiễm không khí",
    "Các nhóm nhạy cảm có thể gặp các tác động sức khỏe; công chúng nói chung ít có khả năng bị ảnh hưởng",
    "Mọi người có thể bắt đầu chịu tác động đến sức khỏe; các nhóm nhạy cảm có thể chịu tác động nghiêm trọng hơn",
    "Cảnh báo sức khỏe trong điều kiện khẩn cấp. Toàn bộ dân số có khả năng bị ảnh hưởng",
    "Cảnh báo sức khỏe: mọi người có thể chịu các tác động nghiêm trọng hơn"
] // source: aqicn.org
let pm25messages = [
    "Không có khuyến cáo",
    "Trẻ em năng động, người lớn, và những người mắc bệnh hô hấp như hen suyễn nên hạn chế hoạt động gắng sức kéo dài ngoài trời",
    "Trẻ em năng động, người lớn, và những người mắc bệnh hô hấp như hen suyễn nên hạn chế hoạt động gắng sức kéo dài ngoài trời",
    "Trẻ em năng động, người lớn, và những người mắc bệnh hô hấp như hen suyễn nên tránh hoạt động gắng sức kéo dài ngoài trời; mọi người khác, đặc biệt là trẻ em, nên hạn chế hoạt động gắng sức ngoài trời",
    "Trẻ em năng động, người lớn, và những người mắc bệnh hô hấp như hen suyễn nên tránh mọi hoạt động ngoài trời; mọi người khác, đặc biệt là trẻ em, nên hạn chế hoạt động ngoài trời",
    "Tất cả mọi người nên tránh mọi hoạt động ngoài trời"
] // source: aqicn.org

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
function getDaysAround(dateStr) {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JS month = 0-11
    const day = parseInt(dateStr.slice(6, 8), 10);

    const baseDate = new Date(year, month, day);
    const rawDates = [];
    const formattedDates = [];

    for (let i = -6; i <= 6; i++) {
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
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var Esri = L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: "Tiles © Esri — Esri, DeLorme, NAVTEQ",
})

var Carto_light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd'
})

var Carto_dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd'
})

const baseMaps = [
   OpenStreetMap_Mapnik,
   Carto_light,
   Carto_dark,
   Esri
];

let currentMapTileIndex = 0;
baseMaps[currentMapTileIndex].addTo(map);

// PM25 tiff files visualized with terrcotta
var terracottaUrl = 'http://localhost:5000/singleband/PM25/{date}/{z}/{x}/{y}.png?colormap=pm25&stretch_range=[0,150]';
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

//basemap tile control
const options = document.querySelectorAll('#tileOptions .icon');

const saved = localStorage.getItem('selectedTile');
if (saved) {
    options.forEach(btn => btn.classList.remove('selected'));
    const target = document.querySelector(`#tileOptions .icon[data-index="${saved}"]`);
    if (target) target.classList.add('selected');
}

options.forEach(btn => {
    btn.addEventListener('click', () => {
        const index = btn.dataset.index;
        options.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        localStorage.setItem('selectedTile', index);
        console.log(index);

        switchTile(index - 1);
    });
});

function switchTile(index) {
    map.removeLayer(baseMaps[currentMapTileIndex]);
    currentMapTileIndex = index;
    baseMaps[currentMapTileIndex].addTo(map);
}

// toggle DEM
document.getElementById('toggleDEM').addEventListener('click', function() {
    var newUrl = '';
    if (isDEM) {
        terracottaUrl = 'http://localhost:5000/singleband/PM25/{date}/{z}/{x}/{y}.png?colormap=pm25&stretch_range=[0,150]';
        newUrl = terracottaUrl.replace('{date}', date);
        isDEM = false;
    } else {
        newUrl = 'http://localhost:5000/singleband/DEM/00000000/{z}/{x}/{y}.png?colormap=gist_earth&stretch_range=[0,2578]';
        isDEM = true; 
    } 
    pm25Layer.setUrl(newUrl);
    map.invalidateSize(); 
});

var { rawDates, formattedDates } = getDaysAround(date_today);

async function updateSidebarPM25andAdvice(pm25today) {
    let bg_color, label, message;
    let text_color = "#000000";
    for (let i = 0; i < 6; i++) {
        if (pm25today <= pm25scale[i]) {
            bg_color = pm25colors[i];
            label = pm25labels[i];
            note = pm25notes[i];
            message = pm25messages[i];
            if (i >= 3) {
                text_color = "#ffffff";
            }
            break;
        }
    }

    const sidebarPM25 = document.getElementById("sidebar-pm25index");
    sidebarPM25.innerHTML = `
        <div>
            <div>
                <div class="info-title">Không khí</div>
                <div class="info-text">${label}</div>
            </div>  
            <div>
                <div class="info-title">PM25</div>
                <div class="info-pm25">${pm25today.toFixed(2)}</div>
            </div>
        </div>
        <div class="info-review">${note}</div>
    `;  

    sidebarPM25.style.backgroundColor = `${bg_color}`;
    sidebarPM25.style.color = `${text_color}`;

    const sidebarMessage = document.getElementById("sidebar-message");
    sidebarMessage.innerHTML = `
        <p><strong>Khuyến cáo</strong>: ${message}</p>    
    `;  
}

async function updateSidebarInfo(lat, lon) {
    const sidebarInfo = document.getElementById("sidebar-info");

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    const address1 = data.address.state || data.address.city;
    const address2 = data.address.county || data.address.borough || data.address.city_district || data.address.suburb || data.address.town || data.address.city || "undefined";

    sidebarInfo.innerHTML = `
        <p>Ngày 6/9/2025</p>
        <p>${address1}, ${address2}</p>
        <p>Vĩ độ: ${lat.toFixed(3)}, Kinh độ: ${lon.toFixed(3)}</p>
    `;  
}

// popup and marker showing when clicking on the map
map.on('click', async function(e) {
    const lat = parseFloat(e.latlng.lat.toFixed(5));
    const lon = parseFloat(e.latlng.lng.toFixed(5))
    const pm25Values = [];
    const pm25today = await getPM25(lat, lon, date_today);

    var table = "Không có dữ liệu";
    if (pm25today != null) {
        await Promise.all([
            updateSidebarPM25andAdvice(pm25today),
            updateSidebarInfo(lat, lon)
        ]);
        //
        for (let i = 0; i < rawDates.length; i++) {
            const pm25Value = await getPM25(lat, lon, rawDates[i]);
            pm25Values.push(pm25Value);
        }

        const chart = document.getElementById("sidebar-chart");
        chart.innerHTML = "";  

        const ymin = Math.min(...pm25Values) - 5;
        const ymax = Math.max(...pm25Values) + 5;

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
            marker: {
                symbol: 'square',
                size: 10
            },
            // hoverinfo: 'skip',
            line: {color: "#0057FC"},
            hovertemplate: 
                'Ngày: %{x}<br>' +
                '<b>PM25:<b> %{y:.2f}<br>' + 
                '<extra></extra>',
            hoverlabel: {
                bgcolor: "rgba(255,255,255,0.8",
                bordercolor: "#003fb4",
                padding: "5px"
            },
            opacity: 1,
        };

      const layout = {
            // title: {
            //     text: "Biểu đồ PM2.5 theo ngày",
            //     font: { size: 20 },
            //     x: 0.5, //[0, 1]
            //     xanchor: 'center'
            // },
            margin: { t: 20, r: 20, l: 45, b: 70},
            shapes: shapes,
            dragmode: false,
            xaxis: { title: {text: "Thời gian", font: { family: "Roboto", size: 15 }}, tickangle: -45, showgrid: false, dtick: 2 },
            yaxis: { title: {text: "PM2.5", font: { family: "Poppins", size: 15 }}, range: [ymin, ymax], showgrid: true, dtick: 5, gridcolor: "rgba(0,0,0,0.8)" }
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
    if (!isDEM) {
        var newDate = e.detail;
        date = newDate;
        var newUrl = terracottaUrl.replace('{date}', newDate);
        pm25Layer.setUrl(newUrl);
        map.invalidateSize(); 
    }
});