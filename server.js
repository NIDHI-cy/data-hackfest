const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 5000;

// ✅ Gemini 1.5 Flash API Key
const API_KEY = "AIzaSyDzWUQ5FdPpliBTbD26K3zuLKuCxRqhZ2I";
const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Serve index.html if needed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Main Recommendation Route
app.post('/recommend', upload.single('resume'), async (req, res) => {
  try {
    const {
      name, email, skills, linkedin, github,
      beginnerOnly, onlineOnly, freeOnly
    } = req.body;

    let resumeText = "";

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text;
      console.log("📄 Extracted Resume Text:\n", resumeText.slice(0, 300));
      fs.unlinkSync(req.file.path); // ✅ Delete resume after use
    }

    console.log("💡 Provided Skills:", skills);

    // ✅ Construct Gemini Prompt
    const prompt = `
Act as a career guidance AI. Based on the student's resume and skills, recommend 4 real and upcoming tech opportunities (like hackathons, internships, or bootcamps).

Resume:
"""${resumeText || "No resume provided"}"""

Skills: ${skills}

Preferences:
- Beginner Friendly: ${beginnerOnly === 'true' ? 'Yes' : 'No'}
- Online: ${onlineOnly === 'true' ? 'Yes' : 'No'}
- Free: ${freeOnly === 'true' ? 'Yes' : 'No'}

Respond in EXACTLY this JSON format (nothing else):

[
  {
    "title": "Opportunity Name",
    "summary": "What is it about",
    "deadline": "Deadline date in YYYY-MM-DD",
    "link": "https://example.com"
  }
]
`;

    console.log("🧠 Prompt Sent to Gemini:\n", prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleaned = text.replace(/^```json|^```|```$/gm, '').trim();
    console.log("📨 Gemini Cleaned Response:\n", cleaned);

    let opportunities = [];
    try {
      opportunities = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err);
      return res.status(500).json({ error: "Gemini returned malformed JSON. Please try again." });
    }

    res.json({ opportunities });

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`🚀 DueMate backend running at http://localhost:${PORT}`);
});
