const nodemailer = require("nodemailer");
const sendMail = async (options) => {
  // initialize the transporter by adjust the email service used to send the email .e.g. gmail, mailGun, mailTrap, sendGrid
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  // Customize the email details options
  const emailOptions = {
    from: "Ecommerce App <sakrservices2020@gmail.com>",
    to: options.to,
    subject: options.subject,
    // text: options.body,
    html:options.html
  };

await transporter.sendMail(emailOptions);

};

module.exports = sendMail;
