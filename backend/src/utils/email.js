const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const emailTemplates = {
  verifyEmailCode: (name, code) => ({
    subject: "Your Verification Code - EcomStore",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">EcomStore</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Email Verification</p>
          </div>
          <div style="padding:40px 30px;text-align:center;">
            <h2 style="color:#333;margin:0 0 16px;">Hi ${name}!</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 24px;">
              Enter this code on the verification page to activate your account:
            </p>
            <div style="background:#f5f5f5;border-radius:8px;padding:24px;margin:24px 0;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#667eea;">${code}</span>
            </div>
            <p style="color:#999;font-size:13px;margin:0;">
              This code expires in <strong>15 minutes</strong>. If you didn't create an account, ignore this email.
            </p>
          </div>
          <div style="background:#f9f9f9;padding:20px 30px;text-align:center;">
            <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} EcomStore. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  verifyEmail: (name, verificationUrl) => ({
    subject: "Verify Your Email - EcomStore",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">EcomStore</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Welcome to our store!</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#333;margin:0 0 16px;">Hi ${name}! 👋</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 24px;">
              Thank you for registering with EcomStore. Please verify your email address to activate your account and start shopping.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verificationUrl}" 
                 style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
                Verify My Email
              </a>
            </div>
            <p style="color:#999;font-size:13px;margin:24px 0 0;">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#bbb;font-size:12px;text-align:center;">
              Or copy this link: <br>
              <a href="${verificationUrl}" style="color:#667eea;word-break:break-all;">${verificationUrl}</a>
            </p>
          </div>
          <div style="background:#f9f9f9;padding:20px 30px;text-align:center;">
            <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} EcomStore. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  forgotPassword: (name, resetUrl) => ({
    subject: "Reset Your Password - EcomStore",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#f093fb,#f5576c);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">EcomStore</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Password Reset Request</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#333;margin:0 0 16px;">Hi ${name},</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your EcomStore account password. Click the button below to choose a new password.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}" 
                 style="background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
                Reset My Password
              </a>
            </div>
            <div style="background:#fff8f0;border-left:4px solid #f5576c;padding:16px;border-radius:4px;margin:24px 0;">
              <p style="color:#e04a5f;margin:0;font-size:14px;">
                ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please secure your account immediately.
              </p>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#bbb;font-size:12px;text-align:center;">
              Or copy this link: <br>
              <a href="${resetUrl}" style="color:#f5576c;word-break:break-all;">${resetUrl}</a>
            </p>
          </div>
          <div style="background:#f9f9f9;padding:20px 30px;text-align:center;">
            <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} EcomStore. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderConfirmation: (name, order) => ({
    subject: `Order Confirmed #${order.orderNumber} - EcomStore`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#11998e,#38ef7d);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">✅ Order Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Order #${order.orderNumber}</p>
          </div>
          <div style="padding:40px 30px;">
            <p style="color:#666;line-height:1.6;">Hi <strong>${name}</strong>, your order has been placed successfully!</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:12px;text-align:left;color:#333;">Item</th>
                  <th style="padding:12px;text-align:center;color:#333;">Qty</th>
                  <th style="padding:12px;text-align:right;color:#333;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px;color:#555;">${item.name}</td>
                    <td style="padding:12px;text-align:center;color:#555;">${item.quantity}</td>
                    <td style="padding:12px;text-align:right;color:#555;">৳${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#333;">Total:</td>
                  <td style="padding:12px;text-align:right;font-weight:bold;color:#11998e;font-size:18px;">৳${order.totalPrice.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="background:#f9f9f9;padding:20px 30px;text-align:center;">
            <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} EcomStore. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordChanged: (name) => ({
    subject: "Password Changed Successfully - EcomStore",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color:#333;">Password Changed 🔐</h2>
          <p style="color:#666;">Hi <strong>${name}</strong>,</p>
          <p style="color:#666;line-height:1.6;">Your EcomStore account password was changed successfully. If you did not make this change, please contact support immediately.</p>
          <p style="color:#999;font-size:13px;">Time: ${new Date().toUTCString()}</p>
        </div>
      </body>
      </html>
    `,
  }),
};

const sendEmail = async ({ to, ...template }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: template.subject,
    html: template.html,
  };
  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (user, token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
  const verificationUrl = `${clientUrl}/verify-email/${token}`;
  const template = emailTemplates.verifyEmail(user.name, verificationUrl);
  await sendEmail({ to: user.email, ...template });
};

const sendVerificationCodeEmail = async (user, code) => {
  const template = emailTemplates.verifyEmailCode(user.name, code);
  await sendEmail({ to: user.email, ...template });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const template = emailTemplates.forgotPassword(user.name, resetUrl);
  await sendEmail({ to: user.email, ...template });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const template = emailTemplates.orderConfirmation(user.name, order);
  await sendEmail({ to: user.email, ...template });
};

const sendPasswordChangedEmail = async (user) => {
  const template = emailTemplates.passwordChanged(user.name);
  await sendEmail({ to: user.email, ...template });
};

module.exports = {
  sendVerificationEmail,
  sendVerificationCodeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendPasswordChangedEmail,
};
