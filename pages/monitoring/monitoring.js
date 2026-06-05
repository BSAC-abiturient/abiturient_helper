// переменные для переключения бюджета/платного
let currentCategory = 'budget';
let timerInterval = null;

//ФУНКЦИИ СЕССИОННОГО КЭШИРОВАНИЯ ДАННЫХ EXCEL (XLSX)

// Перевод ArrayBuffer в Base64-строку для хранения в sessionStorage
window.arrayBufferToBase64 = function (buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Восстановление ArrayBuffer из Base64-строки
window.base64ToArrayBuffer = function (base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// Единая функция загрузки XLSX с кэшем на 3 минуты
window.fetchXlsxWithCache = async function (url) {
    const now = Date.now();
    const cachedData = sessionStorage.getItem('cached_xlsx_data');
    const cachedTime = sessionStorage.getItem('cached_xlsx_time');
    const cacheDuration = 3 * 60 * 1000; // Время действия кэша: 3 минуты

    // Если кэш валиден и сохранен, используем его без обращения к сети
    if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < cacheDuration)) {
        return window.base64ToArrayBuffer(cachedData);
    }

    // Иначе выполняем сетевой запрос к Google API
    const response = await fetch(url);
    if (!response.ok) throw new Error("Сетевая ошибка при загрузке таблицы");
    const buffer = await response.arrayBuffer();

    try {
        sessionStorage.setItem('cached_xlsx_data', window.arrayBufferToBase64(buffer));
        sessionStorage.setItem('cached_xlsx_time', now.toString());
    } catch (e) {
        console.warn("Лимит sessionStorage превышен, кэширование пропущено:", e);
    }

    return buffer;
};

// настройки сроков приемки
function getCampaignDates() {
    const isVo = typeof IS_VO !== 'undefined' && IS_VO;
    const year = 2026;

    let startDate, endDate, startLabel;

    if (isVo) {
        // ВО
        const isVoSso = typeof VO_MAX_SCORE !== 'undefined' && VO_MAX_SCORE === 300;

        if (isVoSso) {
            // ВО после ССО (Сокращенный срок)
            startDate = new Date(year, 6, 12, 9, 0, 0);   // 12 июля 09:00
            endDate = new Date(year, 6, 17, 18, 0, 0);    // 17 июля 18:00
            startLabel = "12 июля";
        } else {
            // ВО на базе 11 классов (Полный срок)
            if (currentCategory === 'budget') {
                // Бюджет ВО (11 кл.): с 12 июля по 17 июля 
                startDate = new Date(year, 6, 12, 9, 0, 0);
                endDate = new Date(year, 6, 17, 18, 0, 0);
                startLabel = "12 июля";
            } else {
                // Платно ВО (11 кл.): с 12 июля по 1 августа 
                startDate = new Date(year, 6, 12, 9, 0, 0);
                endDate = new Date(year, 7, 1, 18, 0, 0);
                startLabel = "12 июля";
            }
        }
    } else {
        // ССО
        const offset = typeof SPEC_OFFSET_BUDGET !== 'undefined' ? SPEC_OFFSET_BUDGET : (typeof SPEC_OFFSET !== 'undefined' ? SPEC_OFFSET : 0);
        const is9cl = offset < 320; // 9 класс (все смещения до 320 относятся к базе 9 классов)

        if (is9cl) {
            // База 9 классов
            if (currentCategory === 'budget') {
                // Бюджет ССО (9 кл.): с 18 июля по 3 августа
                startDate = new Date(year, 4, 18, 9, 0, 0);
                endDate = new Date(year, 5, 3, 18, 0, 0); // 3 августа 18:00
                startLabel = "18 июля";
            } else {
                // Платно ССО (9 кл.): с 18 июля по 10 августа
                startDate = new Date(year, 3, 18, 9, 0, 0);
                endDate = new Date(year, 4, 10, 18, 0, 0); // 10 августа 18:00
                startLabel = "18 июля";
            }
        } else {
            // База 11 классов и ПТО
            if (currentCategory === 'budget') {
                // Бюджет ССО (11 кл. / ПТО): с 18 июля по 11 августа
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 11, 18, 0, 0); // 11 августа 18:00
                startLabel = "18 июля";
            } else {
                // Платно ССО (11 кл. / ПТО): с 18 июля по 15 августа 
                startDate = new Date(year, 6, 18, 9, 0, 0);
                endDate = new Date(year, 7, 15, 18, 0, 0); // 15 августа 18:00
                startLabel = "18 июля";
            }
        }
    }

    return { startDate, endDate, startLabel };
}

