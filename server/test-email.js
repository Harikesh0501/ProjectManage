const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('CWD:', process.cwd());
console.log('EMAIL_USER present:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Test Email (Port 587)',
    text: 'If you receive this, port 587 is working.'
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.error('❌ Error sending email:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Command:', error.command);
    } else {
        console.log('✅ Email sent: ' + info.response);
    }
});
