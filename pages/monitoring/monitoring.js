let currentCategory = 'budget';
let timerInterval = null;
let cachedStrapiData = null; // Локальный кэш записей этой специальности (бюджет + платно)

// Словарь метаданных специальностей для красивого рендеринга карточек (чтобы не перегружать схему БД)
const specialtyMetadata = {
    sso9: {
        educationForm: "дневная",
        base: "общего базового образования (после 9 классов)",
        duration: {
            "Разработка и сопровождение веб-ресурсов": "3 года 10 месяцев",
            "Тестирование программного обеспечения": "3 года",
            "Техническая эксплуатация систем и сетей телекоммуникаций": "3 года 10 месяцев",
            "Информационные кабельные сети": "3 года 10 месяцев",
            "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "3 года 10 месяцев",
            "Техническая эксплуатация мультимедийных систем": "3 года 10 месяцев",
            "Почтовая деятельность": "3 года"
        }
    },
    sso11: {
        dnev: {
            educationForm: "дневная",
            base: "общего среднего образования (после 11 классов)",
            duration: {
                "Техническая эксплуатация систем и сетей телекоммуникаций": "2 года 10 месяцев",
                "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "2 года 10 месяцев",
                "Почтовая деятельность": "2 года",
                "Тестирование программного обеспечения": "2 года"
            }
        },
        zaoch: {
            educationForm: "заочная",
            base: "общего среднего образования (после 11 классов)",
            duration: {
                "Техническая эксплуатация систем и сетей телекоммуникаций": "3 года 10 месяцев",
                "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "2 года 10 месяцев",
                "Почтовая деятельность": "2 года"
            }
        }
    },
    ssopto: {
        educationForm: "дневная",
        base: "профессионально-технического образования (ПТО)",
        duration: {
            "Почтовая деятельность": "2 года"
        }
    },
    vo11: {
        educationForm: "дневная",
        base: "общего среднего образования (11 классов)",
        duration: "4 года"
    },
    vosso: {
        dnev: {
            educationForm: "дневная сокращенная",
            base: "среднего специального образования (сокращенный срок)",
            duration: {
                "Системы и сети инфокоммуникаций": "2,5 года",
                "Прикладная информатика": "2,5 года",
                "Почтовая связь": "3 года"
            }
        },
        zaoch: {
            educationForm: "заочная сокращенная",
            base: "среднего специального образования (сокращенный срок)",
            duration: {
                "Системы и сети инфокоммуникаций": "3 года",
                "Прикладная информатика": "3 года",
                "Почтовая связь": "3,5 года"
            }
        }
    }
};

