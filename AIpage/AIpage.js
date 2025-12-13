import { DEFAULT_DATE, DEFAULT_DATE_d } from "../map_layers/terracotta.js";
import { getPM25whole, getAvgPM25, getMaxPM25, getMinPM25 } from "../utils/helpers.js";
import { getLang, initLang } from "../lang/lang.js";
import "../ui/navbtn.js";

document.addEventListener('DOMContentLoaded', () => {
    initLang();
});

let stat_date = DEFAULT_DATE;
let formatted_stat_date = DEFAULT_DATE_d;

// Dữ liệu mẫu về các tỉnh thành
const cities = await getPM25whole(stat_date);

// Cập nhật số liệu thống kê
async function updateStats() {
    console.log('update', stat_date);
    document.getElementById('lowestValue').classList.add('loading');
    document.getElementById('lowestCity').classList.add('loading');
    document.getElementById('highestValue').classList.add('loading');
    document.getElementById('highestCity').classList.add('loading');
    document.getElementById('avgValue').classList.add('loading');

    const pm25Values = await getPM25whole(stat_date);
    const lowest = getMinPM25(pm25Values);
    const highest = getMaxPM25(pm25Values);
    const average = getAvgPM25(pm25Values).toFixed(1);
    plotPM25Ranking(pm25Values, "chart");

    document.getElementById('lowestCity').textContent = lowest.name;
    document.getElementById('lowestValue').textContent = lowest.pm25.toFixed(1);
    document.getElementById('highestCity').textContent = highest.name;
    document.getElementById('highestValue').textContent = highest.pm25.toFixed(1);
    document.getElementById('avgValue').textContent = average;

    document.getElementById('lowestValue').classList.remove('loading');
    document.getElementById('lowestCity').classList.remove('loading');
    document.getElementById('highestValue').classList.remove('loading');
    document.getElementById('highestCity').classList.remove('loading');
    document.getElementById('avgValue').classList.remove('loading');
    console.log("done update");
}

function plotPM25Ranking(list, domId) {
    const sorted = [...list].sort((a, b) => b.pm25 - a.pm25);
    const text = getLang() == "vi" ? "Xếp hạng PM2.5 theo tỉnh thành ngày" : "PM2.5 ranking by province/city"

    const data = [{
        x: sorted.map(item => item.name),
        y: sorted.map(item => item.pm25),
        type: "bar",
        hoverinfo: "x+y"
    }];

    const layout = {
        title: {"text": `${text} ${formatted_stat_date.toLocaleDateString("vi-VN")}`},
        xaxis: {
            tickangle: -45
        },
        yaxis: {
            title: {"text": "PM2.5"},
            automargin: true
        },
        autosize: true,
        margin: { l: 40, r: 20, t: 40, b: 80 },
        bargap: 0.5,
        bargroupgap: 0
    };

    const config = {
        displayModeBar: false,
        scrollZoom: false,
        staticPlot: false,
        responsive: true,
    };

    Plotly.newPlot(domId, data, layout, config);
}

// Xử lý thay đổi ngày
document.getElementById('dateSelect').addEventListener('change', function(e) {
    const selectedDate = e.target.value;
    const Datedate = new Date(selectedDate);
    const formattedDate = selectedDate.replace(/-/g, '');
    stat_date = formattedDate;
    formatted_stat_date = Datedate;
    updateStats();
});

function getPM25Status(pm25) {
    if (pm25 <= 12) return 'Tốt';
    if (pm25 <= 35.4) return 'Trung bình';
    if (pm25 <= 55.4) return 'Kém';
    if (pm25 <= 150.4) return 'Xấu';
    return 'Rất xấu';
}

// Hàm gửi tin nhắn
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    
    showTypingIndicator();
    
    // Gọi AI API
    await callAIAPI(message);
}

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

function addMessage(type, content) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? 'B' : 'AI';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').classList.add('active');
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.remove('active');
}

// test
async function callAIAPI(userMessage) {
    try {
        const context = `
Dữ liệu chất lượng không khí hiện tại (PM2.5):
${cities.map(c => `- ${c.name}: ${c.pm25} μg/m³ (${getPM25Status(c.pm25)})`).join('\n')}

Thông tin về PM2.5:
- 0-12: Tốt (màu xanh lá)
- 12.1-35.4: Trung bình (màu vàng)
- 35.5-55.4: Kém (màu cam)
- 55.5-150.4: Xấu (màu đỏ)
- 150.5+: Rất xấu (màu tím)
        `.trim();

        const response = await fetch("http://localhost:3000/groq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, context })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiResponse = data.choices[0].message.content;
            addMessage("bot", aiResponse);
        } else {
            throw new Error("Invalid response");
        }
    } catch (error) {
        hideTypingIndicator();
        const fallbackResponse = getFallbackResponse(userMessage);
        addMessage("bot", fallbackResponse);
    }
}

function getFallbackResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('pm2.5') || msg.includes('pm25')) {
        return 'PM2.5 là bụi mịn có đường kính dưới 2.5 micromet, rất nguy hiểm vì có thể xâm nhập sâu vào phổi và máu. Mức an toàn là dưới 12 μg/m³, trên 55.4 là có hại cho sức khỏe.';
    }
    
    if (msg.includes('ô nhiễm nhất') || msg.includes('xấu nhất')) {
        const worst = cities.reduce((a, b) => a.pm25 > b.pm25 ? a : b);
        return `Hiện tại ${worst.name} có chỉ số PM2.5 cao nhất là ${worst.pm25} μg/m³ (${getPM25Status(worst.pm25)}). Bạn nên hạn chế ra ngoài và đeo khẩu trang khi cần thiết.`;
    }

    if (msg.includes('sạch nhất') || msg.includes('tốt nhất')) {
        const best = cities.reduce((a, b) => a.pm25 < b.pm25 ? a : b);
        return `${best.name} có chất lượng không khí tốt nhất với PM2.5 chỉ ${best.pm25} μg/m³. Không khí rất trong lành, thích hợp cho mọi hoạt động ngoài trời!`;
    }
    
    if (msg.includes('bảo vệ') || msg.includes('phòng tránh')) {
        return 'Để bảo vệ sức khỏe khi PM2.5 cao:\n- Hạn chế ra ngoài khi PM2.5 > 55\n- Đeo khẩu trang N95/KF94\n- Đóng cửa sổ, dùng máy lọc không khí\n- Tránh tập thể dục ngoài trời\n- Uống nhiều nước, ăn nhiều rau xanh';
    }
    
    // Tìm thông tin về thành phố cụ thể
    const cityMention = cities.find(c => msg.includes(c.name.toLowerCase()));
    if (cityMention) {
        return `Chất lượng không khí tại ${cityMention.name} có PM2.5 là ${cityMention.pm25} μg/m³ - ${getPM25Status(cityMention.pm25)}. ${
            cityMention.pm25 > 55 ? 'Bạn nên hạn chế hoạt động ngoài trời và đeo khẩu trang.' : 'Chất lượng không khí ở mức chấp nhận được.'
        }`;
    }
    
    return 'Tôi có thể giúp bạn tìm hiểu về chỉ số PM2.5, tình hình không khí tại các tỉnh thành, và cách bảo vệ sức khỏe. Bạn muốn hỏi về vấn đề gì?';
}

// Khởi tạo
updateStats();
window.addEventListener('DOMContentLoaded', updateStats);

window.sendMessage = sendMessage;
window.askQuestion = askQuestion;