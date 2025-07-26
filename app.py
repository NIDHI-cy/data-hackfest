from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText

app = Flask(_name_)
CORS(app)
scheduler = BackgroundScheduler()
scheduler.start()

# Replace with your Gmail app password
SENDER_EMAIL = "youremail@gmail.com"
SENDER_PASS = "your_app_password"

def send_email(to, subject, body):
    msg = MIMEText(body)
    msg["From"] = SENDER_EMAIL
    msg["To"] = to
    msg["Subject"] = subject
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(SENDER_EMAIL, SENDER_PASS)
        smtp.send_message(msg)

@app.route("/get_opportunities_with_resume", methods=["POST"])
def handle_profile():
    name = request.form.get("name")
    email = request.form.get("email")
    skills = request.form.get("skills")
    interests = request.form.get("interests")

    deadline = datetime.now() + timedelta(days=3)
    for days_before in [3, 1, 0]:
        send_time = deadline - timedelta(days=days_before)
        scheduler.add_job(
            send_email,
            "date",
            run_date=send_time,
            args=[
                email,
                f"⏰ Reminder: Deadline in {days_before} day(s)!",
                f"Hey {name}, don’t miss this opportunity! – Duomate"
            ]
        )

    return jsonify({"response": f"✅ Emails scheduled for {name}!"})

if _name_ == "_main_":
    app.run(host="0.0.0.0", port=5000)