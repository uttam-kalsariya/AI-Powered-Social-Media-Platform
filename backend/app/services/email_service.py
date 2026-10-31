import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import Config

logger = logging.getLogger(__name__)

# Development log of outgoing emails (for easy testing without SMTP)
dev_email_inbox = []

def send_email(to_email: str, subject: str, html_content: str, text_content: str = ""):
    """
    Sends an email via SMTP if credentials are configured;
    otherwise logs to dev inbox for easy local verification.
    """
    msg_record = {
        "to": to_email,
        "subject": subject,
        "content": html_content,
        "text": text_content or html_content
    }
    dev_email_inbox.append(msg_record)
    
    # Check if SMTP is configured
    if Config.SMTP_USER and Config.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = Config.EMAIL_FROM or Config.SMTP_USER
            msg['To'] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            server = smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT, timeout=5)
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.sendmail(msg['From'], [to_email], msg.as_string())
            server.quit()
            logger.info(f"Email sent successfully to {to_email} via SMTP")
            return {"success": True, "mode": "smtp"}
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            print(f"[EMAIL DEV FALLBACK] SMTP failed ({e}). Logged message for {to_email}")
            return {"success": True, "mode": "dev_fallback", "error": str(e)}
    else:
        print(f"\n================ [EMAIL DEV LOG] ================")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{text_content or html_content}")
        print(f"=================================================\n")
        return {"success": True, "mode": "dev_console"}

def send_verification_email(to_email: str, username: str, verification_token: str):
    subject = "Verify your AI Social Media Account"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Welcome to AI Social, {username}!</h2>
        <p>Please use the following verification code to activate your account:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e1b4b;">{verification_token}</span>
        </div>
        <p>This code will expire in 24 hours.</p>
    </div>
    """
    text_content = f"Welcome {username}! Your verification code is: {verification_token}"
    return send_email(to_email, subject, html_content, text_content)

def send_password_reset_email(to_email: str, reset_token: str):
    subject = "Reset Your AI Social Password"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>We received a request to reset your password. Use the verification token below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #1e1b4b;">{reset_token}</span>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    text_content = f"Password reset token: {reset_token}"
    return send_email(to_email, subject, html_content, text_content)
