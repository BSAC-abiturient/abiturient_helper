'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const XLSX = require('xlsx');

// Ссылка на экспорт вашей Google Таблицы в формате XLSX
const SHEET_ID = '1uFwZs-jzJiUkZk6U266bo4QbmwjAjoUcc0pKAabWhos';
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

// Список специальностей для парсинга и их привязка к разделам (Спецификация якорей)
const parsingConfig = [
  // ССО 9 классов
  { name: "Разработка и сопровождение веб-ресурсов", section: "базового образования", level: "sso9", form: "dnev", category: "budget", offset: 10 },
  { name: "Разработка и сопровождение веб-ресурсов", section: "на платной основе", level: "sso9", form: "dnev", category: "paid", offset: 10 },
  { name: "Тестирование программного обеспечения", section: "базового образования", level: "sso9", form: "dnev", category: "budget", offset: 10 },
  { name: "Тестирование программного обеспечения", section: "на платной основе", level: "sso9", form: "dnev", category: "paid", offset: 10 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "базового образования", level: "sso9", form: "dnev", category: "budget", offset: 10 },
  { name: "Техническая эксплуатация систем и сетей телекоммуникаций", section: "на платной основе", level: "sso9", form: "dnev", category: "paid", offset: 10 },

  // ВО 11 классов
  { name: "Прикладная информатика", section: "ОБЩЕЕ ВЫСШЕЕ", level: "vo", form: "dnev", category: "budget", offset: 0, isVo: true },
  { name: "Прикладная информатика", section: "на платной основе", level: "vo", form: "dnev", category: "paid", offset: 0, isVo: true },
  { name: "Системы и сети инфокоммуникаций", section: "ОБЩЕЕ ВЫСШЕЕ", level: "vo", form: "dnev", category: "budget", offset: 0, isVo: true },
  { name: "Системы и сети инфокоммуникаций", section: "на платной основе", level: "vo", form: "dnev", category: "paid", offset: 0, isVo: true }
];

// Вспомогательная функция чтения ячейки
function getVal(sheet, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  return sheet[addr] ? sheet[addr].v : '';
}

// Двухуровневый алгоритм поиска строки-якоря (Пункт 11)
function findAnchorRow(sheet, sectionKeyword, specName) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let startRow = -1;
  let endRow = range.e.r;

  // Шаг 1: Ищем строку начала нужного раздела (Scope)
  for (let r = range.s.r; r <= range.e.r; r++) {
    const valA = getVal(sheet, r, 0)?.toString() || '';
    const valC = getVal(sheet, r, 2)?.toString() || '';
    if (valA.includes(sectionKeyword) || valC.includes(sectionKeyword)) {
      startRow = r;
      break;
    }
  }

  if (startRow === -1) return -1;

  // Находим примерные границы раздела (до следующего крупного заголовка)
  for (let r = startRow + 1; r <= range.e.r; r++) {
    const valA = getVal(sheet, r, 0)?.toString() || '';
    if (valA.includes("На основе") || valA.includes("ОБЩЕЕ ВЫСШЕЕ") || valA.includes("ПО ПОРЯДКУ")) {
      endRow = r - 1;
      break;
    }
  }

  // Шаг 2: Ищем саму специальность строго в границах найденного раздела
  for (let r = startRow; r <= endRow; r++) {
    const valA = getVal(sheet, r, 0)?.toString().trim() || '';
    const valD = getVal(sheet, r, 3)?.toString().trim() || '';
    if (valA === specName || valD === specName) {
      return r;
    }
  }

  return -1;
}

module.exports = createCoreController('api::specialty.specialty', ({ strapi }) => ({
  async parseExcel(ctx) {
    try {
      // 1. Скачиваем свежий Excel-файл из Google Таблиц
      const response = await fetch(XLSX_URL);
      if (!response.ok) throw new Error("Не удалось загрузить Google Таблицу");
      const buffer = await response.arrayBuffer();

      // 2. Читаем файл через SheetJS
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      let updatedCount = 0;

      // 3. Пробегаем по нашему конфигурационному списку специальностей
      for (const config of parsingConfig) {
        const anchorRow = findAnchorRow(sheet, config.section, config.name);

        if (anchorRow === -1) {
          console.warn(`Не найден якорь для: ${config.name} (${config.section})`);
          continue;
        }

        let plan = 0;
        let total = 0;
        let distribution = [];

        if (config.isVo) {
          // Логика парсинга для ВО
          plan = parseInt(getVal(sheet, anchorRow, 4), 10) || 0;
          total = parseInt(getVal(sheet, anchorRow, 6), 10) || 0;

          let currentMax = 400;
          for (let col = 11; col <= 100; col++) {
            let count = parseInt(getVal(sheet, anchorRow, col), 10) || 0;
            let header = getVal(sheet, 31, col) || getVal(sheet, 30, col);
            if (!header && count === 0 && currentMax < 350) break;
            if (count > 0) {
              distribution.push({ score: currentMax, count });
            }
            currentMax -= 5;
          }
        } else {
          // Логика парсинга для ССО
          const dataRow = anchorRow + config.offset;
          plan = parseInt(getVal(sheet, dataRow, 2), 10) || 0;
          total = parseInt(getVal(sheet, dataRow, 75), 10) || 0;

          for (let col = 4, score = 10.0; col <= 74; col++, score = +(score - 0.1).toFixed(1)) {
            let count = parseInt(getVal(sheet, dataRow, col), 10) || 0;
            if (count > 0) {
              distribution.push({ score: +score.toFixed(1), count });
            }
          }
        }

        // 4. Записываем результаты парсинга в базу данных Strapi
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
          // Если запись уже есть — обновляем её
          await strapi.entityService.update('api::specialty.specialty', existing.id, { data: dataPayload });
        } else {
          // Если записи еще нет — создаем новую
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
