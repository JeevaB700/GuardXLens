const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Exam = require('../models/Exam');

// Initialize Gemini (for Fallback)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  console.log(`\n--- Robust Execution (${language}) for Q: ${questionId} ---`);

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    console.log(`Found ${testCases.length} test cases.`);

    // Mapping for Judge0 (Fast Real Compiler)
    const judge0Map = {
      'java': 62,
      'python': 71,
      'c': 50,
      'cpp': 54,
    };

    const results = [];

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();
      let actualOutput = "";
      let executionError = "";

      // --- STRATEGY 1: TRY JUDGE0 PUBLIC (Fast) ---
      try {
        const j0Response = await axios.post('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
          source_code: sourceCode,
          language_id: judge0Map[language.toLowerCase()] || 71,
          stdin: input
        }, { timeout: 5000 });

        actualOutput = (j0Response.data.stdout || "").trim();
        executionError = (j0Response.data.stderr || j0Response.data.compile_output || "").trim();
      } catch (err) {
        console.error("Judge0 Strategy Failed, trying Gemini Fallback...");
        
        // --- STRATEGY 2: GEMINI FALLBACK (Reliable) ---
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `
            ACT AS A CODE COMPILER/INTERPRETER.
            Language: ${language}
            Code:
            ${sourceCode}
            Input:
            ${input}
            Return ONLY RAW stdout. If it crashes, return ERROR: + reason.
          `;
          const result = await model.generateContent(prompt);
          const raw = result.response.text().trim();
          if (raw.startsWith("ERROR:")) executionError = raw.replace("ERROR:", "").trim();
          else actualOutput = raw;
        } catch (geminiErr) {
          executionError = "All execution engines are currently down.";
        }
      }

      if (executionError) {
        results.push({
            caseId: index + 1,
            status: "Runtime Error",
            expected: expectedOutput,
            actual: executionError
        });
      } else {
        const passed = actualOutput === expectedOutput;
        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });
      }
    }

    console.log("--- Execution Finished ---\n");
    res.json({ results });

  } catch (error) {
    console.error("Global Execution Error:", error);
    res.status(500).json({ message: "Execution failed" });
  }
};

module.exports = { executeCode };