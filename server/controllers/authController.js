const User = require('../models/User');
const Institution = require('../models/Institution');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  studentWelcomeTemplate,
  institutionStudentNotificationTemplate,
  passwordResetTemplate,
  institutionApprovalTemplate,
  institutionWelcomeTemplate
} = require('../utils/emailTemplates');

// Helper to get transporter
const getTransporter = () => {
  const cleanEmail = process.env.EMAIL_USER?.trim();
  const cleanPass = process.env.EMAIL_PASS?.replace(/\s/g, '');

  if (!cleanEmail || !cleanPass || cleanEmail === 'your-email@gmail.com') {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cleanEmail, pass: cleanPass },
  });
};

// 1. REGISTER STUDENT
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, institutionId } = req.body;

    if (!institutionId) {
      return res.status(400).json({ message: "Institution is required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await User.create({
      name, email, password: hashedPassword, role: 'student', institutionId
    });

    // --- SEND EMAILS ---
    try {
      const institution = await Institution.findById(institutionId);
      const transporter = getTransporter();

      if (transporter && institution) {
        // 1. To Student
        await transporter.sendMail({
          from: `"GuardXLens" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Welcome to GuardXLens!',
          html: studentWelcomeTemplate(name, institution.name)
        });

        // 2. To Institution
        await transporter.sendMail({
          from: `"GuardXLens System" <${process.env.EMAIL_USER}>`,
          to: institution.email,
          subject: 'New Student Registration',
          html: institutionStudentNotificationTemplate(name, email)
        });
        console.log(`✅ Registration emails sent for ${email}`);
      } else {
        console.log("ℹ️ Dev Mode: Emails skipped (Not configured or Institution not found)");
      }
    } catch (mailErr) {
      console.error("❌ Registration Email Error:", mailErr.message);
    }

    res.status(201).json({ success: true, message: "Student registered successfully. Welcome email sent!" });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Server Error" }); 
  }
};

// 2. REGISTER INSTITUTION (Sends Request to Admin)
const registerInstitution = async (req, res) => {
  try {
    const { institutionName, adminName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already registered in the system." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a temporary registration token instead of saving to DB
    const registrationToken = jwt.sign(
      { institutionName, adminName, email, password: hashedPassword },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Link valid for 7 days
    );

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const approveUrl = `${serverUrl}/api/auth/approve-institution?token=${registrationToken}`;
    
    // --- DEV HELPER: Log the link to terminal so you can test without emails working ---
    console.log("-----------------------------------------");
    console.log("🔗 INSTITUTION APPROVAL LINK (Admin Only):");
    console.log(approveUrl);
    console.log("-----------------------------------------");

    const htmlMessage = institutionApprovalTemplate(institutionName, adminName, email, approveUrl);

    try {
      const transporter = getTransporter();
      if (!transporter) {
        console.log("ℹ️ SYSTEM: Email not configured fully. Staying in Dev Mode.");
        return res.status(200).json({ 
          success: true, 
          message: "Registration submitted (Dev Mode: Check Server Console for approval link)" 
        });
      }

      const mailOptions = {
        from: `"GuardXLens Admin System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send TO the admin themselves
        subject: 'Action Required: New Institution Registration',
        html: htmlMessage,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Approval email sent to Admin.");
      res.status(200).json({ success: true, message: "Registration request sent to Admin for approval. You will receive an email once approved." });
    } catch (err) {
      console.error("❌ EMAIL ERROR:", err.message);
      res.status(200).json({ success: true, message: "Registration submitted, but backend email failed. Admin link logged in console." });
    }
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

// 2b. APPROVE INSTITUTION
const approveInstitution = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("No approval token provided.");

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).send("<h2>Token invalid or expired.</h2><p>The registration request may have timed out.</p>");
    }

    const { institutionName, adminName, email, password } = decoded;

    // Check if user already got created (admin clicked link twice)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send("<h2>Institution already approved!</h2><p>This institution is already active in the system.</p>");
    }

    // Create Admin User using the hashed password from the token
    const newUser = await User.create({
      name: adminName, email, password, role: 'institution'
    });

    // Create Institution
    const newInstitution = await Institution.create({
      name: institutionName, email, adminId: newUser._id
    });

    // Link User to Institution
    newUser.institutionId = newInstitution._id;
    await newUser.save();

    // Send Welcome Email to the Institution
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${clientUrl}/login`;
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0;">Welcome to GuardXLens!</h2>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px;">
          <p>Hello <strong>${adminName}</strong>,</p>
          <p>Great news! Your registration request for <strong>${institutionName}</strong> has been <strong>approved</strong> by the administrator.</p>
          <p>You can now log in to your dashboard and start managing your secure exams and students.</p>
        </div>
        <div style="margin-top: 35px; text-align: center;">
          <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to GuardXLens</a>
        </div>
      </div>
    `;

    try {
      const transporter = getTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: `"GuardXLens Admin" <${process.env.EMAIL_USER}>`,
          to: email, // Send to the newly approved institution
          subject: 'GuardXLens Account Approved!',
          html: institutionWelcomeTemplate(institutionName, adminName, loginUrl),
        });
        console.log(`✅ Welcome approval email sent to ${email}`);
      }
    } catch (err) {
      console.error("❌ Failed to send welcome email:", err.message);
    }

    // Response page for Admin (HTML)
    res.status(200).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 80px; padding: 20px;">
        <div style="font-size: 64px; color: #22c55e; margin-bottom: 20px;">✅</div>
        <h1 style="color: #1e293b;">Institution Approved Successfully!</h1>
        <p style="color: #475569; font-size: 18px;"><strong>${institutionName}</strong> has been added to GuardXLens.</p>
        <p style="color: #64748b; margin-top: 10px;">A welcome email has been sent to exactly <strong>${email}</strong>.</p>
        <div style="margin-top: 40px; color: #94a3b8; font-size: 14px;">
          <p>You may safely close this window.</p>
        </div>
      </div>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error during approval.");
  }
};

