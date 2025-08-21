// helper functions
async function getPM25(lat, lon, date) {
    // load GeoTIFF
    var filePath = "data/PM25_" + date + "_3km.tif"
    const tiff = await GeoTIFF.fromUrl(filePath)
    const image = await tiff.getImage();

    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    const xRes = (maxX - minX) / width;
    const yRes = (maxY - minY) / height;

    const col = Math.floor((lon - minX) / xRes);
    const row = Math.floor((maxY - lat) / yRes);

    const raster = await image.readRasters({ window: [col, row, col + 1, row + 1] });
    const pm25Value = raster[0][0];

    return pm25Value !== undefined ? pm25Value : null;
}

var date = '20211231';

let popup = L.popup();

var map = L.map('map', {
    center: [16.0, 108.0],
    zoom: 6,
    zoomControl: false
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var terracottaUrl = 'http://localhost:5000/singleband/{date}/{z}/{x}/{y}.png?colormap=pubu&stretch_range=[0,50.8]';
var pm25Layer = L.tileLayer(terracottaUrl.replace('{date}', date)).addTo(map);

var geojsonFeature = null;

function loadGeoJSON(filePath) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            geojsonFeature = data;
            
            // Di chuyển 2 dòng này vào đây
            var geojsonLayer = L.geoJSON().addTo(map);
            geojsonLayer.addData(geojsonFeature);
        })
        .catch(error => console.error('Lỗi:', error));
}

loadGeoJSON('data2/VNnew34.json');

map.on('click', async function(e) {
    var lat = e.latlng.lat.toFixed(5);
    var lon = e.latlng.lng.toFixed(5);
    var pm25Value = await getPM25(lat, lon, date);

    document.getElementById('sidebar-content').innerHTML = `
        Lat: ${lat}, Lon: ${lon}
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
document.getElementById('datePicker').addEventListener('change', function() {
    var selectedDate = this.value.replace(/-/g, ''); // Chuyển yyyy-mm-dd thành yyyymmdd
    var newUrl = terracottaUrl.replace('{date}', selectedDate);
    date = selectedDate; // Cập nhật biến date
    pm25Layer.setUrl(newUrl);
    map.invalidateSize(); // Cập nhật lại bản đồ
});

// Xử lý click cho các nút nav
document.querySelectorAll('.nav-btn, .dropdown-item').forEach(button => {
    button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        switch (action) {
            case 'home':
                console.log('Tác vụ Trang chủ được gọi');
                break;
            case 'aqi':
                console.log('Tác vụ Biểu đồ AQI được gọi');
                break;
            case 'pm25':
                console.log('Tác vụ Biểu đồ PM2.5 được gọi');
                break;
            case 'compare':
                console.log('Tác vụ So sánh được gọi');
                break;
            case 'other':
                console.log('Tác vụ Khác được gọi');
                break;
        }
    });
});