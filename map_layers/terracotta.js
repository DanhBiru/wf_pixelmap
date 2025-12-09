export let TCLayer;

var tcUrl = 'http://localhost:5000/singleband/{type}/{date}/{z}/{x}/{y}.png?colormap={colormap}&stretch_range={range}';
// newUrl = 'http://localhost:5000/singleband/DEM/00000000/{z}/{x}/{y}.png?colormap=gist_earth&stretch_range=[0,2578]'
// var tcUrl = 'https://wf-pixelmap.onrender.com/singleband/PM25/{date}/{z}/{x}/{y}.png?colormap=pm25&stretch_range=%5B0,150%5D';

// Valid options for {type} with descriptive names and attributes to make it easier to add new features/datatypes 
const DATATYPE = {
    PM25: {
        type: "PM25",
        colormap: "pm25",
        range: "[0,250]",
        // range: "%5D0,150%5B", // this is for live server
        time_variant: true
    },
    Terrain: {
        type: "DEM",
        colormap: "gist_earth",
        range: "[0,2578]",
        // range: "%5D0,150%5B",
        time_variant: false 
    }
};

const DEFAULT_DATATYPE = "PM25";
export const DEFAULT_DATE = "20211020";
export const DEFAULT_DATE_d = new Date('2021-10-20');

// TODO: make use of these
export var currentDatatype = DEFAULT_DATATYPE;
export var currentDate = DEFAULT_DATE;

function createTCLayer(datatype, date) {

    datatype = datatype || DEFAULT_DATATYPE;

    const type = DATATYPE[datatype].type;
    const colormap = DATATYPE[datatype].colormap;
    const range = DATATYPE[datatype].range;
    // console.log(datatype, type, colormap, range);

    currentDatatype = datatype;
    currentDate = date;

    date = date || DEFAULT_DATE;
    if (!DATATYPE[datatype].time_variant) {
        date = "00000000";
    }

    TCLayer = L.tileLayer(tcUrl
        .replace('{type}', type)
        .replace('{date}', date)
        .replace('{colormap}', colormap)
        .replace('{range}', range),
        {zIndex: 2});
}

export function getCurrentDatatype() {
    return currentDatatype;
}

export function addTCLayer(map) {
    createTCLayer();
    TCLayer.addTo(map);
    switchDateWithSlider(map);
}

export function switchDatatype(map, datatype) {
    if (datatype === currentDatatype) return;
   
    map.removeLayer(TCLayer);
    createTCLayer(datatype, currentDate);
    TCLayer.addTo(map);
}

export function switchDate(map, date) {
    if (date === currentDate) return;
    if (!DATATYPE[currentDatatype].time_variant) return;
   
    map.removeLayer(TCLayer);
    currentDate = date;
    console.log(currentDate);
    createTCLayer(currentDatatype, currentDate);
    TCLayer.addTo(map);
}

export function reload(map) {
    currentDate = DEFAULT_DATE;
    currentDatatype = DEFAULT_DATATYPE;

    map.removeLayer(TCLayer);
    createTCLayer(currentDatatype, currentDate);
    TCLayer.addTo(map);
}

function switchDateWithSlider(map) {
    window.addEventListener('updateMapWithNewDate', (e) => {
        var newDate = e.detail;
        switchDate(map, newDate);
    });
}