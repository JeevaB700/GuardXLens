const User = require('../models/User');
const Institution = require('../models/Institution');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const PendingInstitution = require('../models/PendingInstitution');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ActivityLog = require('../models/ActivityLog');
const {
  studentWelcomeTemplate,
  institutionStudentNotificationTemplate,
  passwordResetTemplate,
  institutionApprovalTemplate,
  institutionWelcomeTemplate,
  institutionRejectionTemplate,
  adminCreatedStudentTemplate
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

// 2. REGISTER INSTITUTION (Sends Request to Admin Dashboard)
const registerInstitution = async (req, res) => {
  try {
    const { institutionName, adminName, email, password } = req.body;

    // Check if email already exists in approved users, approved institutions, or already pending
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already registered in the system." });

    const pendingExists = await PendingInstitution.findOne({ email, status: 'pending' });
    if (pendingExists) return res.status(400).json({ message: "A registration request for this email is already pending approval." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Clear any existing rejected/processed requests for this email to avoid unique constraint errors
    await PendingInstitution.deleteMany({ email, status: { $ne: 'pending' } });

    // Save metadata to DB instead of just a token
    const pendingRequest = await PendingInstitution.create({
      institutionName, adminName, email, password: hashedPassword
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const adminApprovalUrl = `${clientUrl}/admin/approvals`;
    
    // --- DEV HELPER ---
    console.log("-----------------------------------------");
    console.log("🚀 NEW INSTITUTION REQUEST:");
    console.log(`Institution: ${institutionName}`);
    console.log(`Admin Link: ${adminApprovalUrl}`);
    console.log("-----------------------------------------");

    const htmlMessage = institutionApprovalTemplate(institutionName, adminName, email, adminApprovalUrl);

    try {
      const transporter = getTransporter();
      if (!transporter) {
        return res.status(200).json({ 
          success: true, 
          message: "Registration submitted to Admin Dashboard." 
        });
      }

      const mailOptions = {
        from: `"GuardXLens System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Admin Email
        subject: 'New Institution Registration: Approval Required',
        html: htmlMessage,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, message: "Registration request submitted. Admin will review your request shortly." });
    } catch (err) {
      console.error("❌ MAIL FAIL:", err.message);
      res.status(200).json({ success: true, message: "Registration submitted to Dashboard (Email delivery failed)." });
    }
  } catch (error) { 
    console.error("❌ REGISTRATION ERROR:", error);
    res.status(500).json({ message: "Server Error" }); 
  }
};

// 2b. GET PENDING REQUESTS (Admin Only)
const getPendingInstitutions = async (req, res) => {
  try {
    const requests = await PendingInstitution.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (e) { res.status(500).json({ message: "Error fetching requests" }); }
};

// 2c. APPROVE INSTITUTION
const approveInstitution = async (req, res) => {
  try {
    const { id } = req.body; // Approved by ID from dashboard
    const request = await PendingInstitution.findById(id);
    
    if (!request || request.status !== 'pending') {
        return res.status(404).json({ message: "Request not found or already processed" });
    }

    const { institutionName, adminName, email, password } = request;

    // Double check email uniqueness
    const userExists = await User.findOne({ email });
    if (userExists) {
      request.status = 'rejected';
      await request.save();
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Create Admin User
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

    // Mark as approved
    request.status = 'approved';
    await request.save();

    // Send Welcome Email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${clientUrl}/login`;
    
    try {
      const transporter = getTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: `"GuardXLens Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Institution account is Approved!',
          html: institutionWelcomeTemplate(institutionName, adminName, loginUrl),
        });
      }
    } catch (err) { console.error("Welcome email failed"); }

    res.json({ success: true, message: `${institutionName} has been approved.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Approval process failed." });
  }
};

// 2d. REJECT INSTITUTION
const rejectInstitution = async (req, res) => {
  try {
    const { id } = req.body;
    const request = await PendingInstitution.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = 'rejected';
    await request.save();

    // Send Rejection Email
    try {
        const transporter = getTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: `"GuardXLens Admin" <${process.env.EMAIL_USER}>`,
                to: request.email,
                subject: 'Update on your Institution Registration',
                html: institutionRejectionTemplate(request.institutionName, request.adminName),
            });
        }
    } catch (err) { console.error("Rejection email failed"); }

    res.json({ success: true, message: "Institution request rejected." });
  } catch (e) { res.status(500).json({ message: "Reject failed" }); }
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

// 11. DELETE STUDENT (Admin/Institution Only)
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete Results
    await Result.deleteMany({ studentId: id });
    // 2. Delete Activity Logs
    await ActivityLog.deleteMany({ studentId: id });
    // 3. Delete User
    await User.findByIdAndDelete(id);

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (e) { res.status(500).json({ message: "Delete failed" }); }
};

// 12. DELETE INSTITUTION (Super Admin Only)
const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findById(id);
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    // 1. Find all exams belonging to this institution
    const exams = await Exam.find({ institutionId: id });
    const examIds = exams.map(ex => ex._id);

    // 2. Delete all results associated with these exams
    await Result.deleteMany({ examId: { $in: examIds } });
    
    // 3. Delete all activity logs associated with these exams
    await ActivityLog.deleteMany({ examId: { $in: examIds } });

    // 4. Delete all exams
    await Exam.deleteMany({ institutionId: id });

    // 5. Find and Delete all students belonging to this institution
    // This catches students and the institution admin user
    await Result.deleteMany({ studentId: { $in: await User.find({ institutionId: id }).select('_id') } });
    await ActivityLog.deleteMany({ studentId: { $in: await User.find({ institutionId: id }).select('_id') } });
    await User.deleteMany({ institutionId: id });

    // 6. Delete the institution itself
    await Institution.findByIdAndDelete(id);

    res.json({ success: true, message: `Institution and all associated data deleted successfully.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to delete institution and associated data." });
  }
};

// 13. ADMIN CREATE STUDENT (Manual creation by Admin)
const adminCreateStudent = async (req, res) => {
    try {
        const { name, email, password, institutionId } = req.body;
        
        // Find institution
        const institution = await Institution.findById(institutionId);
        if (!institution) return res.status(404).json({ message: "Institution not found" });

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = await User.create({
            name, email, password: hashedPassword, role: 'student', institutionId
        });

        // Send Welcome Email with Credentials
        try {
            const transporter = getTransporter();
            if (transporter) {
                await transporter.sendMail({
                    from: `"GuardXLens Admin" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Your Account is Ready - GuardXLens',
                    html: adminCreatedStudentTemplate(name, institution.name, email, password),
                });
            }
        } catch (err) { console.error("Admin student welcome email failed"); }

        res.status(201).json({ success: true, student });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Account creation failed" });
    }
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
  createDefaultAdmin,
  getPendingInstitutions,
  approveInstitution,
  rejectInstitution,
  deleteStudent,
  deleteInstitution,
  adminCreateStudent
};
