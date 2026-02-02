const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyD9f1gfOmPsqiuzutiDw5FKAcFAI3XiZDo";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    const fs = require('fs');
    let logs = "--- Listing Available Gemini Models ---\n";

    try {
        // Unfortunately the JS SDK doesn't have a direct listModels yet in all versions
        // but we can try common variations to see what sticks.
        const variations = [
            "gemini-pro",
            "gemini-pro-vision",
            "gemini-1.0-pro",
            "gemini-1.5-flash-latest"
        ];

        for (const v of variations) {
            try {
                const model = genAI.getGenerativeModel({ model: v });
                const result = await model.generateContent("Hi");
                logs += `[${v}] OK\n`;
            } catch (e) {
                logs += `[${v}] NO: ${e.message}\n`;
            }
        }
    } catch (e) {
        logs += `CRITICAL ERROR: ${e.message}\n`;
    }

    fs.writeFileSync('model-list.log', logs);
}

run().catch(console.error);
