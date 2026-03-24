const axios = require('axios');
const Exam = require('../models/Exam');

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  console.log(`\n--- Real Execution (${language}) for Q: ${questionId} ---`);

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    console.log(`Found ${testCases.length} test cases.`);

    const results = [];

    // Language mapping for Piston
    const languageMap = {
      'java': { language: 'java', version: '15.0.2' },
      'python': { language: 'python', version: '3.10.0' },
      'c': { language: 'c', version: '10.2.0' },
      'cpp': { language: 'cpp', version: '10.2.0' },
    };

    const config = languageMap[language.toLowerCase()];
    if (!config) {
        return res.json({ results: [{ status: "Error", message: "Language not supported." }] });
    }

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();

      try {
        // --- TRY MIRROR 1: PISTON CLOUDFLARE MIRROR (Fast & No Key) ---
        const response = await axios.post('https://piston.engineer-man.workers.dev/api/v2/execute', {
          language: config.language,
          version: config.version,
          files: [{ content: sourceCode }],
          stdin: input, 
        }, { timeout: 10000 });

        const rawOutput = response.data.run.stdout || response.data.run.stderr || "";
        const actualOutput = rawOutput.trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });

      } catch (err) {
        console.error("Mirror 1 Failed:", err.message);
        // Fallback or show error
        results.push({ 
            caseId: index + 1, 
            status: "Runtime Error", 
            expected: expectedOutput,
            actual: "Execution Mirror Timeout or Blocked. Please try again." 
        });
      }
    }

    console.log("--- Execution Finished ---\n");
    res.json({ results });

  } catch (error) {
    console.error("Execution Controller Error:", error);
    res.status(500).json({ message: "Server execution failed" });
  }
};

module.exports = { executeCode };