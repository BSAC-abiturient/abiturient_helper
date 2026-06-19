'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const XLSX = require('xlsx');

const SHEET_ID = '1uFwZs-jzJiUkZk6U266bo4QbmwjAjoUcc0pKAabWhos';
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

const parsingConfig = [
  // --- ССО на базе 9 классов (sso9) ---
  { name: "Разработка и сопровождение веб-ресурсов", level: "sso9", form: "dnev", category: "budget" },
  { name: "Разработка и сопровождение веб-ресурсов", level: "sso9", form: "dnev", category: "paid" },
  { name: "Тестирование программного обеспечения", level: "sso9", form: "dnev", category: "budget" },
  { name: "Тестирование программного обеспечения", level: "sso9", form: "dnev", category: "paid" },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso9", form: "dnev", category: "budget" },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso9", form: "dnev", category: "paid" },
  { name: "Информационные кабельные сети", level: "sso9", form: "dnev", category: "budget" },
  { name: "Информационные кабельные сети", level: "sso9", form: "dnev", category: "paid" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso9", form: "dnev", category: "budget" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso9", form: "dnev", category: "paid" },
  { name: "Техническая эксплуатация мультимедийных систем", level: "sso9", form: "dnev", category: "budget" },
  { name: "Почтовая деятельность", level: "sso9", form: "dnev", category: "budget" },
  { name: "Почтовая деятельность", level: "sso9", form: "dnev", category: "paid" },

  // --- ССО на базе 11 классов (sso11) ---
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso11", form: "dnev", category: "budget" },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso11", form: "dnev", category: "paid" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso11", form: "dnev", category: "budget" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso11", form: "dnev", category: "paid" },
  { name: "Почтовая деятельность", level: "sso11", form: "dnev", category: "budget" },
  { name: "Почтовая деятельность", level: "sso11", form: "dnev", category: "paid" },
  { name: "Тестирование программного обеспечения", level: "sso11", form: "dnev", category: "budget" },
  { name: "Тестирование программного обеспечения", level: "sso11", form: "dnev", category: "paid" },

  // --- ССО Заочное отделение (sso11 zaoch) ---
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso11", form: "zaoch", category: "budget" },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", level: "sso11", form: "zaoch", category: "paid" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso11", form: "zaoch", category: "budget" },
  { name: "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения", level: "sso11", form: "zaoch", category: "paid" },
  { name: "Почтовая деятельность", level: "sso11", form: "zaoch", category: "budget" },
  { name: "Почтовая деятельность", level: "sso11", form: "zaoch", category: "paid" },

  // --- ССО на базе ПТО (ssopto) ---
  { name: "Почтовая деятельность", level: "ssopto", form: "dnev", category: "budget" },

  // --- ВО на базе 11 классов (vo11) ---
  { name: "Автоматизация технологических процессов и производств", level: "vo11", form: "dnev", category: "budget", isVo: true },
  { name: "Системы и сети инфокоммуникаций", level: "vo11", form: "dnev", category: "budget", isVo: true },
  { name: "Системы и сети инфокоммуникаций", level: "vo11", form: "dnev", category: "paid", isVo: true },
  { name: "Прикладная информатика", level: "vo11", form: "dnev", category: "budget", isVo: true },
  { name: "Прикладная информатика", level: "vo11", form: "dnev", category: "paid", isVo: true },
  { name: "Цифровые клиентские сервисы и почтово-логистические системы", level: "vo11", form: "dnev", category: "budget", isVo: true },
  { name: "Маркетинг", level: "vo11", form: "dnev", category: "budget", isVo: true },
  { name: "Маркетинг", level: "vo11", form: "dnev", category: "paid", isVo: true },

  // --- ВО на базе ССО (vosso) ---
  { name: "Системы и сети инфокоммуникаций", level: "vosso", form: "dnev", category: "budget", isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", level: "vosso", form: "dnev", category: "paid", isVo: true, isVoSso: true },
  { name: "Прикладная информатика", level: "vosso", form: "dnev", category: "budget", isVo: true, isVoSso: true },
  { name: "Прикладная информатика", level: "vosso", form: "dnev", category: "paid", isVo: true, isVoSso: true },
  { name: "Почтовая связь", level: "vosso", form: "dnev", category: "budget", isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", level: "vosso", form: "zaoch", category: "budget", isVo: true, isVoSso: true },
  { name: "Системы и сети инфокоммуникаций", level: "vosso", form: "zaoch", category: "paid", isVo: true, isVoSso: true },
  { name: "Почтовая связь", level: "vosso", form: "zaoch", category: "budget", isVo: true, isVoSso: true },
  { name: "Почтовая связь", level: "vosso", form: "zaoch", category: "paid", isVo: true, isVoSso: true }
];

function getVal(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  return sheet[addr] ? sheet[addr].v : '';
}

// Поиск строки заголовка баллов для ВО (поиск 400 или 300 вверх от строки специальности)
function findVoHeaderRow(sheet, dataRow, isVoSso) {
  const targetScore = isVoSso ? 300 : 400;
  for (let r = dataRow - 1; r >= 0; r--) {
    const val1 = parseInt(getVal(sheet, r, 11), 10);
    const val2 = parseInt(getVal(sheet, r, 12), 10);
    if (val1 === targetScore || val2 === targetScore) {
      return r;
    }
  }
  return isVoSso ? 63 : 31;
}

// Вычисление планов объединенных ячеек для сокращенного ВО
function getGroupedPlans(sheet, currentOffset) {
  let totalPlan = 0;
  let startRow = currentOffset;

  // Поднимаемся вверх, пока колонка 6 (Всего заявлений) пустая (значит это объединенная ячейка)
  while (startRow > 0 && getVal(sheet, startRow, 6) === "") {
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
  return { sumPlan: totalPlan, startRow, endRow };
}

// Алгоритм последовательного подсчета порядкового номера вхождения специальности на листе с 25 строки
function findAnchorRow(sheet, level, form, category, specName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const targetSpec = specName.toLowerCase().trim();

  // Вычисляем скорректированный порядковый номер вхождения (начиная с 0), который нам нужен
  let targetOccurrence = 0;

  if (specName === "Разработка и сопровождение веб-ресурсов") {
    targetOccurrence = (category === 'paid') ? 1 : 0;
  }
  else if (specName === "Тестирование программного обеспечения") {
    if (level === 'sso9') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else { // sso11
      targetOccurrence = (category === 'paid') ? 3 : 2;
    }
  }
  else if (specName === "Техническая эксплуатация систем и сетей телекоммуникаций") {
    if (level === 'sso9') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else { // sso11
      if (form === 'zaoch') {
        targetOccurrence = (category === 'paid') ? 5 : 4;
      } else { // dnev
        targetOccurrence = (category === 'paid') ? 3 : 2;
      }
    }
  }
  else if (specName === "Информационные кабельные сети") {
    targetOccurrence = (category === 'paid') ? 1 : 0;
  }
  else if (specName === "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения") {
    if (level === 'sso9') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else { // sso11
      if (form === 'zaoch') {
        targetOccurrence = (category === 'paid') ? 5 : 4;
      } else { // dnev
        targetOccurrence = (category === 'paid') ? 3 : 2;
      }
    }
  }
  else if (specName === "Техническая эксплуатация мультимедийных систем") {
    targetOccurrence = 0;
  }
  else if (specName === "Почтовая деятельность") {
    if (level === 'sso9') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else if (level === 'sso11') {
      if (form === 'zaoch') {
        targetOccurrence = (category === 'paid') ? 5 : 4;
      } else { // dnev
        targetOccurrence = (category === 'paid') ? 3 : 2;
      }
    } else if (level === 'ssopto') {
      targetOccurrence = 6;
    }
  }
  else if (specName === "Автоматизация технологических процессов и производств") {
    targetOccurrence = 0;
  }
  else if (specName === "Системы и сети инфокоммуникаций") {
    if (level === 'vo11') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else if (level === 'vosso') {
      if (form === 'zaoch') {
        targetOccurrence = (category === 'paid') ? 10 : 7; // Иерархические индексы с учетом строк специализаций
      } else { // dnev
        targetOccurrence = (category === 'paid') ? 5 : 3;
      }
    }
  }
  else if (specName === "Прикладная информатика") {
    if (level === 'vo11') {
      targetOccurrence = (category === 'paid') ? 1 : 0;
    } else if (level === 'vosso') {
      targetOccurrence = (category === 'paid') ? 3 : 2;
    }
  }
  else if (specName === "Цифровые клиентские сервисы и почтово-логистические системы") {
    targetOccurrence = 0;
  }
  else if (specName === "Маркетинг") {
    targetOccurrence = (category === 'paid') ? 1 : 0;
  }
  else if (specName === "Почтовая связь") {
    if (form === 'zaoch') {
      targetOccurrence = (category === 'paid') ? 2 : 1;
    } else { // dnev
      targetOccurrence = 0;
    }
  }

  let currentOccurrence = 0;

  // Сканируем строки сверху вниз, начиная строго с r = 25 (чтобы пропустить все шапки и содержание в самом верху листа)
  for (let r = 25; r <= range.e.r; r++) {
    let isMatch = false;
    for (let col = 0; col <= 15; col++) {
      const val = getVal(sheet, r, col)?.toString().toLowerCase().trim() || '';
      if (!val) continue;

      if (val === targetSpec || (val.length > 5 && val.includes(targetSpec))) {
        isMatch = true;
        break;
      }

      const normVal = val.replace(/[^a-zа-я0-9]/g, '');
      const normTarget = targetSpec.replace(/[^a-zа-я0-9]/g, '');
      if (normVal.length >= 10 && normVal.includes(normTarget)) {
        isMatch = true;
        break;
      }
    }

    if (isMatch) {
      if (currentOccurrence === targetOccurrence) {
        return r; // Нашли ровно нужное по счету вхождение специальности!
      }
      currentOccurrence++;
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
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      let updatedCount = 0;

      for (const config of parsingConfig) {
        // Реверсивный поиск строки по порядковому номеру вхождения
        let anchorRow = findAnchorRow(sheet, config.level, config.form, config.category, config.name);

        // Если специальность не найдена динамически, выводим предупреждение и пропускаем её
        if (anchorRow === -1) {
          strapi.log.warn(
            `[Парсер] Предупреждение: специальность "${config.name}" (${config.level}, ${config.category}) не найдена. Запись пропущена.`
          );
          continue;
        }

        let plan = 0;
        let total = 0;
        let distribution = {}; // Теперь храним структурированный JSON

        const dataRow = anchorRow;
        let groupInfo = { startRow: dataRow, endRow: dataRow, sumPlan: 0 };

        if (config.isVo) {
          if (config.isVoSso) {
            groupInfo = getGroupedPlans(sheet, dataRow);
            plan = groupInfo.sumPlan;
          } else {
            plan = parseInt(getVal(sheet, dataRow, 4), 10) || 0;
            groupInfo = { startRow: dataRow, endRow: dataRow };
          }

          // Считываем Всего заявлений строго с первой строки объединенной группы
          total = parseInt(getVal(sheet, groupInfo.startRow, 6), 10) || 0;

          let currentMax = config.isVoSso ? 300 : 400;
          const headerRowIndex = findVoHeaderRow(sheet, dataRow, config.isVoSso);

          const commonDist = [];
          const maxCols = config.isVoSso ? 51 : 71;

          for (let col = 11; col <= maxCols; col++) {
            let count = 0;
            for (let r = groupInfo.startRow; r <= groupInfo.endRow; r++) {
              count += parseInt(getVal(sheet, r, col), 10) || 0;
            }

            if (count > 0) {
              commonDist.push({ score: currentMax, count });
            }
            currentMax -= 5;
          }

          // Структура для ВО: общий конкурс и суммарные метаданные по целевикам и льготникам
          distribution = {
            common: commonDist,
            lgota: [],
            target: [],
            targetTotal: parseInt(getVal(sheet, dataRow, 7), 10) || 0,
            noExamsTotal: parseInt(getVal(sheet, dataRow, 8), 10) || 0,
            outOfCompetitionTotal: parseInt(getVal(sheet, dataRow, 9), 10) || 0
          };
        } else {
          plan = parseInt(getVal(sheet, dataRow, 2), 10) || 0;
          const planTarget = parseInt(getVal(sheet, dataRow, 3), 10) || 0;
          total = parseInt(getVal(sheet, dataRow, 75), 10) || 0;

          const commonDist = [];
          const lgotaDist = [];
          const targetDist = [];

          // 1. Считываем общий конкурс (строка специальности)
          for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getVal(sheet, dataRow, col), 10) || 0;
            if (count > 0) commonDist.push({ score: +score.toFixed(1), count });
          }

          // 2. Считываем льготников вне конкурса (строка специальности + 2)
          for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getVal(sheet, dataRow + 2, col), 10) || 0;
            if (count > 0) lgotaDist.push({ score: +score.toFixed(1), count });
          }

          // 3. Считываем целевое обучение (строка специальности + 3)
          for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getVal(sheet, dataRow + 3, col), 10) || 0;
            if (count > 0) targetDist.push({ score: +score.toFixed(1), count });
          }

          // Структурированный JSON для ССО
          distribution = {
            common: commonDist,
            lgota: lgotaDist,
            target: targetDist,
            planTarget: planTarget,
            targetTotal: parseInt(getVal(sheet, dataRow + 3, 75), 10) || 0
          };
        }

        strapi.log.info(
          `[Парсер] Считано: "${config.name}" (${config.level}, ${config.category}). ` +
          `Строка: ${dataRow + 1} [Вхождение]. План: ${plan}, Заявлений: ${total}.`
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
          applications_distribution: distribution, // Сохраняем структурированный объект
          publishedAt: new Date()
        };

        if (existing) {
          await strapi.entityService.update('api::specialty.specialty', existing.id, { data: dataPayload });
        } else {
          await strapi.entityService.create('api::specialty.specialty', { data: dataPayload });
        }

        updatedCount++;
      }

      if (ctx) {
        ctx.body = {
          success: true,
          message: `Успешно обработано специальностей: ${updatedCount}`,
          timestamp: new Date()
        };
      }

    } catch (error) {
      strapi.log.error(error);
      if (ctx && typeof ctx.badRequest === 'function') {
        ctx.badRequest("Ошибка во время парсинга таблицы: " + error.message);
      }
    }
  }
}));