// Запуск и обновление обратного отсчета
function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);

    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const update = () => {
        const { startDate, endDate, startLabel } = getCampaignDates();
        const now = new Date();

        // Состояние: Прием документов еще не начался
        if (now < startDate) {
            timerEl.className = 'countdown-timer not-started';
            timerEl.innerHTML = `
                <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Прием документов начнется ${startLabel}
            `;
            return;
        }

        const diff = endDate - now;

        // Состояние: Прием документов завершен
        if (diff <= 0) {
            timerEl.className = 'countdown-timer expired';
            timerEl.innerHTML = `
                <svg class="timer-icon" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Прием документов завершен
            `;
            return;
        }

        // Состояние: Активный прием документов
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

// Встраивание элемента таймера в шапку страницы
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

// Чтение ячейки Excel
function getCell(sheet, r, c) {
    const addr = XLSX.utils.encode_cell({ r, c });
    return sheet[addr] ? sheet[addr].v : '';
}

// функция для проверки объединения ячеек по вертикали и нахождения суммы плана
function getGroupedPlans(sheet, currentOffset) {
    let totalPlan = 0;
    let totalPlanTarget = 0;
    let startRow = currentOffset;
    let endRow = currentOffset;

    while (startRow > 0) {
        const currentTotalVal = getCell(sheet, startRow, 6);
        const prevTotalVal = getCell(sheet, startRow - 1, 6);
        const prevName = getCell(sheet, startRow - 1, 3);

        if (currentTotalVal !== "" && (prevTotalVal === "" || !prevName)) {
            break;
        }
        if (currentTotalVal === "" && prevName !== "") {
            startRow--;
        } else {
            break;
        }
    }

    let checkRow = startRow + 1;
    while (checkRow < 1000) {
        const checkTotalVal = getCell(sheet, checkRow, 6);
        const checkName = getCell(sheet, checkRow, 3);

        if (checkName !== "" && checkTotalVal === "") {
            endRow = checkRow;
            checkRow++;
        } else {
            break;
        }
    }

    for (let r = startRow; r <= endRow; r++) {
        totalPlan += parseInt(getCell(sheet, r, 4), 10) || 0;
        totalPlanTarget += parseInt(getCell(sheet, r, 5), 10) || 0;
    }

    return {
        sumPlan: totalPlan,
        sumPlanTarget: totalPlanTarget,
        dataRow: startRow
    };
}

// парсинг данных из Excel
function parseBlock(sheet, offset) {
    const isVoMode = typeof IS_VO !== 'undefined' && IS_VO;

    if (isVoMode) {
        // логика для ВО
        const maxScore = typeof VO_MAX_SCORE !== 'undefined' ? VO_MAX_SCORE : 400;
        const groupInfo = getGroupedPlans(sheet, offset);

        let rawName = getCell(sheet, offset, 3);
        const name = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();

        const plan = groupInfo.sumPlan;
        const planTarget = groupInfo.sumPlanTarget;

        const mainRow = groupInfo.dataRow;
        const total = parseInt(getCell(sheet, mainRow, 6), 10) || 0;

        const targetTotal = parseInt(getCell(sheet, mainRow, 7), 10) || 0;
        const noExamsTotal = parseInt(getCell(sheet, mainRow, 8), 10) || 0;
        const outOfCompetitionTotal = parseInt(getCell(sheet, mainRow, 9), 10) || 0;
        const totalLgota = noExamsTotal + outOfCompetitionTotal;

        let applications = [];
        let startCol = 12;
        let currentMax = maxScore;

        const headerRowIndex = maxScore === 300 ? 63 : 31;

        for (let col = startCol; col <= 100; col++) {
            let count = parseInt(getCell(sheet, mainRow, col), 10) || 0;
            let rawHeader = getCell(sheet, headerRowIndex, col);
            let label = rawHeader ? rawHeader.toString().trim() : "";

            if (!label) {
                break;
            }

            if (count > 0) {
                applications.push({ score: currentMax, label: label, count });
            }
            currentMax -= 5;
            if (currentMax < 0) break;
        }

        let lgota = [];
        if (totalLgota > 0) {
            lgota.push({ score: 0, label: "Льготный", count: totalLgota });
        }

        let target = [];
        if (targetTotal > 0) {
            target.push({ score: 0, label: "Целевой", count: targetTotal });
        }

        const type = "Высшее образование";
        const educationForm = "дневная";
        const base = maxScore === 300 ? "среднего специального образования (сокращенный срок)" : "общего среднего образования (11 классов)";
        const duration = typeof DURATION !== 'undefined' ? DURATION : (maxScore === 300 ? "3-3.5 года" : "4 года");

        return {
            name, type, educationForm, base, duration, plan, planTarget,
            total, targetTotal, applications, lgota, target, isVo: true
        };

    } else {
        // логика для ССО
        const name = getCell(sheet, offset + 10, 0);
        const plan = parseInt(getCell(sheet, offset + 10, 2), 10) || 0;
        const type = getCell(sheet, offset + 0, 2);
        const educationForm = getCell(sheet, offset + 2, 2);
        const base = getCell(sheet, offset + 4, 2);
        const duration = getCell(sheet, offset + 6, 2);
        const planTarget = parseInt(getCell(sheet, offset + 10, 3), 10) || 0;
        const total = parseInt(getCell(sheet, offset + 10, 75), 10) || 0;
        const targetTotal = parseInt(getCell(sheet, offset + 13, 75), 10) || 0;

        let applications = [];
        for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getCell(sheet, offset + 10, col), 10) || 0;
            if (count > 0) applications.push({ score: +score.toFixed(1), label: score.toFixed(1), count });
        }
        let lgota = [];
        for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getCell(sheet, offset + 12, col), 10) || 0;
            if (count > 0) lgota.push({ score: +score.toFixed(1), label: score.toFixed(1), count });
        }
        let target = [];
        for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getCell(sheet, offset + 13, col), 10) || 0;
            if (count > 0) target.push({ score: +score.toFixed(1), label: score.toFixed(1), count });
        }

        return {
            name, type, educationForm, base, duration, plan, planTarget,
            total, targetTotal, applications, lgota, target, isVo: false
        };
    }
}