// 3. LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, institutionId: user.institutionId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, institutionId: user.institutionId }
    });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

// 4. GET INSTITUTIONS (For Dropdowns)
const getInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find().select('name _id email');
    res.json({ success: true, institutions });
  } catch (e) { res.status(500).json({ message: "Error" }); }
};

// 5. GET MY STUDENTS (For Institution Dashboard)
const getMyStudents = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) return res.status(400).json({ message: "No institution ID" });

    const students = await User.find({ role: 'student', institutionId }).select('-password');
    res.json({ success: true, students });
  } catch (e) { res.status(500).json({ message: "Server Error" }); }
};

// 6. GET STUDENTS BY INSTITUTION ID (For Admin Hierarchy)
const getStudentsByInstitutionId = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const students = await User.find({ role: 'student', institutionId }).select('-password');
    res.json({ success: true, students });
  } catch (e) { res.status(500).json({ message: "Error fetching students" }); }
};

// 7. GET ALL STUDENTS (For Admin Stats)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json({ success: true, results: students });
  } catch (e) { res.status(500).json({ message: "Error" }); }
};

// 8. FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "No user found with that email" });

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash and set resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire (30 minutes)
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    await user.save();

    // Create reset url
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // --- DEV HELPER: Log the link to terminal so you can test without emails working ---
    console.log("-----------------------------------------");
    console.log("🔗 PASSWORD RESET LINK (Copy this):");
    console.log(resetUrl);
    console.log("-----------------------------------------");

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following link to reset your password: \n\n ${resetUrl}`;

    const htmlMessage = passwordResetTemplate(resetUrl);

    try {
      const transporter = getTransporter();
      if (!transporter) {
        console.log("ℹ️ SYSTEM: Email settings not configured properly in .env. Staying in Dev Mode.");
        return res.json({
          success: true,
          message: 'Development Mode: No email sent. Reset link logged to server terminal!'
        });
      }

      console.log(`📧 Attempting to send email to: ${user.email} using ${process.env.EMAIL_USER}...`);

      const mailOptions = {
        from: `"GuardXLens Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Recovery Request',
        html: htmlMessage,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully to:", user.email);
      res.json({ success: true, message: 'Email sent successfully' });

    } catch (err) {
      console.error("❌ EMAIL ERROR:", err.message);
      // Fallback: Still tell them about the console link if it's a dev error
      res.json({
        success: true,
        message: 'Email failed to send, but the link was logged to the server terminal for testing.'
      });
    }

  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

// 9. RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

// 10. DEFAULT SUPER ADMIN
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      name: "Super Admin", email: "admin@guardxlens.com", password: hashedPassword, role: "admin"
    });
    console.log("✅ Super Admin Created");
  } catch (error) { console.error("Error creating admin:", error); }
};

module.exports = {
  registerStudent,
  registerInstitution,
  approveInstitution,
  loginUser,
  getInstitutions,
  getMyStudents,
  getStudentsByInstitutionId,
  getAllStudents,
  forgotPassword,
  resetPassword,
  createDefaultAdmin
};
