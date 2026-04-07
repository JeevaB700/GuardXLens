const baseStyle = `
  font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #e2e8f0;
  max-width: 600px;
  margin: 0 auto;
  background-color: #0f172a;
  padding: 40px;
  border-radius: 16px;
  border: 1px solid rgba(132, 204, 22, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const headerStyle = `
  text-align: center;
  margin-bottom: 40px;
`;

const logoStyle = `
  color: #84cc16;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
  text-transform: uppercase;
  margin: 0;
`;

const cardStyle = `
  background-color: rgba(30, 41, 59, 0.7);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 30px;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #84cc16;
  color: #000000;
  padding: 14px 32px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  margin: 20px 0;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(132, 204, 22, 0.4);
`;

const footerStyle = `
  text-align: center;
  color: #64748b;
  font-size: 12px;
  margin-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
`;

const wrap = (content) => `
  <div style="background-color: #020617; padding: 40px 0;">
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="${logoStyle}">GuardXLens</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure AI Exam Monitoring</p>
      </div>
      ${content}
      <div style="${footerStyle}">
        <p>You received this email because of your activity on GuardXLens.</p>
        <p>&copy; ${new Date().getFullYear()} GuardXLens Team. All rights reserved.</p>
      </div>
    </div>
  </div>
`;

// 1. Student Welcome
const studentWelcomeTemplate = (name, institutionName) => wrap(`
  <div style="${cardStyle}">
    <h2 style="color: #ffffff; margin-top: 0;">Welcome, ${name}!</h2>
    <p>Your account has been successfully created at <strong>${institutionName}</strong>.</p>
    <p>You are now ready to take secure, AI-monitored exams with GuardXLens.</p>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="${buttonStyle}">Access Your Dashboard</a>
    </div>
  </div>
  <p style="color: #94a3b8; font-size: 14px;">If you have any issues logging in, please contact your institution administrator.</p>
`);

// 2. Institution Notification (New Student)
const institutionStudentNotificationTemplate = (studentName, studentEmail) => wrap(`
  <div style="${cardStyle}">
    <h2 style="color: #ffffff; margin-top: 0;">New Student Enrollment</h2>
    <p>A new student has registered under your institution.</p>
    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Name:</strong> ${studentName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
    </div>
    <p>You can manage this student and assign exams from your dashboard.</p>
    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/institution/dashboard" style="${buttonStyle}">View Dashboard</a>
    </div>
  </div>
`);

// 3. Password Reset
const passwordResetTemplate = (resetUrl) => wrap(`
  <div style="${cardStyle}">
    <h2 style="color: #ffffff; margin-top: 0;">Reset Your Password</h2>
    <p>We received a request to reset the password for your GuardXLens account.</p>
    <p>Click the button below to set a new password. This link is valid for 30 minutes.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
`);

// 4. Admin Approval Request (New Institution)
const institutionApprovalTemplate = (institutionName, adminName, email, approveUrl) => wrap(`
  <div style="${cardStyle}">
    <h2 style="color: #ffffff; margin-top: 0;">New Institution Request</h2>
    <p>A new institution is waiting for your approval to join the platform.</p>
    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Institution:</strong> ${institutionName}</p>
      <p style="margin: 5px 0;"><strong>Admin:</strong> ${adminName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
    </div>
    <div style="text-align: center;">
      <a href="${approveUrl}" style="${buttonStyle}; background-color: #10b981;">Approve Institution</a>
    </div>
  </div>
`);

// 5. Institution Welcome (After Approval)
const institutionWelcomeTemplate = (institutionName, adminName, loginUrl) => wrap(`
  <div style="${cardStyle}">
    <h2 style="color: #ffffff; margin-top: 0;">Welcome to the Future of Exams!</h2>
    <p>Hello ${adminName},</p>
    <p>Your request for <strong>${institutionName}</strong> has been <strong>approved</strong>!</p>
    <p>Your dashboard is now ready. You can start adding students and creating secure assessments immediately.</p>
    <div style="text-align: center;">
      <a href="${loginUrl}" style="${buttonStyle}">Start Using GuardXLens</a>
    </div>
  </div>
`);

module.exports = {
  studentWelcomeTemplate,
  institutionStudentNotificationTemplate,
  passwordResetTemplate,
  institutionApprovalTemplate,
  institutionWelcomeTemplate
};
