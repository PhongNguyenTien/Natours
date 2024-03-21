/* thông thường, trong thực tế, gmail k đc sử dụng để reset password vì Gmail giới hạn tối đa 500 mail gửi/ ngày 
    đối với mỗi account => tức chỉ tối đa 500 user đc đổi pass mỗi ngày. 1 số service khác hay đc sử dụng hơn là 
    SendGrid hoặc MailGun */

import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. create a connection to a SMTP server separately for every single message (transporter)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. define the options when send email:
  const mailOptions = {
    from: 'Phong Nguyen Tien phongntuet1110@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. send email with defined transport object and options
  await transporter.sendMail(mailOptions);
};

export {sendEmail};