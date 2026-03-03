require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Note: We use the key directly if .env fails, but let's try .env first
  console.log("Checking models for Key ending in:", process.env.GEMINI_API_KEY?.slice(-5));

  try {
    // This is the specific function Google suggests in your error message
    // It gets the raw list of what your key can touch.
    // We access the model manager directly via the SDK internals or just a raw fetch if SDK fails
    // But the SDK has a cleaner way usually not exposed clearly, so we will use a raw fetch fallback
    // to be 100% sure.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();

    if (data.error) {
        console.error("API Error:", data.error.message);
    } else {
        console.log("\n✅ AVAILABLE MODELS FOR YOU:");
        data.models.forEach(m => {
            if(m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')}`); // We need the name without 'models/' usually
            }
        });
    }
  } catch (error) {
    console.error("Failed to check models:", error);
  }
}

checkModels();