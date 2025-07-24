// src/utils/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: 'PradaFund <no-reply@pradafund.com>',
      to,
      subject,
      html,
    });

    console.log('📧 Full email response:', response);
    if (response?.id) {
      console.log('✅ Email sent successfully:', response.id);
    } else {
      console.error('❌ Email sending returned no ID:', response);
    }
  } catch (err) {
    console.error('❌ Email sending failed:', err);
  }
}

module.exports = { sendEmail };