// генерация HTML-структуры под дизайн
function renderMonitoringPage(s) {
    const isVoMode = !!s.isVo;
    const noPaidExists = (typeof SPEC_OFFSET_PAID === 'undefined');
    const isPaidPlanZero = (s.plan === 0);

    if (currentCategory === 'paid' && (noPaidExists || isPaidPlanZero)) {
        return `
        <div class="spec-card">
            <h1 class="spec-title">${s.name}</h1>
            <div class="info-line">
                <strong>Прием:</strong>
                <div class="badge-container">
                    <button class="badge badge-budget ${currentCategory === 'budget' ? 'active' : ''}" onclick="switchCategory('budget')">за счет средств бюджета</button>
                    <button class="badge badge-paid ${currentCategory === 'paid' ? 'active' : ''}" onclick="switchCategory('paid')">на платной основе</button>
                </div>
            </div>
            <div class="info-line"><strong>Форма обучения:</strong> ${s.educationForm}</div>
            <div class="info-line"><strong>Прием осуществляется на основе:</strong> ${s.base}</div>
            <div class="info-line"><strong>Срок обучения:</strong> ${s.duration}</div>
            <div class="no-paid-msg">
                Набор на платной основе не осуществляется
            </div>
        </div>`;
    }

    let lgotaCount = 0;
    s.lgota.forEach(app => { lgotaCount += app.count; });

    const acceptedTargetCount = Math.min(s.targetTotal, s.planTarget);
    const planForCommon = Math.max(s.plan - lgotaCount - acceptedTargetCount, 0);

    let allApps = [];
    s.applications.forEach(app => { for (let i = 0; i < app.count; i++) allApps.push(app.score); });
    allApps.sort((a, b) => b - a);

    let totalApplications = 0;
    s.applications.forEach(app => { totalApplications += app.count; });

    let totalLgota = lgotaCount;
    let totalTarget = s.isVo ? s.targetTotal : 0;
    if (!s.isVo) {
        s.target.forEach(app => { totalTarget += app.count; });
    }

    let totalCommon = totalApplications;
    if (!isVoMode) {
        totalCommon = totalApplications - totalLgota - totalTarget;
        if (totalCommon < 0) totalCommon = 0;
    }

    let totalAll = isVoMode ? s.total : (totalCommon + totalLgota + totalTarget);

    let html = `
    <div class="spec-card">
        <h1 class="spec-title">${s.name}</h1>
        <div class="info-line">
            <strong>Прием:</strong>
            <div class="badge-container">
                <button class="badge badge-budget ${currentCategory === 'budget' ? 'active' : ''}" onclick="switchCategory('budget')">за счет средств бюджета</button>
                <button class="badge badge-paid ${currentCategory === 'paid' ? 'active' : ''}" onclick="switchCategory('paid')">на платной основе</button>
            </div>
        </div>
        <div class="info-line"><strong>Форма обучения:</strong> ${s.educationForm}</div>
        <div class="info-line"><strong>Прием осуществляется на основе:</strong> ${s.base}</div>
        <div class="info-line"><strong>Срок обучения:</strong> ${s.duration}</div>
        <div class="info-line"><strong>План приема:</strong> ${s.plan} | <strong>Целевой план:</strong> ${s.planTarget}</div>
        <div class="stat-box">
            <div class="info-line"><strong>Всего заявлений подано:</strong> ${totalAll}</div>
            <div class="stat-row">По общему конкурсу: ${isVoMode ? (totalAll - totalLgota - totalTarget) : totalCommon}</div>
            <div class="stat-row">Льготные вне конкурса: ${totalLgota}</div>
            <div class="stat-row">Целевые: ${totalTarget}</div>
        </div>
    </div>`;

    if (s.applications.length > 0) {
        html += `\n<h2 class="section-title">Заявления по баллам:</h2>
        <div class="bar-table-wrapper"><table class="bar-table"><thead><tr>`;
        s.applications.forEach(a => html += `<th>${a.label}</th>`);
        html += `</tr></thead><tbody><tr>`;
        s.applications.forEach(a => {
            let cellClass = 'cell-red';
            if (planForCommon > 0) {
                if (allApps.length < planForCommon) {
                    cellClass = 'cell-green';
                } else if (allApps.length === planForCommon) {
                    cellClass = (a.score === allApps[allApps.length - 1]) ? 'cell-yellow' : 'cell-green';
                } else if (allApps.length > planForCommon) {
                    if (a.score > allApps[planForCommon - 1]) cellClass = 'cell-green';
                    else if (a.score === allApps[planForCommon - 1]) cellClass = 'cell-yellow';
                    else cellClass = 'cell-red';
                }
            }
            html += `<td class="${cellClass}">${a.count}</td>`;
        });
        html += `</tr></tbody></table></div>`;
    }

    if (!isVoMode && s.lgota.length > 0) {
        html += `\n<h2 class="section-title">Льготные вне конкурса по баллам:</h2>
        <div class="bar-table-wrapper"><table class="bar-table"><thead><tr>`;
        s.lgota.forEach(a => html += `<th>${a.label}</th>`);
        html += `</tr></thead><tbody><tr>`;
        s.lgota.forEach(a => html += `<td class="cell-green">${a.count}</td>`);
        html += `</tr></tbody></table></div>`;
    }

    if (!isVoMode && s.target.length > 0) {
        let allTargetScores = [];
        s.target.forEach(app => { for (let i = 0; i < app.count; i++) allTargetScores.push(app.score); });
        allTargetScores.sort((a, b) => b - a);

        const coloredTarget = {
            colored: allTargetScores.map((score, idx) => {
                if (idx < s.planTarget - 1) return { score, color: 'cell-green' };
                if (idx === s.planTarget - 1) return { score, color: 'cell-yellow' };
                return { score, color: 'cell-red' };
            })
        };

        html += `\n<h2 class="section-title">Целевые по баллам:</h2>
        <div class="bar-table-wrapper"><table class="bar-table"><thead><tr>`;
        s.target.forEach(a => html += `<th>${a.label}</th>`);
        html += `</tr></thead><tbody><tr>`;
        s.target.forEach(a => {
            let cellClass = '';
            let idxs = [];
            coloredTarget.colored.forEach((app, idx) => { if (app.score === a.score) idxs.push(idx); });
            if (idxs.length > 0) cellClass = coloredTarget.colored[idxs[0]].color;
            html += `<td class="${cellClass}">${a.count}</td>`;
        });
        html += `</tr></tbody></table></div>`;
    }

    return html;
}

