const axios = require('axios');
const Exam = require('../models/Exam');

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  
  // LOGS: Helping you debug the execution
  console.log(`\n--- JDoodle Execution (${language}) for Q: ${questionId} ---`);

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    console.log(`Found ${testCases.length} test cases.`);

    // Mapping for JDoodle (Single Stable Engine)
    const jdoodleMap = {
      'java': 'java',
      'python': 'python3',
      'c': 'c',
      'cpp': 'cpp',
    };

    const results = [];

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();

      try {
        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
          clientId: process.env.JDOODLE_CLIENT_ID,
          clientSecret: process.env.JDOODLE_CLIENT_SECRET,
          script: sourceCode,
          language: jdoodleMap[language.toLowerCase()] || 'python3',
          versionIndex: "0",
          stdin: input
        }, { timeout: 15000 }); // 15s timeout for JDoodle

        const actualOutput = (response.data.output || "").trim();
        const statusCode = response.data.statusCode;

        console.log(`Case ${index + 1} Status: ${statusCode}`);
        console.log(`Output: ${JSON.stringify(actualOutput)}`);

        // Check if JDoodle returned an internal error (e.g. rate limit, auth)
        if (statusCode === 401 || statusCode === 429) {
           throw new Error(`JDoodle API Error: ${statusCode}. Please check API keys or credits.`);
        }

        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });

      } catch (err) {
        console.error(`JDoodle Case ${index + 1} Failed:`, err.message);
        results.push({ 
            caseId: index + 1, 
            status: "Runtime Error", 
            expected: expectedOutput,
            actual: err.message
        });
      }
    }

    console.log("--- JDoodle Execution Finished ---\n");
    res.json({ results });

  } catch (error) {
    console.error("Global Execution Error:", error);
    res.status(500).json({ message: "Execution system failed" });
  }
};

module.exports = { executeCode };