// Функция определения параметров специальности на основе адреса страницы и заголовка
function getSpecQueryFromDocument() {
    const title = document.title.toLowerCase();
    const filename = window.location.pathname.split('/').pop().toLowerCase();

    let name = "";
    let level = "";
    let form = "dnev";

    // Уровень образования
    if (filename.includes('sso_9') || title.includes('9 кл')) {
        level = 'sso9';
    } else if (filename.includes('sso_11') || title.includes('11 кл')) {
        level = 'sso11';
        if (filename.includes('zaoch') || title.includes('заоч')) form = 'zaoch';
    } else if (filename.includes('pto') || title.includes('пто')) {
        level = 'ssopto';
    } else if (filename.includes('vo_11') || (title.includes('во') && !title.includes('ссо'))) {
        level = 'vo11';
    } else if (filename.includes('vo_sso') || title.includes('после ссо')) {
        level = 'vosso';
        if (filename.includes('zaoch') || title.includes('заоч')) form = 'zaoch';
    }

    // Название специальности
    if (filename.includes('spec1') || title.includes('веб-ресурсов') || title.includes('автоматизац')) {
        name = level === 'vosso' ? "Системы и сети инфокоммуникаций" : (level === 'vo11' ? "Автоматизация технологических процессов и производств" : "Разработка и сопровождение веб-ресурсов");
        if (level === 'ssopto') name = "Почтовая деятельность";
    } else if (filename.includes('spec2') || title.includes('телекоммуникаций') || title.includes('системы и сети')) {
        name = level.startsWith('vo') ? "Системы и сети инфокоммуникаций" : "Техническая эксплуатация систем и сетей телекоммуникаций";
    } else if (filename.includes('spec3') || title.includes('кабельные') || title.includes('прикладная')) {
        name = level.startsWith('vo') ? "Прикладная информатика" : "Информационные кабельные сети";
    } else if (filename.includes('spec4') || title.includes('радиосвязи') || title.includes('цифровые')) {
        name = level.startsWith('vo') ? "Цифровые клиентские сервисы и почтово-логистические системы" : "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения";
    } else if (filename.includes('spec5') || title.includes('мультимедийных') || title.includes('маркетинг')) {
        name = level.startsWith('vo') ? (level === 'vosso' ? "Прикладная информатика" : "Маркетинг") : "Техническая эксплуатация мультимедийных систем";
    } else if (filename.includes('spec6') || title.includes('почтовая')) {
        name = level.startsWith('vo') ? "Почтовая связь" : "Почтовая деятельность";
    } else if (filename.includes('spec7') || title.includes('тестирование')) {
        name = "Тестирование программного обеспечения";
    }

    return { name, level, form };
}

// Расчет времени окончания приемной кампании
function getCampaignDates() {
    const { level } = getSpecQueryFromDocument();
    const isVo = level.startsWith('vo');
    const year = 2026;

    let startDate, endDate, startLabel;

    if (isVo) {
        const isVoSso = level === 'vosso';
        if (isVoSso) {
            startDate = new Date(year, 6, 12, 9, 0, 0);
            endDate = new Date(year, 6, 17, 18, 0, 0);
            startLabel = "12 июля";
        } else {
            if (currentCategory === 'budget') {
                startDate = new Date(year, 6, 12, 9, 0, 0);
                endDate = new Date(year, 6, 17, 18, 0, 0);
                startLabel = "12 июля";
            } else {
                startDate = new Date(year, 6, 12, 9, 0, 0);
                endDate = new Date(year, 7, 1, 18, 0, 0);
                startLabel = "12 июля";
            }
        }
    } else {
        const is9cl = level === 'sso9';
        if (is9cl) {
            if (currentCategory === 'budget') {
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 3, 18, 0, 0);
                startLabel = "18 июля";
            } else {
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 10, 18, 0, 0);
                startLabel = "18 июля";
            }
        } else {
            if (currentCategory === 'budget') {
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 11, 18, 0, 0);
                startLabel = "18 июля";
            } else {
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 15, 18, 0, 0);
                startLabel = "18 июля";
            }
        }
    }

    return { startDate, endDate, startLabel };
}

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);

    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const update = () => {
        const { startDate, endDate, startLabel } = getCampaignDates();
        const now = new Date();

        if (now < startDate) {
            timerEl.className = 'countdown-timer not-started';
            timerEl.innerHTML = `
                <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Прием документов начнется ${startLabel}
            `;
            return;
        }

        const diff = endDate - now;

        if (diff <= 0) {
            timerEl.className = 'countdown-timer expired';
            timerEl.innerHTML = `
                <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Прием документов завершен
            `;
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerEl.className = 'countdown-timer';
        timerEl.innerHTML = `
            <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            До конца приема: ${days}д ${hours}ч ${minutes}м ${seconds}с
        `;
    };

    update();
    timerInterval = setInterval(update, 1000);
}

function injectTimerElement() {
    const header = document.querySelector('header');
    if (!header) return;

    let timerEl = document.getElementById('countdown-timer');
    if (!timerEl) {
        timerEl = document.createElement('div');
        timerEl.id = 'countdown-timer';
        timerEl.className = 'countdown-timer';
        header.appendChild(timerEl);
    }

    startCountdown();
}

