// src/api/otp-auth/controllers/otp-auth.js

module.exports = {
  // 1. Запрос 4-значного кода на Email с регистрацией данных абитуриента
  async requestOtp(ctx) {
    const { email, education_level, education_base, score, submitted_specialty } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email обязателен');
    }
    if (!education_level || !education_base || !score || !submitted_specialty) {
      return ctx.badRequest('Все регистрационные поля должны быть заполнены');
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) {
      return ctx.badRequest('Некорректный формат балла');
    }

    // Генерация случайного 4-значного числа от 1000 до 9999
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Код действителен 10 минут

    console.log(`\n==========================================`);
    console.log(`🔑 СГЕНЕРИРОВАН OTP КОД ДЛЯ: ${email}`);
    console.log(`👉 КОД ПОДТВЕРЖДЕНИЯ: ${otp}`);
    console.log(`==========================================\n`);

    try {
      // Ищем пользователя в стандартной таблице пользователей Strapi
      let user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Если пользователя нет, регистрируем его с новыми полями
        user = await strapi.plugins['users-permissions'].services.user.add({
          username: email.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
          email: email.toLowerCase(),
          password: Math.random().toString(36), // случайный пароль-заглушка
          confirmed: true,
          provider: 'local',
          role: 1, // Роль "Authenticated" по умолчанию
          education_level,
          education_base,
          score: numericScore,
          submitted_specialty
        });
      } else {
        // Если пользователь уже существует, обновляем его профильные данные абитуриента
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            education_level,
            education_base,
            score: numericScore,
            submitted_specialty
          }
        });
      }

      // Записываем код и время окончания его действия пользователю
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { otp_code: otp, otp_expires: expires }
      });

      // Отправляем письмо (теперь асинхронно, с выводом ошибок отправки)
      strapi.plugins['email'].services.email.send({
        to: email.toLowerCase(),
        subject: 'Код подтверждения регистрации БГАС',
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                 <h3>Здравствуйте!</h3>
                 <p>Вы начали процесс регистрации в Личном кабинете абитуриента БГАС.</p>
                 <p>Ваш временный 4-значный код подтверждения входа:</p>
                 <h1 style="color: #007bff; letter-spacing: 5px; font-size: 32px; margin: 20px 0;">${otp}</h1>
                 <p>Код действителен в течение 10 минут.</p>
                 <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                 <small style="color: #777;">Если вы не запрашивали данный код, проигнорируйте это письмо.</small>
               </div>`
      }).then(() => {
        console.log(`✉️ Письмо с кодом успешно отправлено на адрес: ${email}`);
      }).catch(emailError => {
        console.error("❌ Ошибка отправки почты через SMTP сервер:", emailError.message);
        console.warn("⚠️ Код для входа (вывод в консоли):", otp);
      });

      // Возвращаем успешный ответ
      return ctx.send({ ok: true, message: 'Код успешно отправлен на вашу почту' });
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Ошибка генерации OTP кода');
    }
  },

  // Проверка кода и выдача JWT-токена (остается без изменений, возвращает обновленного юзера)
  async verifyOtp(ctx) {
    const { email, code } = ctx.request.body;
    if (!email || !code) {
      return ctx.badRequest('Заполните все поля');
    }

    try {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user || user.otp_code !== code) {
        return ctx.badRequest('Неверный или устаревший код подтверждения');
      }

      const now = new Date();
      if (new Date(user.otp_expires) < now) {
        return ctx.badRequest('Срок действия кода истек, запросите новый');
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { otp_code: null, otp_expires: null }
      });

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

      return ctx.send({
        jwt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          education_level: user.education_level,
          education_base: user.education_base,
          score: user.score,
          submitted_specialty: user.submitted_specialty
        }
      });
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Ошибка верификации кода');
    }
  }
};
