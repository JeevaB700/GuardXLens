require('dotenv').config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  console.log("Testing Groq models...");
  
  try {
    console.log("\n1. Testing llama-3.1-8b-instant (Question Extraction)...");
    const completion1 = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello, list 1 sample MCQ question about Java." }],
      model: "llama-3.1-8b-instant",
    });
    console.log("Response:", completion1.choices[0].message.content);

    console.log("\n2. Testing meta-llama/llama-4-scout-17b-16e-instruct (Test Case Generation)...");
    const completion2 = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Generate a test case for a function that adds two numbers." }],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
    });
    console.log("Response:", completion2.choices[0].message.content);

    console.log("\n✅ Groq integration verified!");
  } catch (error) {
    console.error("\n❌ Groq test failed:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testGroq();
