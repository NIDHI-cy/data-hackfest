from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("models/gemini-pro")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS so frontend can access the backend

# Utility: Extract text from uploaded PDF resume
def extract_text_from_pdf(file_stream):
    text = ""
    pdf = fitz.open(stream=file_stream, filetype="pdf")
    for page in pdf:
        text += page.get_text()
    return text

# Route: Home page (health check)
@app.route("/")
def home():
    return "✅ PathFinder Backend is Running!"

# Route: Upload resume and get Gemini-based suggestions
@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "Empty file"}), 400

    # Extract text from the resume PDF
    resume_text = extract_text_from_pdf(file.stream)

    # Gemini prompt to generate recommendations
    prompt = f"""
You are an expert assistant. Based on the following resume text, suggest 3 highly relevant and personalized tech opportunities for a college student (like internships, fellowships, coding contests, or open-source programs).

Resume:
{resume_text}
"""

    try:
        response = model.generate_content(prompt)
        suggestions = response.text.strip()
        return jsonify({"opportunities": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True)

