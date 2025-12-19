export var pm25labels = null;
export var pm25notes = null;
export var pm25messages = null;

export async function initScales(data) {
    pm25labels = data.sidebar.info.label;
    pm25notes = data.sidebar.info.note;
    pm25messages = data.sidebar.info.message;
}

export const pm25Bands = [
    {min: 0,    max: 12,  color: "rgb(0,228,0)"},     
    {min: 12,   max: 35,  color: "rgb(255,255,0)"},   
    {min: 35,   max: 55,  color: "rgb(255,126,0)"},   
    {min: 55,   max: 150, color: "rgb(255,0,0)"},    
    {min: 150,  max: 250, color: "rgb(143,63,151)"},  
    {min: 250,  max: 500, color: "rgb(126,0,35)"}     
];

export const pm25scale = [12,35,55,150,250,350]; // PM25 standard
export const pm25colors = ["#00e400b3", "#ffff00b3", "#ff7e00b3", "#ff0000b3", "#8f3f97b3", "#7e0023b3"]; 

export const province_latlon = {
    "Hà Nội": { lat: 21.0285, lon: 105.8542 },
    "Hải Phòng": { lat: 20.8449, lon: 106.6881 },
    "Quảng Ninh": { lat: 21.0064, lon: 107.2925 },
    "Lào Cai": { lat: 22.4833, lon: 103.9500 },
    "Cao Bằng": { lat: 22.6667, lon: 106.2500 },
    "Lạng Sơn": { lat: 21.8526, lon: 106.7615 },
    "Thái Nguyên": { lat: 21.5942, lon: 105.8482 },
    "Phú Thọ": { lat: 21.3992, lon: 105.2221 },
    "Bắc Ninh": { lat: 21.1861, lon: 106.0763 },
    "Hưng Yên": { lat: 20.6464, lon: 106.0511 },
    "Ninh Bình": { lat: 20.2500, lon: 105.9750 },
    "Thanh Hóa": { lat: 19.8067, lon: 105.7850 },
    "Nghệ An": { lat: 18.6733, lon: 105.6922 },
    "Hà Tĩnh": { lat: 18.3428, lon: 105.9057 },
    "Quảng Trị": { lat: 16.7500, lon: 107.2000 },
    "Thừa Thiên Huế": { lat: 16.4637, lon: 107.5909 },
    "Đà Nẵng": { lat: 16.0544, lon: 108.2022 },
    "Quảng Ngãi": { lat: 15.1205, lon: 108.7924 },
    "Gia Lai": { lat: 13.9833, lon: 108.0000 },
    "Đắk Lắk": { lat: 12.6667, lon: 108.0500 },
    "Khánh Hòa": { lat: 12.2388, lon: 109.1967 },
    "Hồ Chí Minh": { lat: 10.8231, lon: 106.6297 },
    "Cần Thơ": { lat: 10.0452, lon: 105.7469 },
    "Cà Mau": { lat: 9.1769, lon: 105.1524 },
    "Đồng Nai": { lat: 11.0686, lon: 107.1676 },
    "Đồng Tháp": { lat: 10.4938, lon: 105.6882 },
    "An Giang": { lat: 10.5216, lon: 105.1259 },
    "Điện Biên": { lat: 21.3860, lon: 103.0230 },
    "Lai Châu": { lat: 22.3964, lon: 103.4582 },
    "Lâm Đồng": { lat: 11.5753, lon: 108.1429 },
    "Sơn La": { lat: 21.3270, lon: 103.9144 },
    "Tây Ninh": { lat: 11.3352, lon: 106.1099 },
    "Tuyên Quang": { lat: 21.8236, lon: 105.2142 },
    "Vĩnh Long": { lat: 10.2537, lon: 105.9722 }
};

