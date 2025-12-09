// BASEMAP TILES
const BASE_TILES = {
    OpenStreetMap_Mapnik: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    Carto_light: L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: "Tiles © Esri — Esri, DeLorme, NAVTEQ",
    }),
    Carto_dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd'
    }),
    Esri: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd'
    })
};

let currentTile = null;

export function initMap(){
    const savedTile = localStorage.getItem('selectedTile') || 'OpenStreetMap_Mapnik';
    const baseLayer = BASE_TILES[savedTile] || BASE_TILES.OpenStreetMap_Mapnik;

    // MAP INIT
    var map = L.map('map', {
        center: [16.0, 102.0],
        zoom: 6,
        zoomControl: false,
        minZoom: 6,   
        maxZoom: 12, 
        maxBounds: [
            [7.18, 96.14],   
            [24.39, 110.46]   
        ],
        maxBoundsViscosity: 1.0,
        layers: [baseLayer]
    });

    currentTile = savedTile;
    return map;
}

export function switchTiles(map, key) {
    if (!BASE_TILES[key]) return;
    if (currentTile === key) return;

    map.removeLayer(BASE_TILES[currentTile]);
    map.addLayer(BASE_TILES[key]);
    currentTile = key;

    localStorage.setItem('selectedTile', key);
}
