const axios = require('axios');
const Exam = require('../models/Exam');

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  
  console.log(`\n--- JDoodle Execution (${language}) for Q: ${questionId} ---`);
  
  // Debug: Check if env vars are loaded
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId.includes('your_jdoodle')) {
    console.error("❌ JDoodle Credentials MISSING or NOT CONFIGURED in .env");
    return res.status(500).json({ message: "JDoodle credentials not configured. Please check .env file." });
  } else {
    console.log(`✅ JDoodle Credentials Found (ID: ${clientId.substring(0, 4)}...${clientId.slice(-4)})`);
  }

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    // JDoodle Language Mapping
    const jdoodleMap = {
      'java': { language: 'java', versionIndex: '4' }, // Java 11
      'python': { language: 'python3', versionIndex: '4' }, // Python 3
      'c': { language: 'c', versionIndex: '5' }, // GCC 11.1.0
      'cpp': { language: 'cpp', versionIndex: '5' }, // GCC 11.1.0
    };

    const results = [];

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();

      try {
        const langConfig = jdoodleMap[language.toLowerCase()] || jdoodleMap['python'];
        
        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
          clientId: process.env.JDOODLE_CLIENT_ID,
          clientSecret: process.env.JDOODLE_CLIENT_SECRET,
          script: sourceCode,
          stdin: input,
          language: langConfig.language,
          versionIndex: langConfig.versionIndex
        }, { timeout: 15000 });

        const actualOutput = (response.data.output || "").trim();
        const cpuTime = response.data.cpuTime;
        const memory = response.data.memory;

        console.log(`Case ${index + 1} Output: ${JSON.stringify(actualOutput)}`);
        
        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
          cpuTime,
          memory
        });

      } catch (err) {
        if (err.response) {
          console.error(`❌ JDoodle Case ${index + 1} API Error:`, err.response.status, err.response.data);
          const errorMsg = err.response.data?.error || err.response.data?.message || "JDoodle API Error";
          results.push({ 
              caseId: index + 1, 
              status: "Execution Error", 
              expected: expectedOutput,
              actual: `JDoodle Error: ${errorMsg}`
          });
        } else {
          console.error(`❌ JDoodle Case ${index + 1} System Error:`, err.message);
          results.push({ 
              caseId: index + 1, 
              status: "Execution Error", 
              expected: expectedOutput,
              actual: "Connection Timeout or Network Error"
          });
        }
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