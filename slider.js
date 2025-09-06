window.onload = function() {
    const slider = document.getElementById("timeSlider");
    slider.value = 14; // về node thứ 4 mặc định
};

// Tạo dữ liệu ngày
const dates = [];
var startDate = new Date('2021-09-20');

for (let i = 0; i < 22; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push({
        display: String(date.getDate()).padStart(2, '0') + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                date.getFullYear(),
        isToday: date.toDateString() === new Date('2021-10-4').toDateString()
    });
}

// Lấy elements
const playBtn = document.getElementById('playBtn');
const currentTime = document.getElementById('currentTime');
const timeSlider = document.getElementById('timeSlider');
const progressFill = document.getElementById('progressFill');
const dateLabels = document.getElementById('dateLabels');

let isPlaying = false;
let playInterval;
let currentIndex = 14; 

// Tạo labels cho các ngày
function createDateLabels() {
    dateLabels.innerHTML = '';
    dates.forEach((date, index) => {
        const label = document.createElement('div');
        label.className = 'date-label';
        if (date.isToday) label.classList.add('today');
        if (index === currentIndex) label.classList.add('active');
        
        // Chỉ hiển thị một số ngày để tránh quá tải
        if (index % 2 === 0 || index === currentIndex || date.isToday) {
            label.textContent = date.display.substring(0, 5); // Chỉ hiển thị DD-MM
        } else {
            label.innerHTML = '&nbsp;';
        }
        
        dateLabels.appendChild(label);
    });
}

// Xử lý chuỗi
function formatDate(input) {
    // Đổi format từ dd-mm-yyyy thành yyyymmdd
    const [day, month, year] = input.split("-");
    const output = `${year}${month}${day}`;

    return output
}

// Cập nhật thời gian hiện tại
function updateCurrentTime() {
    const selectedDate = dates[currentIndex];
    
    // Cập nhật progress bar
    const progress = (currentIndex / (dates.length - 1)) * 100;
    progressFill.style.width = progress + '%';
    
    // Cập nhật active label
    createDateLabels();

    // Cập nhật date và update map ở main.js
    const formatted_newdate = formatDate(selectedDate['display']);
    window.dispatchEvent(new CustomEvent("updateMapWithNewDate", {detail: formatted_newdate}));
    // console.log(formatDate(selectedDate['display']))
}

// Play/Pause functionality
function togglePlay() {
    if (isPlaying) {
        // Pause
        clearInterval(playInterval);
        playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        playBtn.style.background = '#4a90e2';
        isPlaying = false;
    } else {
        // Play
        playBtn.innerHTML = '<span class="material-icons">pause</span>';
        playBtn.style.background = '#ff4444';
        isPlaying = true;
        
        playInterval = setInterval(() => {
            if (currentIndex < dates.length - 1) {
                currentIndex++;
                timeSlider.value = currentIndex;
                updateCurrentTime();
            } else {
                // Kết thúc, quay lại pause
                togglePlay();
            }
        }, 1000); // Thay đổi mỗi 500ms
    }
}

// Event listeners
playBtn.addEventListener('click', togglePlay);

timeSlider.addEventListener('input', function() {
    currentIndex = parseInt(this.value);
    updateCurrentTime();
});

// Khởi tạo
createDateLabels();
updateCurrentTime();

// Thêm hiệu ứng hover cho slider
timeSlider.addEventListener('mouseover', function() {
    this.style.cursor = 'pointer';
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        timeSlider.value = currentIndex;
        updateCurrentTime();
    } else if (e.code === 'ArrowRight' && currentIndex < dates.length - 1) {
        currentIndex++;
        timeSlider.value = currentIndex;
        updateCurrentTime();
    }
});