//  
// LIÊN QUAN ĐẾN MAP
//

// Load map bằng Leaflet
var map = L.map('map', {
    center: [16.0, 108.0],
    zoom: 6,
    zoomControl: false
});

let popup = L.popup();

map.on('click', async function(e) {
    var lat = e.latlng.lat.toFixed(5);
    var lon = e.latlng.lng.toFixed(5);
    var token = 'b212b2c6afbe5ea831c814b5524f980d0f003758'; 
    var url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`;

    document.getElementById('sidebar-content').innerHTML = `Lat: ${lat}, Lon: ${lon}`;


    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data); // Đây là JSON trả về từ API

        popup
            .setLatLng(e.latlng)
            .setContent(`
                ${data.data.city.name}<br>
                ${data.data.time.s}</br>
                AQI: ${data.data.aqi || 'Không có dữ liệu'}    
                `)
            .openOn(map);
    } catch (err) {
        console.error('Lỗi fetch AQICN:', err);
    }
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var terracottaUrl = 'http://localhost:5000/singleband/{date}/{z}/{x}/{y}.png?colormap=pubu&stretch_range=[0,50.8]';
var pm25Layer = L.tileLayer(terracottaUrl.replace('{date}', '20210101')).addTo(map);

var geojsonFeature = null;

function loadGeoJSON(filePath) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            geojsonFeature = data;
            console.log('GeoJSON data loaded:');
            
            // Di chuyển 2 dòng này vào đây
            var geojsonLayer = L.geoJSON().addTo(map);
            geojsonLayer.addData(geojsonFeature);
        })
        .catch(error => console.error('Lỗi:', error));
}

loadGeoJSON('data2/VNnew34.json');

// var AQI_URL = 'https://tiles.aqicn.org/tiles/usepa-pm25/{z}/{x}/{y}.png?token=b212b2c6afbe5ea831c814b5524f980d0f003758';
// var AQI_ATTR = 'Air Quality Tiles &copy; <a href="https://aqicn.org">aqicn.org</a>';
// var aqiLayer = L.tileLayer(AQI_URL, {attribution: AQI_ATTR}).addTo(map);

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

// Toggle sidebar
document.getElementById('toggleSidebar').addEventListener('click', function() {
    var sidebar = document.getElementById('sidebar');
    var btn = document.getElementById('toggleSidebar');
    if (sidebar.classList.toggle('collapsed')) {
        btn.textContent = '(i)';
    } else {
        btn.textContent = 'Thông tin';
    }
});

// Xử lý chọn ngày
document.getElementById('datePicker').addEventListener('change', function() {
    var selectedDate = this.value.replace(/-/g, ''); // Chuyển yyyy-mm-dd thành yyyymmdd
    var newUrl = terracottaUrl.replace('{date}', selectedDate);
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