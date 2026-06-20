module.exports = {
  // Задача будет запускаться каждые 15 минут
  '*/15 * * * *': async ({ strapi }) => {
    try {
      strapi.log.info('Запуск планировщика: парсинг Google Таблицы...');

      // Вызываем метод парсера из нашего контроллера напрямую
      await strapi.controller('api::specialty.specialty').parseExcel();

      strapi.log.info('Планировщик: данные успешно обновлены.');
    } catch (err) {
      strapi.log.error('Ошибка в планировщике парсинга: ' + err.message);
    }
  },
};
