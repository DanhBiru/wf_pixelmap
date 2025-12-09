import {switchTiles} from "../map_layers/basemap.js"
import { getCurrentDatatype, switchDatatype } from "../map_layers/terracotta.js";

export function initControllers(map) {
    initMapControllers(map);
    initTileController(map);
    initDatatypeController(map);
}

function initMapControllers(map) {
    document.getElementById('zoomIn').addEventListener('click', function() {
        map.zoomIn();
    });
    document.getElementById('zoomOut').addEventListener('click', function() {
        map.zoomOut();
    });
    document.getElementById('resetZoom').addEventListener('click', function() {
        map.setView([16.0, 108.0], 6);
    });
}

function initTileController(map) {
    const buttons = document.querySelectorAll('#tileOptions button');
    buttons.forEach(btn => {
        btn.addEventListener('click', e => {
            const key = e.target.value;
            switchTiles(map, key);
        });
    });
}

// TODO: make this a list instead, like the Tile Controller above
function initDatatypeController(map) {
    document.getElementById('toggleDEM').addEventListener('click', function() {
        if(getCurrentDatatype() === "PM25") {
            switchDatatype(map, "Terrain");
        } else {
            switchDatatype(map, "PM25");
        }
    });
}

