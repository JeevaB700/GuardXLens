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
      'java': { language: 'java', version: '15.0.2' },
      'python': { language: 'python', version: '3.10.0' },
      'c': { language: 'c', version: '10.2.0' },
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

      console.log(`\nTest Case ${index + 1}:`);
      console.log(`Input: ${JSON.stringify(input)}`);
      console.log(`Expected: ${JSON.stringify(expectedOutput)}`);

      try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language: config.language,
          version: config.version,
          files: [{ content: sourceCode }],
          stdin: input, 
        }, {
          headers: { 'User-Agent': 'GuardXLens' }
        });

        // 1. CHECK FOR COMPILATION ERROR
        if (response.data.compile && response.data.compile.code !== 0) {
             console.log("❌ Compilation Failed");
             results.push({
                caseId: index + 1,
                status: "Compilation Error",
                expected: expectedOutput,
                actual: response.data.compile.stderr || response.data.compile.stdout
             });
             continue; 
        }

        // 2. CHECK RUN OUTPUT
        const rawOutput = response.data.run.stdout || response.data.run.stderr || "";
        const actualOutput = rawOutput.trim();
        
        console.log(`Actual: ${JSON.stringify(actualOutput)}`);

        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });

      } catch (err) {
        console.error("Piston/Network Error:", err.message);
        if (err.response) {
            console.error("Piston Response Error Data:", err.response.data);
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