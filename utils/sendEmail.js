const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter using your email service details
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Or another email service like Outlook, SendGrid, etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address from .env
      pass: process.env.EMAIL_PASS, // Your App Password from .env
    },
  });

  const mailOptions = {
    from: `"UniLink Support" <unilink.app.iiita@gmail.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3. Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent'); // Re-throw error to be caught by controller
  }
};

module.exports = sendEmail;