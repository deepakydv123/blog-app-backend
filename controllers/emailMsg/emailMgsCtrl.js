const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const Filter = require("bad-words");
const EmailMsg = require("../../model/EmailMessaging/EmailMessaging");

const sendEmailMsgCtrl = expressAsyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;
  //get the message
  const emailMessage = subject + " " + message;
  //prevent profanity/bad words
  const filter = new Filter();

  const isProfane = filter.isProfane(emailMessage);
  if (isProfane)
    throw new Error("Email sent failed, because it contains profane words.");

  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: process.env.OUTLOOK_EMAIL,
      pass: process.env.OUTLOOK_PASSWORD,
    },
  });

  const options = {
    from: process.env.OUTLOOK_EMAIL,
    to: to,
    subject: subject,
    html: `${message}`,
  };

  transporter.sendMail(options, async function (err, info) {
    if (err) res.json(err);
    else {
      await EmailMsg.create({
        sentBy: req?.user?._id,
        from: req?.user?.email,
        to,
        message,
        subject,
      });
      res.json("Email successfully sent to the user.");
    }
  });
});

module.exports = { sendEmailMsgCtrl };
