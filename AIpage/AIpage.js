import { DEFAULT_DATE, DEFAULT_DATE_d, DEFAULT_DATE_f } from "../map_layers/terracotta.js";
import { dateRangeYMD, dateToYMDArray, getPM25Values, getPM25whole, getStats, observePlotResize } from "../utils/helpers.js";
import { getLang, initLang } from "../lang/lang.js";
import "../ui/navbtn.js";
import { pm25colors, pm25Bands, province_latlon } from "../utils/scale.js";

observePlotResize("lineChart");
observePlotResize("barChart1");
observePlotResize("barChart2");

document.addEventListener('DOMContentLoaded', () => {
    initLang();
});

let stat_date = DEFAULT_DATE;
let formatted_stat_date = DEFAULT_DATE_d;

let date_start = new Date("2021-10-10");
let date_end = formatted_stat_date;
let selected_province = "Hà Nội";
let pm25Values = await getPM25whole(stat_date);

const cities = await getPM25whole(stat_date);
const els = {
  lowestCity: document.getElementById('lowestCity'),
  lowestValue: document.getElementById('lowestValue'),
  highestCity: document.getElementById('highestCity'),
  highestValue: document.getElementById('highestValue'),
  badQualityCount: document.getElementById('badQualityCount'),
  avgValue: document.getElementById('avgValue')
};

function setLoading(state) {
  Object.values(els).forEach(el =>
    el.classList.toggle('loading', state)
  );
}

async function updateStats() {
    console.log('update', stat_date);
    setLoading(true);

    pm25Values = await getPM25whole(stat_date);
    const stats = getStats(pm25Values);

    const lowest = stats[0];
    const highest = stats[1];
    const average = stats[2].toFixed(1);
    const badQualityCount = stats[3];

    els.lowestCity.textContent = lowest.name;
    els.lowestValue.textContent = lowest.pm25.toFixed(1);
    els.highestCity.textContent = highest.name;
    els.highestValue.textContent = highest.pm25.toFixed(1);
    els.badQualityCount.textContent = badQualityCount;
    els.avgValue.textContent = average;

    setLoading(false);
    console.log("done update");

    plotPM25Ranking(pm25Values, "barChart1");
    plotPM25ByTime(date_start, date_end, selected_province, "lineChart");
    console.log("done chart");
    
}

