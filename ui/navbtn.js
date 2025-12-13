import { setLang } from "../lang/lang.js";

const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const languageSelect = document.getElementById('languageSelect');

document.body.appendChild(dropdownMenu);
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const rect = menuBtn.getBoundingClientRect();
    
    dropdownMenu.style.top = rect.top + 'px';
    dropdownMenu.style.left = (rect.right + 8) + 'px';
    
    dropdownMenu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
        dropdownMenu.classList.remove('active');
    }
});

languageSelect.addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    console.log('Đã chọn ngôn ngữ:', selectedLang);
    setLang(selectedLang);
});