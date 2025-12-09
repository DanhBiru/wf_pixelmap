import {pm25scale, pm25colors, pm25labels, pm25notes, pm25messages} from "../utils/scale.js";

export async function updateSidebarPM25andAdvice(pm25today) {
    let bg_color, label, message, note;
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

export async function updateSidebarInfo(lat, lon) {
    const sidebarInfo = document.getElementById("sidebar-info");

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`;
    const response = await fetch(url);
    const data = await response.json();

    const address1 = data.address.state || data.address.city;
    const address2 = data.address.county || data.address.borough || data.address.city_district || data.address.suburb || data.address.town || data.address.city || "undefined";

    sidebarInfo.innerHTML = `
        <p>Ngày 6/9/2025</p>
        <p>${address1}, ${address2}</p>
        <p>Vĩ độ: ${lat.toFixed(3)}, Kinh độ: ${lon.toFixed(3)}</p>
    `;  
}