function plotPM25Ranking(list, domId) {
    const sorted = [...list].sort((a, b) => b.pm25 - a.pm25).slice(0, 15);;

    const data = [{
        x: sorted.map(item => item.name),
        y: sorted.map(item => item.pm25),
        type: "bar",
        hoverinfo: "x+y",
        marker: {
            color: sorted.map(item => item.pm25),
            colorscale: [
                [0.0, "#2ecc71"],  // tốt
                [0.12, "#f1c40f"],  // trung bình
                [0.35, "#e67e22"],  // kém
                [0.55, "#e74c3c"]   // xấu
            ],
            cmin: 0,
            cmax: 100
        },
        hovertemplate: 
            '<b>PM25:<b> %{y:.2f}<br>' + 
            '<extra></extra>',
        hoverlabel: {
            bgcolor: "rgba(255,255,255,0.8",
            bordercolor: "#003fb4",
            padding: "10px"
        },
    }];

    const layout = {
        xaxis: {
            tickangle: -45
        },
        yaxis: {
            title: {"text": "PM2.5"},
            automargin: true
        },
        autosize: true,
        margin: { l: 40, r: 20, t: 40, b: 80 },
        bargap: 0.6,
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

async function plotPM25ByTime(dateStart, dateEnd, province, domId) {
    const { rawDates, formattedDates } = dateRangeYMD(dateStart, dateEnd);
    const { lat, lon } = province_latlon[province];
    const pm25Values = await getPM25Values(lat, lon, rawDates)

    const ymin = Math.min(...pm25Values) - 5;
    const ymax = Math.max(...pm25Values) + 5;
    const todayIndex = formattedDates.indexOf(DEFAULT_DATE_f);

    const date_text = getLang() === "vi" ? "Ngày" : "Date"; 
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

    let traces = [];
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
            `${date_text}: %{x}<br>` +
            '<b>PM25:<b> %{y:.2f}<br>' + 
            '<extra></extra>',
        hoverlabel: {
            bgcolor: "rgba(255,255,255,0.8",
            bordercolor: "#003fb4",
            padding: "10px"
        },
        opacity: 1,
        showlegend: false
    };
    traces.push(trace);

    if (todayIndex !== -1) {
        const traceToday = {
            x: [formattedDates[todayIndex]],
            y: [pm25Values[todayIndex]],
            type: "scatter",
            mode: "markers",
            marker: {
                symbol: 'square',
                color: "red",
                size: 12
            },
            hoverinfo: "skip",
            showlegend: false
        };
        traces.push(traceToday);
    }

    const layout = {
        margin: { t: 20, r: 20, l: 45, b: 70},
        shapes: shapes,
        dragmode: false,
        xaxis: { type: "category", tickangle: -45, showgrid: false, showspikes: false },
        yaxis: { title: {text: "PM2.5", font: { family: "Poppins", size: 15 }}, range: [ymin, ymax], showgrid: false, dtick: 5},
    };
    
    const config = {
        displayModeBar: false,
    }

    Plotly.newPlot(domId, traces, layout, config);
}

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
        const sortedByPM25 = [...cities].sort((a, b) => b.pm25 - a.pm25);
        const avgPM25 = (cities.reduce((sum, c) => sum + c.pm25, 0) / cities.length).toFixed(1);
        const badQuality = cities.filter(c => c.pm25 > 55.4).length;
        const goodQuality = cities.filter(c => c.pm25 <= 12).length;
        
        const context = `
Dữ liệu chất lượng không khí hiện tại (PM2.5):
${cities.map(c => `- ${c.name}: ${c.pm25} μg/m³ (${getPM25Status(c.pm25)})`).join('\n')}

PHÂN TÍCH TỰ ĐỘNG:
- Trung bình toàn quốc: ${avgPM25} μg/m³
- Số tỉnh chất lượng tốt (≤12): ${goodQuality}
- Số tỉnh chất lượng xấu (>55.4): ${badQuality}
- Top 3 ô nhiễm nhất: ${sortedByPM25.slice(0, 3).map(c => `${c.name} (${c.pm25})`).join(', ')}
- Top 3 sạch nhất: ${sortedByPM25.slice(-3).reverse().map(c => `${c.name} (${c.pm25})`).join(', ')}

TIÊU CHUẨN THAM KHẢO:
- WHO khuyến nghị: PM2.5 < 5 μg/m³ (24h)
- EPA Mỹ: Tốt < 12, Trung bình 12-35.4, Kém 35.5-55.4, Xấu 55.5-150.4
- Việt Nam QCVN 05:2013: < 50 μg/m³ (24h)
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

const toggleChatbotBtn = document.getElementById('toggleChatbot');
const container = document.querySelector('.container');

toggleChatbotBtn.addEventListener('click', () => {
    container.classList.toggle('chatbot-hidden');
    toggleChatbotBtn.classList.toggle('shifted');
    
    window.dispatchEvent(new Event('resize'));
    Plotly.Plots.resize(document.getElementById("lineChart"));
    Plotly.Plots.resize(document.getElementById("barChart1"));
    Plotly.Plots.resize(document.getElementById("barChart2"));
});

// Khởi tạo
updateStats();
window.addEventListener('DOMContentLoaded', updateStats);

window.sendMessage = sendMessage;
window.askQuestion = askQuestion;

const picker = new Litepicker({
    element: document.getElementById('dateRange'),
    singleMode: false,              // Chế độ range
    numberOfMonths: 1,              // Hiển thị 1 tháng
    numberOfColumns: 1,             // 1 cột
    format: 'DD/MM/YYYY',           // Format hiển thị
    delimiter: ' - ',               // Dấu phân cách
    minDate: '2021-10-01',          // Ngày tối thiểu
    maxDate: '2021-11-31',          // Ngày tối đa
    startDate: '2021-10-10',        // Ngày bắt đầu mặc định
    endDate: '2021-10-27',          // Ngày kết thúc mặc định
    autoApply: true,                // Tự động áp dụng
    showWeekNumbers: false,         // Không hiển thị số tuần

    setup: (picker) => {
        picker.on('selected', (date1, date2) => {
            if (date1 && date2) {
                // const diffTime = Math.abs(date2.getTime() - date1.getTime());
                // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                date_start = date1.dateInstance;
                date_end = date2.dateInstance;
                stat_date = dateToYMDArray(date_end);
                formatted_stat_date = date_end;
                updateStats();
                // plotPM25ByTime(date_start, date_end, selected_province, "lineChart");
            }
        });
    }
});

provinceSelect.addEventListener('change', function() {
    selected_province = this.value;
    plotPM25ByTime(date_start, date_end, selected_province, "lineChart");
});

var map = L.map('map', {
    center: [15.95, 105.80],
    zoom: 5.5,
    zoomControl: false,
    minZoom: 5.1,   
    maxZoom: 8, 
    maxBounds: [
        [7.18, 96.14],   
        [24.39, 110.46]   
    ],
    maxBoundsViscosity: 1.0,
});

const pm25Map = Object.fromEntries(
    pm25Values.map(({ name, pm25 }) => [name, pm25])
);

function getColor(pm25) {
    return pm25 > 250 ? pm25colors[5] :
           pm25 > 150 ? pm25colors[4] :
           pm25 >  55 ? pm25colors[3] :
           pm25 >  35 ? pm25colors[2] :
           pm25 >  12 ? pm25colors[1] :
                        pm25colors[0];
}

var geojsonFeature = null;
const filePath = "data2/VNnew34.json"

fetch(filePath)
    .then(response => response.json())
    .then(data => {
        geojsonFeature = data;

        function style(feature) {
            const name = feature.properties.NAME_1;
            const pm25 = pm25Map[name];

            return {
                fillColor: getColor(pm25),
                weight: 1,
                opacity: 1,
                color: '#555',
                fillOpacity: 0.7
            };
        }

        function highlightFeature(e) {
            var layer = e.target;
            layer.setStyle({
                weight: 2,
                color: '#000',
                fillOpacity: 0.9
            });
            layer.bringToFront();
        }

        function resetHighlight(e) {
            geojsonLayer.resetStyle(e.target);
        }

        function onEachFeature(feature, layer) {
            const name = feature.properties.NAME_1;
            const pm25 = pm25Map[name];

            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight
            });

            layer.bindTooltip(
                `<b>${name}</b><br>PM2.5: ${pm25 ?? 'N/A'}`,
                {
                    sticky: true,
                    direction: "top",
                    opacity: 0.9,
                    className: "pm25-tooltip"
                }
            );
        }

        var geojsonLayer = L.geoJSON(geojsonFeature, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => console.error('Lỗi:', error));