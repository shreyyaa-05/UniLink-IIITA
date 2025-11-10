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

  // 2. Define the email options
  // utils/sendEmail.js
const mailOptions = {
    from: `UniLink Admin <${process.env.EMAIL_USER}>`, // <-- This is correct
    to: options.email,
    // ...                          // Recipient's email (passed in)
    subject: options.subject,                       // Email subject (passed in)
    text: options.message,                          // Plain text body (passed in)
    // You can also add an HTML version:
    // html: '<strong>Hello world?</strong>' 
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