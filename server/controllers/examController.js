const fs = require('fs');
const path = require('path'); // Added for extension checking
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const PDFParser = require("pdf2json");
const mammoth = require("mammoth"); // Added for DOCX
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: Parse PDF
const parsePDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const rawText = pdfParser.getRawTextContent();
      resolve(rawText);
    });
    pdfParser.loadPDF(filePath);
  });
};

// Helper: Parse DOCX (New)
const parseDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value; // The raw text
  } catch (error) {
    throw new Error("Failed to parse DOCX file");
  }
};

// 1. EXTRACT QUESTIONS (AI)
const extractQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let extractedText = "";
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // 1. Detect File Type & Extract Text
    try {
      if (fileExt === '.pdf') {
        extractedText = await parsePDF(req.file.path);
      } else if (fileExt === '.docx') {
        extractedText = await parseDOCX(req.file.path);
      } else {
        return res.status(400).json({ message: "Unsupported file type. Please upload PDF or DOCX." });
      }
    } catch (parseError) {
      console.error("File Parse Error:", parseError);
      return res.status(500).json({ message: "Failed to read document file." });
    }

    if (!extractedText || extractedText.length < 50) {
      return res.status(400).json({ message: "Document appears empty or unreadable." });
    }

    // 2. Send to AI
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Updated prompt to be more robust for different text formats
    const prompt = `
      You are an exam creator. Extract questions from the text below and return them as a JSON array.
      
      Strict Rules:
      1. Return ONLY valid JSON. Do not wrap in markdown (no \`\`\`json).
      2. Format: 
      [
        { 
          "questionText": "Question here...", 
          "type": "MCQ" | "SHORT" | "CODE", 
          "options": ["A","B","C","D"], // Required for MCQ only
          "correctAnswers": ["Selected Option Text"], // Required for MCQ only. Can have multiple strings for Multiple Choice Questions.
          "marks": 5, 
          "allowedLanguages": ["java", "python", "c"], // Required for CODE only
          "testCases": [{"input":"1 2", "output":"3"}] // Required for CODE only
        }
      ]
      3. For 'correctAnswers', use the full text of the options, not just the letter. Always return an array even for single answers.
      
      Document Text: 
      ${extractedText.substring(0, 30000)}
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean AI response (remove markdown if AI ignores rule)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (e) {
      console.error("AI JSON Parse Error. Raw text:", text);
      return res.status(500).json({ message: "AI generation failed. Please try a cleaner document." });
    }

    // Cleanup uploaded file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ success: true, questions });

  } catch (error) {
    console.error("Extraction Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Failed to process document" });
  }
};

// 2. SAVE EXAM
const saveExam = async (req, res) => {
  try {
    const { title, subject, duration, questions } = req.body;
    const institutionId = req.user.institutionId;

    const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

    const newExam = new Exam({
      title, subject, duration, questions, totalMarks,
      institutionId: institutionId || null
    });

    await newExam.save();
    res.status(201).json({ success: true, message: "Exam created!", examId: newExam._id });
  } catch (error) {
    res.status(500).json({ message: "Failed to save exam" });
  }
};

// 3. GET EXAMS (Institution Dashboard)
const getExamsByInstitution = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const query = req.user.role === 'admin' ? {} : { institutionId };

    const exams = await Exam.find(query).select('title subject duration totalMarks createdAt questions').sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams" });
  }
};

// 4. GET ALL EXAMS (Student Dashboard - Filtered by Institution)
const getAllExams = async (req, res) => {
  try {
    const { institutionId } = req.user;

    // Filter exams by the student's institution
    const query = institutionId ? { institutionId } : {};

    const exams = await Exam.find(query).select('-questions');
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching student exams" });
  }
};

// 5. GET SINGLE EXAM (Take Exam / Review Result)
const getExamForStudent = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Aggregate statistics for this exam
    const results = await Result.find({ examId: req.params.id, isMalpractice: false });
    let stats = { average: 0, highest: 0, lowest: 0, count: results.length };

    if (results.length > 0) {
      const scores = results.map(r => r.score);
      stats.average = Math.round(scores.reduce((a, b) => a + b, 0) / results.length);
      stats.highest = Math.max(...scores);
      stats.lowest = Math.min(...scores);
    }

    res.json({ success: true, exam, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error loading exam" });
  }
};

// 6. UPDATE EXAM (Edit Functionality)
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, duration, questions } = req.body;

    const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { title, subject, duration, questions, totalMarks },
      { new: true }
    );

    if (!updatedExam) return res.status(404).json({ message: "Exam not found" });
    res.json({ success: true, message: "Exam updated" });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

// 7. SUBMIT EXAM
const submitExam = async (req, res) => {
  try {
    const { examId, answers, studentId, isMalpractice } = req.body;
    const exam = await Exam.findById(examId);

    let totalScore = 0;
    const gradedAnswers = [];

    if (!isMalpractice && exam) {
      exam.questions.forEach(q => {
        const ans = answers[q._id.toString()];
        let correct = false;
        let marks = 0;

        if (q.type === 'MCQ') {
          // Flatten student answers if they are in an array (for multi-select) or single string
          const studentAns = Array.isArray(ans) ? ans : [ans];
          const correctAns = q.correctAnswers || [];

          // Check if every correct answer is selected AND no extra answers are selected
          if (studentAns.length === correctAns.length &&
            studentAns.every(val => correctAns.includes(val))) {
            correct = true;
          }
        }
        if ((q.type === 'CODE' || q.type === 'SHORT') && ans && ans.length > 0) correct = true;

        if (correct) {
          marks = q.marks;
          totalScore += marks;
        }
        gradedAnswers.push({ questionId: q._id, submittedAnswer: ans, isCorrect: correct, marksAwarded: marks });
      });
    }

    const newResult = new Result({
      examId,
      studentId,
      answers: gradedAnswers,
      score: isMalpractice ? 0 : totalScore,
      totalMarks: exam ? exam.totalMarks : 0,
      isMalpractice: isMalpractice || false
    });

    await newResult.save();
    res.json({ success: true, score: newResult.score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Submit failed" });
  }
};

// 8. GET RESULTS
const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate('examId', 'title subject totalMarks')
      .sort({ submittedAt: -1 });
    res.json({ success: true, results });
  } catch (e) { res.status(500).json({ message: "Error" }); }
};

// 9. GENERATE TEST CASES (UPDATED: STRICTER PROMPT)
const generateTestCases = async (req, res) => {
  const { questionText } = req.body;
  if (!questionText) return res.status(400).json({ message: "Question text required" });

  try {
    // Use gemini-1.5-flash for speed and logic
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are a strict Competitive Programming Judge. 
      Generate 3 test cases for this coding problem: "${questionText}".
      
      CRITICAL RULES FOR INPUT/OUTPUT:
      1. Input must be RAW DATA ONLY. Do not use sentences like "The numbers are..." or "Input is...".
      2. If the problem asks for numbers, provide ONLY space-separated numbers (e.g., "5 10 2").
      3. Output must be RAW DATA ONLY. No labels like "Sum = ".
      4. Return ONLY a valid JSON Array. No Markdown.
      
      Example Format: 
      [{"input": "5 10 2", "output": "17"}, {"input": "1 1 1", "output": "3"}]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    let testCases = [];
    try {
      testCases = JSON.parse(text);
    } catch (parseError) {
      // Fallback: If AI fails JSON, return a dummy case so the UI doesn't break
      testCases = [{ input: "Sample Input", output: "Sample Output" }];
    }

    res.json({ success: true, testCases });

  } catch (e) {
    console.error("Test Case Gen Error:", e);
    res.status(500).json({ message: "Failed to generate test cases" });
  }
};

const getAllStudentResults = async (req, res) => {
  try {
    const results = await Result.find().populate('examId').populate('studentId');
    res.json({ success: true, results });
  } catch (e) { res.status(500).json({ message: "Error" }); }
};

// 10. DELETE EXAM
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Optional: Delete associated results
    await Result.deleteMany({ examId: id });

    res.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  extractQuestions,
  saveExam,
  getAllExams,
  getExamsByInstitution,
  getExamForStudent,
  updateExam,
  submitExam,
  getStudentResults,
  getAllStudentResults,
  generateTestCases,
  deleteExam
};