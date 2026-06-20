module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Использование TLS (STARTTLS)
        auth: {
          user: env('SMTP_USER', 'bsacabiturienthelper@gmail.com'), // Укажите ваш Gmail
          pass: env('SMTP_PASS', 'shgklvxqbvkjvrno'), // 16-значный пароль без пробелов
        },
        rejectUnauthorized: false,
      },
      settings: {
        defaultFrom: env('SMTP_USER', 'bsacabiturienthelper@gmail.com'),
        defaultReplyTo: env('SMTP_USER', 'bsacabiturienthelper@gmail.com'),
      },
    },
  },
});
