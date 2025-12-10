import { province_latlon } from "./scale.js";

// get PM25 value by tracing from tif file's pixel value by values of longtitude, latitude and date
export async function getPM25(lat, lon, date) {
    // load GeoTIFF
    var filePath = "./data/PM25_" + date + "_3km.tif"
    const tiff = await GeoTIFF.fromUrl(filePath)
    const image = await tiff.getImage();

    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    if(lon < minX || lon > maxX || lat < minY || lat > maxY) {
        return null;
    }

    const xRes = (maxX - minX) / width;
    const yRes = (maxY - minY) / height;

    const col = Math.floor((lon - minX) / xRes);
    const row = Math.floor((maxY - lat) / yRes);

    const raster = await image.readRasters({ window: [col, row, col + 1, row + 1] });
    const pm25Value = raster[0][0];

    return pm25Value > 0 ? pm25Value : null;
}

// get a string with 5 days before and after the given date in YYYYMMDD format
export function getDaysAround(dateStr, n) {
    if (n < 1) return;

    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JS month = 0-11
    const day = parseInt(dateStr.slice(6, 8), 10);

    const baseDate = new Date(year, month, day);
    const rawDates = [];
    const formattedDates = [];

    for (let i = -n; i <= n; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');

        formattedDates.push(`${dd}/${m}`)
        rawDates.push(`${y}${m}${dd}`);
    }

    return {rawDates, formattedDates };
}

export async function getPM25whole(date) {
  const result = [];

  for (const [name, coords] of Object.entries(province_latlon)) {
    const pm25 = await getPM25(coords.lat, coords.lon, date);
    result.push({ name, pm25 });
  }

  return result;
}

export function getMinPM25(list) {
  let min = list[0];
  for (const item of list) {
    if (item.pm25 < min.pm25) min = item;
  }
  return {"name": min.name, "pm25": min.pm25};
}

export function getMaxPM25(list) {
  let max = list[0];
  for (const item of list) {
    if (item.pm25 > max.pm25) max = item;
  }
  return {"name": max.name, "pm25": max.pm25};
}

export function getAvgPM25(list) {
  let sum = 0;
  for (const item of list) sum += item.pm25;
  return sum / list.length;
}