// Построение HTML страницы на основе данных из БД Strapi и метаданных
function renderMonitoringPage(record) {
    const { name, level, form } = getSpecQueryFromDocument();
    const isVoMode = level.startsWith('vo');

    // Получение статических метаданных
    let meta = specialtyMetadata[level] || {};
    if (level === 'sso11' || level === 'vosso') {
        meta = meta[form] || {};
    }

    const educationForm = meta.educationForm || "дневная";
    const base = meta.base || "общего образования";
    const duration = typeof meta.duration === 'object' ? (meta.duration[name] || "3 года") : (meta.duration || "4 года");

    if (!record || record.plan === 0) {
        return `
        <div class="spec-card">
            <h1 class="spec-title">${name}</h1>
            <div class="info-line">
                <strong>Прием:</strong>
                <div class="badge-container">
                    <button class="badge badge-budget ${currentCategory === 'budget' ? 'active' : ''}" onclick="switchCategory('budget')">за счет средств бюджета</button>
                    <button class="badge badge-paid ${currentCategory === 'paid' ? 'active' : ''}" onclick="switchCategory('paid')">на платной основе</button>
                </div>
            </div>
            <div class="info-line"><strong>Форма обучения:</strong> ${educationForm}</div>
            <div class="info-line"><strong>Прием осуществляется на основе:</strong> ${base}</div>
            <div class="info-line"><strong>Срок обучения:</strong> ${duration}</div>
            <div class="no-paid-msg">
                Набор на данной основе не осуществляется
            </div>
        </div>`;
    }

    const plan = record.plan || 0;
    const total = record.total_applications || 0;
    const distribution = record.applications_distribution || [];

    // Преобразуем массив распределения баллов для правильной отрисовки шкалы
    let applications = [];
    let allScores = [];

    distribution.forEach(item => {
        const scoreVal = parseFloat(item.score);
        const countVal = parseInt(item.count, 10) || 0;
        if (countVal > 0) {
            applications.push({
                score: scoreVal,
                label: isVoMode ? `${scoreVal - 4}-${scoreVal}` : scoreVal.toFixed(1),
                count: countVal
            });
            for (let i = 0; i < countVal; i++) {
                allScores.push(scoreVal);
            }
        }
    });

    // Сортировка по убыванию баллов
    allScores.sort((a, b) => b - a);

    let html = `
    <div class="spec-card">
        <h1 class="spec-title">${name}</h1>
        <div class="info-line">
            <strong>Прием:</strong>
            <div class="badge-container">
                <button class="badge badge-budget ${currentCategory === 'budget' ? 'active' : ''}" onclick="switchCategory('budget')">за счет средств бюджета</button>
                <button class="badge badge-paid ${currentCategory === 'paid' ? 'active' : ''}" onclick="switchCategory('paid')">на платной основе</button>
            </div>
        </div>
        <div class="info-line"><strong>Форма обучения:</strong> ${educationForm}</div>
        <div class="info-line"><strong>Прием осуществляется на основе:</strong> ${base}</div>
        <div class="info-line"><strong>Срок обучения:</strong> ${duration}</div>
        <div class="info-line"><strong>План приема:</strong> ${plan}</div>
        <div class="stat-box">
            <div class="info-line"><strong>Всего заявлений подано:</strong> ${total}</div>
        </div>
    </div>`;

    if (applications.length > 0) {
        html += `\n<h2 class="section-title">Заявления по баллам:</h2>
        <div class="bar-table-wrapper"><table class="bar-table"><thead><tr>`;
        applications.forEach(a => html += `<th>${a.label}</th>`);
        html += `</tr></thead><tbody><tr>`;

        applications.forEach(a => {
            let cellClass = 'cell-red';
            if (plan > 0) {
                if (allScores.length < plan) {
                    cellClass = 'cell-green';
                } else {
                    const cutoffScore = allScores[plan - 1];
                    if (a.score > cutoffScore) cellClass = 'cell-green';
                    else if (a.score === cutoffScore) cellClass = 'cell-yellow';
                    else cellClass = 'cell-red';
                }
            }
            html += `<td class="${cellClass}">${a.count}</td>`;
        });
        html += `</tr></tbody></table></div>`;
    } else {
        html += `<div class="no-paid-msg">Пока не подано ни одного заявления</div>`;
    }

    return html;
}

