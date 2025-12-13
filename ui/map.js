import { updateSidebarInfo, updateSidebarPM25andAdvice } from "./sidebar.js";
import { getDaysAround, getPM25 } from "../utils/helpers.js";
import { DEFAULT_DATE, currentDate } from "../map_layers/terracotta.js";

import { pm25Bands } from "../utils/scale.js";
import { getLang } from "../lang/lang.js";

var currentMarker = null;
var date_today = currentDate;

const defaultLat = 21.0278;
const defaultLon = 105.8342;
const defaultDate = DEFAULT_DATE;

export function initMapInteraction(map) {
    updateSidebar(defaultLat, defaultLon, defaultDate);

    map.on('click', async function(e) {
        const lat = parseFloat(e.latlng.lat.toFixed(5));
        const lon = parseFloat(e.latlng.lng.toFixed(5));

        updateSidebar(lat, lon, date_today);

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        currentMarker = L.marker([lat, lon]).addTo(map)
            .openPopup();
    });
}

export async function updateSidebar(lat, lon, date) {
    const pm25today = await getPM25(lat, lon, date);
    if (pm25today == null) return;

    await Promise.all([
        updateSidebarPM25andAdvice(pm25today),
        updateSidebarInfo(lat, lon),
        updateSidebarChart(lat, lon, date)
    ]);
}


async function updateSidebarChart(lat, lon, date_today) {
    const { rawDates, formattedDates } = getDaysAround(date_today, 6);
    const pm25Values = await getPM25Values(lat, lon, rawDates);
    plottingChart(formattedDates, pm25Values);
}

function plottingChart(formattedDates, pm25Values) {
    const chart = document.getElementById("sidebar-chart");
    chart.innerHTML = "";  

    const ymin = Math.min(...pm25Values) - 5;
    const ymax = Math.max(...pm25Values) + 5;

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
            padding: "5px"
        },
        opacity: 1,
    };

    const layout = {
        margin: { t: 20, r: 20, l: 45, b: 70},
        shapes: shapes,
        dragmode: false,
        xaxis: { title: {text: date_text, font: { family: "Roboto", size: 15 }}, tickangle: -45, showgrid: false, dtick: 2 },
        yaxis: { title: {text: "PM2.5", font: { family: "Poppins", size: 15 }}, range: [ymin, ymax], showgrid: true, dtick: 5, gridcolor: "rgba(0,0,0,0.8)" }
    };
    
    const config = {
        displayModeBar: false,
    }
    Plotly.newPlot(chart, [trace], layout, config);
}

async function getPM25Values(lat, lon, dates) {
    const pm25Values = [];
    for (const date of dates) {
        const v = await getPM25(lat, lon, date); 
        pm25Values.push(v);
    }
    return pm25Values;
}