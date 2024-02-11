const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerificationEmail = async (to, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}/api/users/verify/${verificationToken}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM_ADDRESS,
    to: to,
    subject: 'Verify Your Email Address',
    html: `<p>Please click on the following link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
  });
};

module.exports = { sendVerificationEmail };