// Асинхронная загрузка из REST API Strapi
async function loadAndRender() {
    try {
        const { name, level, form } = getSpecQueryFromDocument();
        if (!name) return;

        // Если кэш еще не собран, делаем один запрос для получения обеих форм (Бюджет и Платно)
        if (!cachedStrapiData) {
            const response = await fetch(`http://localhost:1337/api/specialties?filters[name][$eq]=${encodeURIComponent(name)}&filters[education_level][$eq]=${level}&filters[form_of_study][$eq]=${form}&pagination[pageSize]=10`);
            const json = await response.json();
            cachedStrapiData = json.data || [];
        }

        // Фильтруем данные из кэша по текущей категории (budget/paid)
        const currentRecordData = cachedStrapiData.find(item => {
            const attrs = item.attributes || item;
            return attrs.category === currentCategory;
        });

        const recordAttributes = currentRecordData ? (currentRecordData.attributes || currentRecordData) : null;

        document.getElementById('monitor-content').innerHTML = renderMonitoringPage(recordAttributes);
        document.getElementById('loading-overlay').style.display = 'none';
        document.getElementById('monitor-content').style.display = 'block';

        if (recordAttributes && recordAttributes.plan > 0) {
            injectTimerElement();
        } else {
            const timerEl = document.getElementById('countdown-timer');
            if (timerEl) timerEl.remove();
            if (timerInterval) clearInterval(timerInterval);
        }

    } catch (error) {
        console.error("Ошибка загрузки данных из Strapi API:", error);
        document.getElementById('loading-overlay').innerHTML = `
            <div style="color: #ef5350; padding: 20px; font-weight: bold; text-align: center;">
                ⚠️ Ошибка связи с сервером. Пожалуйста, убедитесь, что Strapi запущен.
            </div>`;
    }
}

async function switchCategory(category) {
    if (currentCategory === category) return;
    currentCategory = category;

    document.getElementById('monitor-content').style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'block';

    await loadAndRender();
}

async function initMonitoring() {
    if (!document.getElementById('monitor-content')) return;
    await loadAndRender();
}

window.addEventListener('DOMContentLoaded', initMonitoring);

// Глобальные хелперы интерфейса
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.innerHTML = '← Назад';
    }
});

// Сохранение в историю просмотров
function saveToHistory() {
    const specTitle = document.title;
    const specUrl = window.location.pathname;
    const isSpecPage = document.getElementById('monitor-content') !== null;

    if (isSpecPage && specTitle && specUrl && !specUrl.endsWith('index.html') && !specUrl.endsWith('/')) {
        let history = JSON.parse(localStorage.getItem('recently_viewed_specs')) || [];
        history = history.filter(item => item.url !== specUrl);
        history.unshift({ title: specTitle, url: specUrl });

        if (history.length > 3) {
            history.pop();
        }
        localStorage.setItem('recently_viewed_specs', JSON.stringify(history));
    }
}

// Управление шторкой бургер-меню
window.toggleMenuDrawer = function (event) {
    if (event) event.stopPropagation();
    const drawer = document.getElementById('menu-drawer');
    const trigger = document.getElementById('menu-trigger-btn');
    if (drawer && trigger) {
        const isOpen = drawer.classList.toggle('open');
        trigger.classList.toggle('open', isOpen);
    }
};

