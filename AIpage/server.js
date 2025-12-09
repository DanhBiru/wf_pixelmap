import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/groq", async (req, res) => {
    const { userMessage, context } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "Bạn là trợ lý AI chuyên về chất lượng không khí tại Việt Nam. Trả lời ngắn gọn, dễ hiểu, bằng tiếng Việt."
                    },
                    {
                        role: "user",
                        content: `${context}\n\nCâu hỏi: ${userMessage}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await r.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal error" });
    }
});

app.listen(3000);
