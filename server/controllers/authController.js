const User = require('../models/User');
const Institution = require('../models/Institution');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

    await User.create({
      name, email, password: hashedPassword, role: 'student', institutionId
    });

    res.status(201).json({ success: true, message: "Student registered successfully" });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

// 2. REGISTER INSTITUTION
const registerInstitution = async (req, res) => {
  try {
    const { institutionName, adminName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin User
    const newUser = await User.create({
      name: adminName, email, password: hashedPassword, role: 'institution'
    });

    // Create Institution
    const newInstitution = await Institution.create({
      name: institutionName, email, adminId: newUser._id
    });

    // Link User to Institution
    newUser.institutionId = newInstitution._id;
    await newUser.save();

    res.status(201).json({ success: true, message: "Institution registered successfully" });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
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
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // --- DEV HELPER: Log the link to terminal so you can test without emails working ---
    console.log("-----------------------------------------");
    console.log("🔗 PASSWORD RESET LINK (Copy this):");
    console.log(resetUrl);
    console.log("-----------------------------------------");

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following link to reset your password: \n\n ${resetUrl}`;

    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0;">GuardXLens</h1>
          <p style="color: #64748b; font-size: 14px;">Secure Exam Monitoring System</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6;">You are receiving this email because you (or someone else) has requested the reset of a password for your account.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background-color 0.3s ease;">Reset Your Password</a>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">This link will expire in 30 minutes.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>Alternatively, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p>&copy; ${new Date().getFullYear()} GuardXLens. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      // If user hasn't configured email, don't crash, just return success so they can check console
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log("ℹ️ SYSTEM: Email settings not configured properly in .env. Staying in Dev Mode.");
        return res.json({
          success: true,
          message: 'Development Mode: No email sent. Reset link logged to server terminal!'
        });
      }

      console.log(`📧 Attempting to send email to: ${user.email} using ${process.env.EMAIL_USER}...`);

      // Clean the credentials (remove spaces)
      const cleanEmail = process.env.EMAIL_USER.trim();
      const cleanPass = process.env.EMAIL_PASS.replace(/\s/g, '');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: cleanEmail,
          pass: cleanPass,
        },
      });

      const mailOptions = {
        from: `"GuardXLens Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Recovery Request',
        text: message,
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
  loginUser,
  getInstitutions,
  getMyStudents,
  getStudentsByInstitutionId,
  getAllStudents,
  forgotPassword,
  resetPassword,
  createDefaultAdmin
};
