const path = require('path'); // Added for extension checking
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const PDFParser = require("pdf2json");
const mammoth = require("mammoth"); // Added for DOCX
const Groq = require("groq-sdk");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: Extract JSON from AI response
const extractJSON = (text) => {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;
    if (start === -1 || end === 0) return null;
    return JSON.parse(text.substring(start, end));
  } catch (e) {
    return null;
  }
};

// Helper: Parse PDF (Updated for memory storage)
const parsePDF = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      const rawText = pdfParser.getRawTextContent();
      resolve(rawText);
    });
    pdfParser.parseBuffer(buffer);
  });
};

// Helper: Parse DOCX (Updated for memory storage)
const parseDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
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
        extractedText = await parsePDF(req.file.buffer);
      } else if (fileExt === '.docx') {
        extractedText = await parseDOCX(req.file.buffer);
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

    // 2. Send to AI (Groq - llama-3.1-8b-instant)
    const prompt = `
      You are an expert exam extractor. Your task is to extract questions from the provided document text exactly as they are written.
      
      STARK JSON FORMAT RULES:
      Return a JSON array of objects with these fields:
      1. "questionText" (String): The text of the question. 
         - DO NOT include options (A,B,C,D) or correct answers in this field.
      2. "type" (String): "MCQ", "SHORT", or "CODE".
      3. "options" (Array of 4 Strings): Required for MCQ only.
      4. "correctAnswers" (Array of Strings): Required for MCQ only.
         - Find the correct answer in the text (often marked as "Ans.", "Answer:", "Key:", etc.).
         - This field MUST contain the FULL TEXT of the corresponding option, NOT just the letter.
         - Example: If the text says "b) Big Data" and "Ans. b", then correctAnswers should be ["Big Data"].
      5. "marks" (Number): Default is 5.
      6. "allowedLanguages" (Array): Required for CODE only.
      7. "testCases" (Array): Required for CODE only.

      STRICT EXTRACTION CONSTRAINTS:
      - ONLY extract questions that are explicitly present in the document.
      - DO NOT generate, create, or invent any new questions. 
      - If there are 10 questions in the text, extract exactly 10.
      - DO NOT add conversational text. Return ONLY the JSON array.
      - For SHORT questions: Extract only the question line. If an answer follows it, IGNORE the answer.
      - **SPACING FIX**: If the input text has missing spaces (e.g., "Ciswhatkindoflanguage"), you MUST correctly restore the spaces in "questionText" and "options" (e.g., "C is what kind of language").

      DOCUMENT TEXT TO PROCESS:
      ${extractedText.substring(0, 30000)}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    let text = chatCompletion.choices[0].message.content;
    let questions = extractJSON(text);

    if (!questions) {
      console.error("AI JSON Parse Error. Raw text:", text);
      return res.status(500).json({ message: "AI generation failed to produce valid question format." });
    }

    res.json({ success: true, questions });

  } catch (error) {
    console.error("Extraction Error:", error);
    res.status(500).json({ message: "Failed to process document" });
  }
};

// 2. SAVE EXAM
const saveExam = async (req, res) => {
  try {
    const { title, subject, duration, questions, startTime, endTime, passMarks, cameraMonitoring } = req.body;
    const institutionId = req.user.institutionId;

    const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

    const newExam = new Exam({
      title, subject, duration, questions, totalMarks,
      startTime, endTime, passMarks,
      cameraMonitoring: cameraMonitoring !== undefined ? cameraMonitoring : true,
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

    const exams = await Exam.find(query).select('title subject duration totalMarks startTime endTime passMarks createdAt questions').sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams" });
  }
};

// 4. GET ALL EXAMS (Student Dashboard - Filtered by Institution & Untaken)
const getAllExams = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const institutionId = req.user.institutionId;

    // Filter exams by the student's institution
    let query = institutionId ? { institutionId } : {};

    // Find all exams the student has already taken
    const takenResults = await Result.find({ studentId }).select('examId');
    const takenExamIds = takenResults.map(r => r.examId.toString());

    // Fetch exams
    const exams = await Exam.find(query)
      .select('title subject duration totalMarks startTime endTime passMarks createdAt')
      .sort({ createdAt: -1 })
      .lean(); // Use lean to add properties easily

    // Map to include hasAttempted flag
    const mappedExams = exams.map(exam => ({
      ...exam,
      hasAttempted: takenExamIds.includes(exam._id.toString())
    }));

    res.json({ success: true, exams: mappedExams });
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
    const { title, subject, duration, questions, startTime, endTime, passMarks, cameraMonitoring } = req.body;

    const totalMarks = questions ? questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0) : undefined;
    
    let updateFields = { title, subject, duration };
    if (questions) {
      updateFields.questions = questions;
      updateFields.totalMarks = totalMarks;
    }
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (passMarks !== undefined) updateFields.passMarks = passMarks;
    if (cameraMonitoring !== undefined) updateFields.cameraMonitoring = cameraMonitoring;

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      updateFields,
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
    const { examId, answers, codingResults, studentId, isMalpractice, violationCount, violationLogs, startedAt } = req.body;
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
        
        if (q.type === 'SHORT' && ans && ans.length > 0) {
          correct = true;
        }

        if (q.type === 'CODE') {
          // Check if there are results for this coding question
          const results = codingResults ? codingResults[q._id.toString()] : null;
          if (results && results.length > 0) {
            const passedCount = results.filter(r => r.status === 'Passed').length;
            // Rule: 0 marks if no testcases passed
            if (passedCount > 0) {
              correct = true;
            }
          }
        }

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
      isMalpractice: isMalpractice || false,
      violationCount: violationCount || 0,
      violationLogs: violationLogs || [],
      startedAt: startedAt || null
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
    // Use llama-4-scout-17b-16e-instruct for test case generation
    const prompt = `
      You are a strict Competitive Programming Judge. 
      Generate 3 test cases for this coding problem: "${questionText}".
      
      Rules:
      1. Input must be RAW DATA ONLY (e.g., "5 10").
      2. Output must be RAW DATA ONLY (e.g., "15").
      3. Return ONLY a valid JSON Array. No labels, no preamble, no markdown.
      
      Format: 
      [{"input": "input1", "output": "output1"}, {"input": "input2", "output": "output2"}]
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
    });

    const text = chatCompletion.choices[0].message.content;
    let testCases = extractJSON(text);

    if (!testCases) {
      // Fallback: If AI fails JSON, return a dummy case so the UI doesn't break
      testCases = [{ input: "5", output: "Please provide valid question." }];
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

// 11. GET RESULTS BY EXAM (Institution Specific Exam View)
const getResultsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ examId })
      .populate({ path: 'studentId', select: 'name email institutionId', populate: { path: 'institutionId', select: 'name' } })
      .populate('examId', 'title passMarks totalMarks startTime endTime')
      .sort({ submittedAt: -1 });
    res.json({ success: true, results });
  } catch (e) { res.status(500).json({ message: "Error" }); }
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
  deleteExam,
  getResultsByExam
};