import { initScales } from "../utils/scale.js";

var currenLang = 'vi';

export function initLang() {
    loadLang();
}

export function getLang() {
    return currenLang;
}

async function loadLang() {
    const res = await fetch("./lang/lang.json");
    const json = await res.json();
    const data = json[currenLang];

    await initScales(data);

    function getNested(obj, key) {
        return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
    }

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const text = getNested(data, key);
        if (text) el.textContent = text;
    });
}

