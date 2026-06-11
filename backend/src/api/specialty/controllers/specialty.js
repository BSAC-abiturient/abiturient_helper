'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const XLSX = require('xlsx');

const SHEET_ID = '1uFwZs-jzJiUkZk6U266bo4QbmwjAjoUcc0pKAabWhos';
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

const parsingConfig = [
  // --- ССО на базе 9 классов (sso9) ---
  { name: "Разработка и сопровождение веб-ресурсов", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 126 },
  { name: "Разработка и сопровождение веб-ресурсов", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 142 },
  { name: "Тестирование программного обеспечения", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 158 },
  { name: "Тестирование программного обеспечения", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 174 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 190 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 206 },
  { name: "Информационные кабельные сети", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 222 },
  { name: "Информационные кабельные сети", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 238 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 254 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 270 },
  { name: "Техническая эксплуатация мультимедийных систем", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 286 },
  { name: "Почтовая деятельность", section: "базового образования", level: "sso9", form: "dnev", category: "budget", fallbackRow: 302 },
  { name: "Почтовая деятельность", section: "базового образования (на платной", level: "sso9", form: "dnev", category: "paid", fallbackRow: 318 },

  // --- ССО на базе 11 классов (sso11) ---
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "среднего образования", level: "sso11", form: "dnev", category: "budget", fallbackRow: 366 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "среднего образования (на платной", level: "sso11", form: "dnev", category: "paid", fallbackRow: 382 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "среднего образования", level: "sso11", form: "dnev", category: "budget", fallbackRow: 398 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "среднего образования (на платной", level: "sso11", form: "dnev", category: "paid", fallbackRow: 414 },
  { name: "Почтовая деятельность", section: "среднего образования", level: "sso11", form: "dnev", category: "budget", fallbackRow: 430 },
  { name: "Почтовая деятельность", section: "среднего образования (на платной", level: "sso11", form: "dnev", category: "paid", fallbackRow: 446 },
  { name: "Тестирование программного обеспечения", section: "среднего образования", level: "sso11", form: "dnev", category: "budget", fallbackRow: 334 },
  { name: "Тестирование программного обеспечения", section: "среднего образования (на платной", level: "sso11", form: "dnev", category: "paid", fallbackRow: 350 },

  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "среднего образования", level: "sso11", form: "zaoch", category: "budget", fallbackRow: 464 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "среднего образования (на платной", level: "sso11", form: "zaoch", category: "paid", fallbackRow: 480 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "среднего образования", level: "sso11", form: "zaoch", category: "budget", fallbackRow: 496 },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", section: "среднего образования (на платной", level: "sso11", form: "zaoch", category: "paid", fallbackRow: 512 },
  { name: "Почтовая деятельность", section: "среднего образования", level: "sso11", form: "zaoch", category: "budget", fallbackRow: 528 },
  { name: "Почтовая деятельность", section: "среднего образования (на платной", level: "sso11", form: "zaoch", category: "paid", fallbackRow: 544 },

  // --- ССО на базе ПТО (ssopto) ---
  { name: "Почтовая деятельность", section: "профессионально-технического", level: "ssopto", form: "dnev", category: "budget", fallbackRow: 560 },

  // --- ВО на базе 11 классов (vo11) ---
  { name: "Автоматизация технологических процессов и производств", section: "общее высшее образование", level: "vo11", form: "dnev", category: "budget", fallbackRow: 32, isVo: true },
  { name: "Системы и сети инфокоммуникаций", section: "общее высшее образование", level: "vo11", form: "dnev", category: "budget", fallbackRow: 33, isVo: true },
  { name: "Системы и сети инфокоммуникаций", section: "высшее образование (на платной", level: "vo11", form: "dnev", category: "paid", fallbackRow: 50, isVo: true },
  { name: "Прикладная информатика", section: "общее высшее образование", level: "vo11", form: "dnev", category: "budget", fallbackRow: 34, isVo: true },
  { name: "Прикладная информатика", section: "высшее образование (на платной", level: "vo11", form: "dnev", category: "paid", fallbackRow: 51, isVo: true },
  { name: "Цифровые клиентские сервисы и почтово-логистические системы", section: "общее высшее образование", level: "vo11", form: "dnev", category: "budget", fallbackRow: 35, isVo: true },
  { name: "Маркетинг", section: "общее высшее образование", level: "vo11", form: "dnev", category: "budget", fallbackRow: 36, isVo: true },
  { name: "Маркетинг", section: "высшее образование (на платной", level: "vo11", form: "dnev", category: "paid", fallbackRow: 52, isVo: true },

  // --- ВО на базе ССО (vosso) ---
  { name: "Системы и сети инфокоммуникаций", section: "сокращенный срок", level: "vosso", form: "dnev", category: "budget", fallbackRow: 64, isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", section: "сокращенный срок (на платной", level: "vosso", form: "dnev", category: "paid", fallbackRow: 79, isVo: true, isVoSso: true },
  { name: "Прикладная информатика", section: "сокращенный срок", level: "vosso", form: "dnev", category: "budget", fallbackRow: 66, isVo: true, isVoSso: true },
  { name: "Прикладная информатика", section: "сокращенный срок (на платной", level: "vosso", form: "dnev", category: "paid", fallbackRow: 81, isVo: true, isVoSso: true },
  { name: "Почтовая связь", section: "сокращенный срок", level: "vosso", form: "dnev", category: "budget", fallbackRow: 67, isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", section: "сокращенный срок", level: "vosso", form: "zaoch", category: "budget", fallbackRow: 93, isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", section: "сокращенный срок (на платной", level: "vosso", form: "zaoch", category: "paid", fallbackRow: 108, isVo: true, isVoSso: true },
  { name: "Почтовая связь", section: "сокращенный срок", level: "vosso", form: "zaoch", category: "budget", fallbackRow: 96, isVo: true, isVoSso: true },
  { name: "Почтовая связь", section: "сокращенный срок (на платной", level: "vosso", form: "zaoch", category: "paid", fallbackRow: 111, isVo: true, isVoSso: true }
];

function getVal(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  return sheet[addr] ? sheet[addr].v : '';
}

// Функция для нахождения сгруппированных планов (применяется для Сокращенной формы ВО)
function getGroupedPlans(sheet, currentOffset) {
  let totalPlan = 0;
  let startRow = currentOffset;
  const limitRow = currentOffset >= 90 ? 93 : 64;

  while (startRow > limitRow && getVal(sheet, startRow, 6) === "") {
    startRow--;
  }

  let endRow = startRow;
  while (endRow < 1000) {
    totalPlan += parseInt(getVal(sheet, endRow, 4), 10) || 0;
    const nextTotalVal = getVal(sheet, endRow + 1, 6);
    const nextName = getVal(sheet, endRow + 1, 3);
    if (nextTotalVal !== "" || nextName === "") {
      break;
    }
    endRow++;
  }
  return { sumPlan: totalPlan, dataRow: startRow };
}

// Глубокий поиск строки-якоря
function findAnchorRow(sheet, sectionKeyword, specName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let startRow = -1;
  let endRow = range.e.r;

  const keyword = sectionKeyword.toLowerCase().trim();
  const targetSpec = specName.toLowerCase().trim();

  for (let r = range.s.r; r <= range.e.r; r++) {
    let found = false;
    for (let col = 0; col <= 15; col++) {
      const val = getVal(sheet, r, col)?.toString().toLowerCase() || '';
      if (val.includes(keyword)) {
        startRow = r;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (startRow === -1) return -1;

  endRow = Math.min(startRow + 150, range.e.r);

  for (let r = startRow; r <= endRow; r++) {
    for (let col = 0; col <= 15; col++) {
      const val = getVal(sheet, r, col)?.toString().toLowerCase().trim() || '';
      if (val === targetSpec || (val.length > 5 && val.includes(targetSpec))) {
        return r;
      }
    }
  }

  return -1;
}

module.exports = createCoreController('api::specialty.specialty', ({ strapi }) => ({
  async parseExcel(ctx) {
    try {
      const response = await fetch(XLSX_URL);
      if (!response.ok) throw new Error("Не удалось загрузить Google Таблицу");
      const buffer = await response.arrayBuffer();

      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      let updatedCount = 0;

      for (const config of parsingConfig) {
        // Пробуем динамический поиск
        let anchorRow = findAnchorRow(sheet, config.section, config.name);
        let usingFallback = false;

        // Если динамический поиск не нашел строку, используем жестко зашитый fallback
        if (anchorRow === -1) {
          anchorRow = config.fallbackRow;
          usingFallback = true;
        }

        let plan = 0;
        let total = 0;
        let distribution = [];

        // Строка данных совпадает со строкой найденной специальности
        const dataRow = anchorRow;

        if (config.isVo) {
          // --- Высшее образование ---
          total = parseInt(getVal(sheet, dataRow, 6), 10) || 0;

          if (config.isVoSso) {
            // Для сокращенной формы суммируем планы
            const groupInfo = getGroupedPlans(sheet, dataRow);
            plan = groupInfo.sumPlan;
          } else {
            plan = parseInt(getVal(sheet, dataRow, 4), 10) || 0;
          }

          let currentMax = config.isVoSso ? 300 : 400;
          const headerRowIndex = config.isVoSso ? 63 : 31;

          for (let col = 11; col <= 100; col++) {
            let count = parseInt(getVal(sheet, dataRow, col), 10) || 0;
            let header = getVal(sheet, headerRowIndex, col) || getVal(sheet, headerRowIndex - 1, col);
            if (!header && count === 0 && currentMax < (config.isVoSso ? 250 : 350)) break;
            if (count > 0) {
              distribution.push({ score: currentMax, count });
            }
            currentMax -= 5;
          }
        } else {
          // --- Среднее специальное образование ---
          plan = parseInt(getVal(sheet, dataRow, 2), 10) || 0;
          total = parseInt(getVal(sheet, dataRow, 75), 10) || 0;

          for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getVal(sheet, dataRow, col), 10) || 0;
            if (count > 0) {
              distribution.push({ score: +score.toFixed(1), count });
            }
          }
        }

        // Логирование результатов для контроля
        strapi.log.info(
          `[Парсер] Считана специальность: "${config.name}" (${config.level}, ${config.category}). ` +
          `Строка в Excel: ${dataRow + 1} ${usingFallback ? '[Резерв]' : '[Динамика]'}. ` +
          `План: ${plan}, Заявлений: ${total}, Распределение: ${distribution.length} групп.`
        );

        const existing = await strapi.db.query('api::specialty.specialty').findOne({
          where: {
            name: config.name,
            education_level: config.level,
            form_of_study: config.form,
            category: config.category
          }
        });

        const dataPayload = {
          name: config.name,
          education_level: config.level,
          form_of_study: config.form,
          category: config.category,
          plan: plan,
          total_applications: total,
          applications_distribution: distribution
        };

        if (existing) {
          await strapi.entityService.update('api::specialty.specialty', existing.id, { data: dataPayload });
        } else {
          await strapi.entityService.create('api::specialty.specialty', { data: dataPayload });
        }

        updatedCount++;
      }

      ctx.body = {
        success: true,
        message: `Успешно обработано специальностей: ${updatedCount}`,
        timestamp: new Date()
      };

    } catch (error) {
      strapi.log.error(error);
      ctx.badRequest("Ошибка во время парсинга таблицы: " + error.message);
    }
  }
}));
