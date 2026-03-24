const axios = require('axios');
const Exam = require('../models/Exam');

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  console.log(`\n--- Executing ${language} for Q: ${questionId} ---`);

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    console.log(`Found ${testCases.length} test cases.`);

    const languageMap = {
      'java': { language: 'java' },
      'python': { language: 'py' },
      'c': { language: 'c' },
      'cpp': { language: 'cpp' },
    };

    const config = languageMap[language.toLowerCase()];
    if (!config) {
        return res.json({ results: [{ status: "Error", message: "Language not supported." }] });
    }

    const results = [];

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();

      try {
        const response = await axios.post('https://api.codex.jaagrav.in/', {
          language: config.language,
          code: sourceCode,
          input: input,
        });

        // CodeX returns { status: 200, output: "...", error: "...", ... }
        const actualOutput = (response.data.output || "").trim();
        const errorOutput = (response.data.error || "").trim();
        
        console.log(`Actual: ${JSON.stringify(actualOutput)}`);
        if (errorOutput) console.log(`Error: ${JSON.stringify(errorOutput)}`);

        if (errorOutput) {
            results.push({
                caseId: index + 1,
                status: "Runtime Error",
                expected: expectedOutput,
                actual: errorOutput
            });
            continue;
        }

        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });

      } catch (err) {
        console.error("CodeX/Network Error:", err.message);
        if (err.response) {
            console.error("CodeX Response Error Data:", err.response.data);
        }
        results.push({ 
            caseId: index + 1, 
            status: "Runtime Error", 
            expected: expectedOutput,
            actual: err.message 
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