import { initMap} from './map_layers/basemap.js';
import { addGeoJSONLayer } from './map_layers/geojson.js';
import { addTCLayer} from './map_layers/terracotta.js';

import { initControllers } from './ui/controllers.js';
import { initMapInteraction } from './ui/map.js';

import "./ui/infobtn.js";
import "./ui/slider.js";
import "./ui/navbtn.js"
import { initLang } from './lang/lang.js';

document.addEventListener('DOMContentLoaded', () => {
    initLang();

    var map = initMap();
    addTCLayer(map);
    addGeoJSONLayer(map);

    initMapInteraction(map);
    initControllers(map);
});
