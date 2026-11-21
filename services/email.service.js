const nodemailer = require("nodemailer");
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, CLIENT_URL } = require("../config/env");
let transporter;
const getTransporter = () => {
  if (!transporter) transporter = SMTP_HOST
    ? nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined })
    : nodemailer.createTransport({ jsonTransport: true });
  return transporter;
};
const sendTokenEmail = ({ to, token, type }) => {
  const page = type === "verify" ? "verify-email" : "reset-password";
  return getTransporter().sendMail({ from: EMAIL_FROM, to, subject: type === "verify" ? "Verify your AuthKit email" : "Reset your AuthKit password", text: `Use this link within 60 minutes: ${CLIENT_URL}/${page}?token=${token}` });
};
module.exports = { sendTokenEmail };
