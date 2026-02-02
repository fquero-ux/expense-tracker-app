const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyD9f1gfOmPsqiuzutiDw5FKAcFAI3XiZDo";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    const fs = require('fs');
    let logs = "--- Starting Gemini API Access Test ---\n";

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            const response = await result.response;
            logs += `✅ [${modelName}] SUCCESS: ${response.text().substring(0, 20)}...\n`;
        } catch (e) {
            logs += `❌ [${modelName}] FAILED: ${e.message}\n`;
        }
    }

    fs.writeFileSync('api-results.log', logs);
    console.log("Results saved to api-results.log");
}

run().catch(console.error);