// Загрузка конкретного листа и рендеринг страницы
async function loadAndRender(gid, offset) {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&id=${SHEET_ID}&gid=${gid}`;

        // Считываем буфер через общую функцию кэширования
        const buffer = await window.fetchXlsxWithCache(url);
        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const currentSpecData = parseBlock(sheet, offset);

        if (currentSpecData) {
            document.getElementById('monitor-content').innerHTML = renderMonitoringPage(currentSpecData);
            document.getElementById('loading-overlay').style.display = 'none';
            document.getElementById('monitor-content').style.display = 'block';

            // Проверяем, активен ли прием для выбранной вкладки (бюджет/платно)
            const noPaidExists = (typeof SPEC_OFFSET_PAID === 'undefined');
            const isPaidPlanZero = (currentSpecData.plan === 0);
            const isPaidNotActive = (currentCategory === 'paid' && (noPaidExists || isPaidPlanZero));

            if (isPaidNotActive) {
                // Если прием на платной основе не осуществляется, удаляем таймер
                const existingTimer = document.getElementById('countdown-timer');
                if (existingTimer) existingTimer.remove();
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            } else {
                // Иначе встраиваем таймер в шапку
                injectTimerElement();
            }
        }
    } catch (error) {
        console.error(error);
        document.getElementById('loading-overlay').innerHTML = `
            <div style="color: red; padding: 20px; font-weight: 500;">
                ⚠️ Ошибка загрузки данных мониторинга.
            </div>`;
    }
}

// Функция переключения направления приема
async function switchCategory(category) {
    if (currentCategory === category) return;
    currentCategory = category;

    document.getElementById('monitor-content').style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'block';
    document.getElementById('loading-overlay').innerHTML = `
     <div class="academy-loader-container">
    <div class="cap-wrapper">
        <svg class="mortarboard-svg" viewBox="0 0 64 64">
            <path d="M16 32 V38 C16 43 23 46 32 46 C41 46 48 43 48 38 V32" fill="none" stroke="#007bff" stroke-width="3" stroke-linecap="round" />
            <polygon points="32,10 58,22 32,34 6,22" fill="#007bff" stroke="#007bff" stroke-width="1" />
            <path class="cap-tassel" d="M32,22 L46,27 V37" fill="none" stroke="#ff9800" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="32" cy="22" r="2" fill="#ffffff" />
        </svg>
    </div>
    <div class="loader-text">Загрузка данных...</div>
</div>`;

    let targetGid = '0';
    let targetOffset = 0;

    if (category === 'budget') {
        targetGid = typeof GID_BUDGET !== 'undefined' ? GID_BUDGET : (typeof GID !== 'undefined' ? GID : '0');
        targetOffset = typeof SPEC_OFFSET_BUDGET !== 'undefined' ? SPEC_OFFSET_BUDGET : (typeof SPEC_OFFSET !== 'undefined' ? SPEC_OFFSET : 0);
    } else {
        if (typeof SPEC_OFFSET_PAID === 'undefined') {
            targetGid = typeof GID_BUDGET !== 'undefined' ? GID_BUDGET : (typeof GID !== 'undefined' ? GID : '0');
            targetOffset = typeof SPEC_OFFSET_BUDGET !== 'undefined' ? SPEC_OFFSET_BUDGET : (typeof SPEC_OFFSET !== 'undefined' ? SPEC_OFFSET : 0);
        } else {
            targetGid = typeof GID_PAID !== 'undefined' ? GID_PAID : (typeof GID !== 'undefined' ? GID : '0');
            targetOffset = SPEC_OFFSET_PAID;
        }
    }

    await loadAndRender(targetGid, targetOffset);
}

// Первоначальный запуск
async function initMonitoring() {
    // Если на странице нет контейнера мониторинга, прерываем выполнение,
    // чтобы не вызывать сетевые ошибки парсинга таблиц на обычных страницах
    if (!document.getElementById('monitor-content')) return;

    const startGid = typeof GID_BUDGET !== 'undefined' ? GID_BUDGET : (typeof GID !== 'undefined' ? GID : '0');
    const startOffset = typeof SPEC_OFFSET_BUDGET !== 'undefined' ? SPEC_OFFSET_BUDGET : (typeof SPEC_OFFSET !== 'undefined' ? SPEC_OFFSET : 0);

    await loadAndRender(startGid, startOffset);
}

window.addEventListener('DOMContentLoaded', initMonitoring);

// Автоматическое исправление интерфейса
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.innerHTML = '← Назад';
    }

    const homeButtons = document.querySelectorAll('.btn-home');
    if (homeButtons.length > 1) {
        for (let i = 1; i < homeButtons.length; i++) {
            homeButtons[i].remove();
        }
    }
});

// Функция сохранения в историю просмотров (запускается после загрузки DOM)
function saveToHistory() {
    const specTitle = document.title;
    const specUrl = window.location.pathname;

    // Теперь это сработает корректно, так как DOM уже полностью построен!
    const isSpecPage = document.getElementById('monitor-content') !== null;

    if (isSpecPage && specTitle && specUrl && !specUrl.endsWith('index.html') && !specUrl.endsWith('/')) {
        let history = JSON.parse(localStorage.getItem('recently_viewed_specs')) || [];

        // Исключаем дублирование
        history = history.filter(item => item.url !== specUrl);

        // Добавляем в начало истории
        history.unshift({ title: specTitle, url: specUrl });

        // Ограничиваем историю 3 пунктами
        if (history.length > 3) {
            history.pop();
        }
        localStorage.setItem('recently_viewed_specs', JSON.stringify(history));
    }
}

// pages/monitoring/monitoring.js

/* ==========================================================================
   ЛОГИКА УПРАВЛЕНИЯ ВЫПАДАЮЩИМ МЕНЮ И АНИМАЦИЕЙ ТРИГГЕРА
   ========================================================================== */

window.toggleMenuDrawer = function (event) {
    if (event) {
        event.stopPropagation();
    }
    const drawer = document.getElementById('menu-drawer');
    const trigger = document.getElementById('menu-trigger-btn');
    if (drawer && trigger) {
        const isOpen = drawer.classList.toggle('open');
        trigger.classList.toggle('open', isOpen); // Добавляем/удаляем анимацию крестика
    }
};

document.addEventListener('click', function (event) {
    const drawer = document.getElementById('menu-drawer');
    const trigger = document.getElementById('menu-trigger-btn');

    if (drawer && drawer.classList.contains('open')) {
        if (!drawer.contains(event.target) && !trigger.contains(event.target)) {
            drawer.classList.remove('open');
            if (trigger) {
                trigger.classList.remove('open');
            }
        }
    }
});


/* ==========================================================================
   ДИНАМИЧЕСКОЕ СОЗДАНИЕ ПАНЕЛИ УПРАВЛЕНИЯ
   ========================================================================== */

function injectNavigationButtons() {
    // Предотвращаем повторное добавление элементов
    if (document.querySelector('.header-controls')) return;

    // Определение уровня вложенности текущей страницы
    const isRoot = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname === '';

    // Относительный префикс для путей в зависимости от структуры папок
    const pathPrefix = isRoot ? '' : '../../';

    // Создание общего контейнера для кнопок управления
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'header-controls';

    // 1. Кнопка "На главную" (выводится только для внутренних страниц)
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

    // 2. Кнопка переключения темы оформления
    const themeButtonHtml = `
        <a href="javascript:void(0)" class="btn-theme" onclick="toggleTheme()" title="Переключить тему">
            <svg id="theme-icon" viewBox="0 0 24 24">
                <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-9 8.3-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-3.5 2.5-4.2 7.4-1.7 10.9 2.5 3.5 7.4 4.2 10.9 1.7.4-.3 1-.3 1.4.1.4.4.5.9.2 1.4-1.8 2.3-4.5 3.6-7.8 3.6z" />
            </svg>
        </a>
    `;

    // 3. Структура бургер-меню (кнопка и карточка теперь лежат на одном уровне флекса)
    const menuButtonHtml = `
        <a href="javascript:void(0)" id="menu-trigger-btn" class="btn-menu-trigger" onclick="window.toggleMenuDrawer(event)" title="Открыть меню">
            <span class="burger-line"></span>
            <span class="burger-line"></span>
            <span class="burger-line"></span>
        </a>
        <div id="menu-drawer" class="menu-drawer">
            <a href="${pathPrefix}pages/info/college.html" class="menu-item" onclick="window.toggleMenuDrawer()">
                <svg class="menu-item-icon" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <line x1="9" y1="22" x2="9" y2="16"></line>
                    <line x1="15" y1="22" x2="15" y2="16"></line>
                    <line x1="9" y1="16" x2="15" y2="16"></line>
                    <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01"></path>
                </svg>
                О Колледже (ССО)
            </a>
            <a href="${pathPrefix}pages/info/university.html" class="menu-item" onclick="window.toggleMenuDrawer()">
                <svg class="menu-item-icon" viewBox="0 0 24 24">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
                Об Академии (ВО)
            </a>
            <a href="${pathPrefix}pages/info/dorms.html" class="menu-item" onclick="window.toggleMenuDrawer()">
                <svg class="menu-item-icon" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Общежития БГАС
            </a>
            <a href="${pathPrefix}pages/info/contacts.html" class="menu-item" onclick="window.toggleMenuDrawer()">
                <svg class="menu-item-icon" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-10a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Контакты и Карта
            </a>
            <div class="menu-divider"></div>
            <!-- Telegram-канал ВО -->
            <a href="https://t.me/bsac_by" target="_blank" class="menu-item" style="color: #0088cc !important;" onclick="window.toggleMenuDrawer()">
                <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #0088cc !important; margin-right: 6px; flex-shrink: 0;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.12.17.29.18.42-.01.06-.01.12-.02.19z"/>
                </svg>
                Telegram ВО
            </a>
            <!-- Telegram-канал ССО -->
            <a href="https://t.me/bsac_sso_chat" target="_blank" class="menu-item" style="color: #0088cc !important;" onclick="window.toggleMenuDrawer()">
                <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #0088cc !important; margin-right: 6px; flex-shrink: 0;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.12.17.29.18.42-.01.06-.01.12-.02.19z"/>
                </svg>
                Telegram ССО
            </a>
        </div>
    `;

    controlsContainer.innerHTML = homeButtonHtml + themeButtonHtml + menuButtonHtml;
    document.body.appendChild(controlsContainer);
}
/* ==========================================================================
   УПРАВЛЕНИЕ ИКОНКАМИ И ПЕРЕКЛЮЧЕНИЕМ ТЕМЫ ОФОРМЛЕНИЯ
   ========================================================================== */

const moonSvg = `<path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-9 8.3-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-3.5 2.5-4.2 7.4-1.7 10.9 2.5 3.5 7.4 4.2 10.9 1.7.4-.3 1-.3 1.4.1.4.4.5.9.2 1.4-1.8 2.3-4.5 3.6-7.8 3.6z" />`;
const sunSvg = `<circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round" stroke="currentColor" />`;

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.innerHTML = isDark ? sunSvg : moonSvg;
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}


/* ==========================================================================
   ОБЪЕДИНЕННЫЙ ОБРАБОТЧИК СОБЫТИЙ ЗАГРУЗКИ ДОКУМЕНТА (DOM)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Динамически генерируем кнопки навигации и бургер-меню
    injectNavigationButtons();

    // 2. Запускаем сохранение в историю (если это страница специальности)
    if (typeof saveToHistory === 'function') {
        saveToHistory();
    }

    // 3. Инициализируем правильную визуальную иконку темы (солнце/луна)
    const isDark = document.documentElement.classList.contains('dark-mode');
    updateThemeIcon(isDark);

    // 4. Навешиваем плавные переходы между страницами на локальные ссылки
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && link.hostname === window.location.hostname) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetUrl = link.href;
                const container = document.querySelector('.container');
                if (container) {
                    container.style.transition = 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
                    container.style.opacity = '0';
                    container.style.transform = 'translateY(-6px)';
                }
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 220);
            });
        }
    });
});