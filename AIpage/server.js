import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { getLang } from "../lang/lang.js";

// const dotenv = require("dotenv");
dotenv.config();

// const express = require("express");
const fetch = global.fetch;
// const cors = require("cors");
// const { getLang } = require("../lang/lang");

console.log("chay duoc roi");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/groq", async (req, res) => {
    const { userMessage, context } = req.body;

    console.log("=== REQUEST ===");
    console.log("User Message:", userMessage);
    console.log("Context:", context);

    const apiKey = process.env.GROQ_API_KEY;
    const lang = getLang() === "vi" ? "tiếng Việt" : "tiếng Anh";
    console.log(getLang());

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
                        content: `Bạn là chuyên gia phân tích chất lượng không khí tại Việt Nam với khả năng:
1. PHÂN TÍCH SỐ LIỆU: Tự động so sánh, tính toán xu hướng, và đưa ra nhận định từ dữ liệu PM2.5
2. GIẢI THÍCH CHI TIẾT: 
   - Nguyên nhân gây ô nhiễm (giao thông, công nghiệp, thời tiết)
   - Tác động sức khỏe cụ thể (hô hấp, tim mạch, nhóm nhạy cảm)
   - Khuyến nghị hành động (đeo khẩu trang, hạn chế ra ngoài, dùng máy lọc không khí)
3. SO SÁNH: Đối chiếu với tiêu chuẩn WHO (PM2.5 < 5 μg/m³), EPA, và mức trung bình khu vực
4. XU HƯỚNG: Nhận xét tăng/giảm so với trung bình, dự báo ngắn hạn nếu có đủ dữ liệu

Trả lời bằng ${lang}, ngắn gọn nhưng đầy đủ thông tin, có số liệu cụ thể.`
                    },
                    {
                        role: "user",
                        content: `${context}\n\nCâu hỏi: ${userMessage}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        const data = await r.json();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal error" });
    }
});

// app.listen(3000);
app.listen(3000, () => console.log("Server running on port 3000")); 
