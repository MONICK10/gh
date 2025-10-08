/**
 * ai-chat-logic.js
 * CORRECTED based on your working sample code.
 */

// This is the working API URL from your sample project.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

// The System Prompt for Aura.
const SYSTEM_PROMPT = `You are "Aura," a compassionate AI wellness assistant for university students.
Listen, empathize, guide relaxation if stress is mentioned, never give medical advice. 
Keep responses short, simple, and friendly.`;

async function getAIResponse(userInput, history = []) {
    if (!API_KEY || API_KEY === "PASTE_YOUR_GOOGLE_AI_API_KEY_HERE") {
        return "❌ Error: API Key is missing. Please configure it in chat.html.";
    }

    try {
        // FIXED: This payload structure is the correct one for conversational chat
        // with the v1beta endpoint. The system prompt and history are combined
        // within the 'contents' array.
        const payload = {
            contents: [
                // The first message sets the context for the AI
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Aura, a compassionate AI assistant. I will follow all instructions. I am ready to help the student." }]
                },
                // Now, we add the actual conversation history
                ...history,
                // Finally, we add the user's latest message
                {
                    role: "user",
                    parts: [{ text: userInput }]
                }
            ],
            // generationConfig is not supported at the top level in this structure,
            // but we can leave it out for now as the defaults are fine.
        };
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("AI API Error:", errorBody);
            return `❌ AI error: ${errorBody.error?.message || response.statusText}`;
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            console.warn("AI response was blocked or empty:", data);
            return "I'm not able to respond to that right now. Let's try a different topic.";
        }

        const aiText = data.candidates[0]?.content?.parts?.[0]?.text;
        return aiText ? aiText.trim() : "❌ AI did not return a valid response.";

    } catch (err) {
        console.error("Fetch Error:", err);
        return "❌ Error: Unable to reach AI service. Check your API key and internet connection.";
    }
}