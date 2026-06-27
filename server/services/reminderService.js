import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/user.js';

const shouldEnableEmail = () => process.env.EMAIL_USER && process.env.EMAIL_PASS;

const createTransporter = () =>
  nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

export const startReminderJob = () => {
  if (!shouldEnableEmail()) {
    console.log('Daily reminder emails disabled: EMAIL_USER and EMAIL_PASS are not configured.');
    return;
  }

  const transporter = createTransporter();
  const schedule = process.env.REMINDER_CRON || '0 8 * * *';

  cron.schedule(schedule, async () => {
    try {
      const users = await User.find({
        email: { $exists: true, $ne: '' },
        emailReminders: { $ne: false },
      }).select('email cfHandle lcHandle');
      await Promise.all(
        users.map((user) =>
          transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your daily CP practice nudge',
            text: `Time for one focused solve today. Codeforces: ${user.cfHandle || 'not connected'}, LeetCode: ${user.lcHandle || 'not connected'}.`,
          })
        )
      );
      console.log(`Sent ${users.length} daily reminder email(s).`);
    } catch (error) {
      console.error('Unable to send daily reminder emails', error);
    }
  });
};
