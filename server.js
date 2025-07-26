// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST: /api/check-fit
app.post("/api/check-fit", async (req, res) => {
  const { profile, event } = req.body;

  const prompt = `
A ${profile.year}-year ${profile.branch} student with skills in ${profile.skills.join(', ')} is considering this event:

Title: ${event.title}
Description: ${event.description}
Date: ${event.date}
Type: ${event.type}
Certified: ${event.certified ? 'Yes' : 'No'}

Is this a good opportunity for the student? Give:
- 2 Pros
- 2 Cons
- 1-line Summary

Format your reply as JSON like:
{
  "pros": [...],
  "cons": [...],
  "summary": "..."
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = JSON.parse(text);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Pathfinder backend running at http://localhost:${PORT}`));
