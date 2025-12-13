import { initScales } from "../utils/scale.js";

var currenLang = 'vi';

export function initLang() {
    const savedLang = localStorage.getItem("lang") || "vi";
    currenLang = savedLang;
    loadLang();
}

export function getLang() {
    return currenLang;
}

export function setLang(lang) {
    currenLang = lang;
    loadLang()
    localStorage.setItem("lang", lang);
    location.reload();
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

