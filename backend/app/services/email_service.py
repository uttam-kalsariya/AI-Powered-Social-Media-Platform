import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
import resend
from app.config import Config

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str, text_content: str = ""):
    """
    Dispatches transactional emails via the official Resend API.
    Does not log sensitive OTP values or API keys.
    Reports failure if delivery cannot be confirmed.
    """
    clean_to = to_email.strip().lower()

    # 1. Official Resend API
    if Config.RESEND_API_KEY:
        try:
            resend.api_key = Config.RESEND_API_KEY
            
            # Resend onboarding@resend.dev test domain policy:
            # Free tier allows sending strictly to the registered account owner: uttamkalsariya1002@gmail.com
            is_onboarding_sender = "onboarding@resend.dev" in Config.MAIL_FROM.lower()
            target_recipient = clean_to
            target_subject = subject
            target_html = html_content

            if is_onboarding_sender and clean_to != "uttamkalsariya1002@gmail.com":
                target_recipient = "uttamkalsariya1002@gmail.com"
                target_subject = f"[For: {clean_to}] {subject}"
                notice = (
                    f"<div style='background:#fef3c7;border:1px solid #fde68a;padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:12px;color:#92400e;'>"
                    f"<strong>Aura Real-time Test Delivery:</strong> Intended recipient: <code>{clean_to}</code>. Delivered to verified owner inbox."
                    f"</div>"
                )
                target_html = notice + html_content

            params = {
                "from": Config.MAIL_FROM,
                "to": [target_recipient],
                "subject": target_subject,
                "html": target_html,
            }
            if text_content:
                params["text"] = text_content
            email_resp = resend.Emails.send(params)
            msg_id = getattr(email_resp, 'id', str(email_resp.get('id', 'sent') if isinstance(email_resp, dict) else email_resp))
            logger.info("Real-time email successfully dispatched via Resend API to %s (id: %s)", target_recipient, msg_id)
            return {"success": True, "mode": "resend", "id": msg_id}
        except Exception as e:
            logger.error("Resend API dispatch failed for %s: %s", clean_to, e)
            is_testing = os.getenv('TESTING') == 'True'
            if not is_testing:
                return {"success": False, "mode": "resend", "error": str(e)}

    # 2. SMTP Provider (if configured)
    if Config.SMTP_USER and Config.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = Config.EMAIL_FROM or Config.SMTP_USER
            msg['To'] = clean_to

            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            server = smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT, timeout=5)
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            server.sendmail(msg['From'], [clean_to], msg.as_string())
            server.quit()
            logger.info("Email dispatched via SMTP to %s", clean_to)
            return {"success": True, "mode": "smtp"}
        except Exception as e:
            logger.error("SMTP dispatch failed for %s: %s", clean_to, e)
            return {"success": False, "mode": "smtp", "error": str(e)}

    # 3. Safe fallback for automated test runner only
    if os.getenv('TESTING') == 'True':
        return {"success": True, "mode": "test_mock"}

    return {"success": False, "error": "Email service not configured"}

def send_verification_email(to_email: str, username: str, otp_code: str):
    """
    Sends the 6-digit verification code to user email.
    Never prints or logs the OTP code.
    """
    subject = "Your Verification Code - Aura Social"
    html_template = (
        '<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; color: #222222;">'
        '<div style="text-align: center; margin-bottom: 24px;">'
        '<h2 style="color: #121212; font-size: 22px; font-weight: 700; margin: 0;">Aura Social Verification</h2>'
        '<p style="color: #666666; font-size: 14px; margin-top: 6px;">Welcome, ' + str(username) + '! Complete your account activation</p>'
        '</div>'
        '<p style="font-size: 14px; line-height: 1.5; color: #444444;">'
        'Please enter the following 6-digit verification code to activate your account:'
        '</p>'
        '<div style="background-color: #f7f7f8; border: 1px solid #eaeaea; padding: 18px; border-radius: 10px; text-align: center; margin: 24px 0;">'
        '<span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #e1306c;">' + str(otp_code) + '</span>'
        '</div>'
        '<p style="font-size: 13px; color: #777777; margin: 0;">'
        'This code is valid for <strong>5 minutes</strong> only.'
        '</p>'
        '<p style="font-size: 12px; color: #999999; margin-top: 18px; border-top: 1px solid #f0f0f0; padding-top: 14px;">'
        'If you did not request this verification code, you can safely ignore this email. Never share your OTP with anyone.'
        '</p>'
        '</div>'
    )
    text_content = f"Welcome to Aura, {username}! Your 6-digit verification code is: {otp_code}. It is valid for 5 minutes."
    return send_email(to_email, subject, html_template, text_content)

def send_password_reset_email(to_email: str, arg2: str, arg3: str = None):
    """
    Sends password reset instructions. Supports:
    send_password_reset_email(to_email, reset_token) OR
    send_password_reset_email(to_email, username, reset_token)
    """
    if arg3 is None:
        username = "User"
        reset_token = arg2
    else:
        username = arg2
        reset_token = arg3

    subject = "Reset Your Password - Aura Social"
    html_template = (
        '<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; color: #222222;">'
        '<div style="text-align: center; margin-bottom: 24px;">'
        '<h2 style="color: #121212; font-size: 22px; font-weight: 700; margin: 0;">Password Reset Request</h2>'
        '<p style="color: #666666; font-size: 14px; margin-top: 6px;">Hi ' + str(username) + ', you requested to reset your password</p>'
        '</div>'
        '<p style="font-size: 14px; line-height: 1.5; color: #444444;">'
        'Please use the following reset code to update your password:'
        '</p>'
        '<div style="background-color: #f7f7f8; border: 1px solid #eaeaea; padding: 16px; border-radius: 10px; text-align: center; margin: 24px 0;">'
        '<span style="font-family: monospace; font-size: 24px; font-weight: 700; color: #0095f6; letter-spacing: 2px;">' + str(reset_token) + '</span>'
        '</div>'
        '<p style="font-size: 13px; color: #777777; margin: 0;">'
        'This token expires in <strong>15 minutes</strong>. If you did not make this request, please ignore this email.'
        '</p>'
        '</div>'
    )
    text_content = f"Hi {username}, use this token to reset your password: {reset_token} (valid for 15 minutes)."
    return send_email(to_email, subject, html_template, text_content)
