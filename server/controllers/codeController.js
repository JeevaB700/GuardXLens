const { GoogleGenerativeAI } = require("@google/generative-ai");
const Exam = require('../models/Exam');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const executeCode = async (req, res) => {
  const { language, sourceCode, questionId } = req.body;
  console.log(`\n--- Virtual Execution (${language}) for Q: ${questionId} ---`);

  try {
    const exam = await Exam.findOne({ "questions._id": questionId });
    if (!exam) return res.status(404).json({ message: "Question not found" });

    const question = exam.questions.id(questionId);
    const testCases = question.testCases || [];
    
    console.log(`Found ${testCases.length} test cases.`);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const results = [];

    for (let index = 0; index < testCases.length; index++) {
      const tc = testCases[index];
      const input = tc.input || "";
      const expectedOutput = (tc.output || "").trim();

      try {
        const prompt = `
          ACT AS A CODE COMPILER AND INTERPRETER.
          Language: ${language}
          Code:
          ${sourceCode}
          Input (Standard Input):
          ${input}
          
          TASK:
          1. Execute/Simulate the code with the provided input.
          2. Return ONLY the output (stdout).
          3. If there is a syntax error or runtime exception, return the error message starting with "ERROR:".
          4. NO EXPLANATIONS. NO MARKDOWN. ONLY RAW OUTPUT.
        `;

        const result = await model.generateContent(prompt);
        const rawResponse = result.response.text().trim();
        
        console.log(`AI Response: ${JSON.stringify(rawResponse)}`);

        if (rawResponse.startsWith("ERROR:")) {
            results.push({
                caseId: index + 1,
                status: "Runtime Error",
                expected: expectedOutput,
                actual: rawResponse.replace("ERROR:", "").trim()
            });
            continue;
        }

        const actualOutput = rawResponse;
        const passed = actualOutput === expectedOutput;

        results.push({
          caseId: index + 1,
          status: passed ? "Passed" : "Failed",
          expected: expectedOutput,
          actual: actualOutput,
        });

      } catch (err) {
        console.error("Gemini Execution Error:", err.message);
        results.push({ 
            caseId: index + 1, 
            status: "Runtime Error", 
            expected: expectedOutput,
            actual: "AI Execution Failed: " + err.message 
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