// src/api/otp-auth/routes/otp-auth.js

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/otp-request', // URL-адрес для запроса кода
      handler: 'otp-auth.requestOtp',
      config: {
        policies: [],
        auth: false, // Разрешаем доступ без токена авторизации
      },
    },
    {
      method: 'POST',
      path: '/auth/otp-verify', // URL-адрес для проверки кода
      handler: 'otp-auth.verifyOtp',
      config: {
        policies: [],
        auth: false, // Разрешаем доступ без токена авторизации
      },
    },
  ],
};