document.addEventListener('click', function (event) {
    const drawer = document.getElementById('menu-drawer');
    const trigger = document.getElementById('menu-trigger-btn');

    if (drawer && drawer.classList.contains('open')) {
        if (!drawer.contains(event.target) && !trigger.contains(event.target)) {
            drawer.classList.remove('open');
            if (trigger) trigger.classList.remove('open');
        }
    }
});

// Создание кнопок в шапке (Тема, На главную, Меню)
function injectNavigationButtons() {
    if (document.querySelector('.header-controls')) return;

    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    const pathPrefix = isRoot ? '' : '../../';

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'header-controls';

    let homeButtonHtml = '';
    if (!isRoot) {
        homeButtonHtml = `
            <a href="${pathPrefix}index.html" class="btn-home" title="На главную">
                <svg viewBox="0 0 24 24">
                    <rect x="16" y="4" width="3" height="5" />
                    <path d="M12 2.5L2 10.5h2v10a1 1 0 0 0 1 1h6v-6h2v6h6a1 1 0 0 0 1-1v-10h2L12 2.5z" />
                </svg>
            </a>
        `;
    }

    const themeButtonHtml = `
        <a href="javascript:void(0)" class="btn-theme" onclick="toggleTheme()" title="Переключить тему">
            <svg id="theme-icon" viewBox="0 0 24 24">
                <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-9 8.3-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-3.5 2.5-4.2 7.4-1.7 10.9 2.5 3.5 7.4 4.2 10.9 1.7.4-.3 1-.3 1.4.1.4.4.5.9.2 1.4-1.8 2.3-4.5 3.6-7.8 3.6z" />
            </svg>
        </a>
    `;

    const menuButtonHtml = `
        <a href="javascript:void(0)" id="menu-trigger-btn" class="btn-menu-trigger" onclick="window.toggleMenuDrawer(event)" title="Открыть меню">
            <span class="burger-line"></span>
            <span class="burger-line"></span>
            <span class="burger-line"></span>
        </a>
        <div id="menu-drawer" class="menu-drawer">
            <a href="${pathPrefix}pages/info/college.html" class="menu-item" onclick="window.toggleMenuDrawer()">📊 О Колледже (ССО)</a>
            <a href="${pathPrefix}pages/info/university.html" class="menu-item" onclick="window.toggleMenuDrawer()">🏛️ Об Академии (ВО)</a>
            <a href="${pathPrefix}pages/info/dorms.html" class="menu-item" onclick="window.toggleMenuDrawer()">🏢 Общежития БГАС</a>
            <a href="${pathPrefix}pages/info/contacts.html" class="menu-item" onclick="window.toggleMenuDrawer()">📍 Контакты и Карта</a>
            <a href="${pathPrefix}pages/info/forms.html" class="menu-item" onclick="window.toggleMenuDrawer()">📄 Бланки и заявления</a>
            <a href="${pathPrefix}pages/info/prev_scores.html" class="menu-item" onclick="window.toggleMenuDrawer()">📈 Баллы прошлых лет</a>
            <a href="${pathPrefix}pages/info/enrollment.html" class="menu-item" onclick="window.toggleMenuDrawer()">📋 Списки зачисленных</a>
        </div>
    `;

    controlsContainer.innerHTML = homeButtonHtml + themeButtonHtml + menuButtonHtml;
    document.body.appendChild(controlsContainer);
}

const moonSvg = `<path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-9 8.3-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-3.5 2.5-4.2 7.4-1.7 10.9 2.5 3.5 7.4 4.2 10.9 1.7.4-.3 1-.3 1.4.1.4.4.5.9.2 1.4-1.8 2.3-4.5 3.6-7.8 3.6z" />`;
const sunSvg = `<circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round" stroke="currentColor" />`;

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerHTML = isDark ? sunSvg : moonSvg;
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

document.addEventListener('DOMContentLoaded', () => {
    injectNavigationButtons();
    saveToHistory();
    const isDark = document.documentElement.classList.contains('dark-mode');
    updateThemeIcon(isDark);
});