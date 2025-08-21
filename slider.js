const dates = [];
const startDate = new Date('2025-08-06');

for (let i = 0; i < 22; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push({
        short: String(date.getDate()).padStart(2, '0') + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                date.getFullYear(),
        display: String(date.getDate()).padStart(2, '0') + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                date.getFullYear(),
        isToday: date.toDateString() === new Date('2025-08-20').toDateString()
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
let currentIndex = 14; // Bắt đầu từ 20/8/2025

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

// Cập nhật thời gian hiện tại
function updateCurrentTime() {
    const selectedDate = dates[currentIndex];
    currentTime.textContent = `23:00:00 ${selectedDate.display}`;
    
    // Cập nhật progress bar
    const progress = (currentIndex / (dates.length - 1)) * 100;
    progressFill.style.width = progress + '%';
    
    // Cập nhật active label
    createDateLabels();
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
        }, 500); // Thay đổi mỗi 500ms
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