import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.getenv("EMAIL_USER")
        self.sender_password = os.getenv("EMAIL_PASS").replace(" ", "") if os.getenv("EMAIL_PASS") else None
        
        if not self.sender_email or not self.sender_password:
            logger.warning("⚠️ Email Service: Credentials missing in .env")
            print("⚠️ EMAIL SERVICE: Credentials MISSING!")
        else:
            print(f"✅ EMAIL SERVICE: Loaded credentials for {self.sender_email}")

    def _get_html_template(self, device_name, timestamp, alert_data, ai_insight, dashboard_link, title="🚨 Safety Alert Triggered", historical_context=None):
        # ── Parse AI insight + precautions ────────────────────────────────
        ai_insight_text = ai_insight or "Analysis complete."
        precaution_items = []
        if ai_insight and "⚠️ Recommended Precautions:" in ai_insight:
            parts = ai_insight.split("\n\n⚠️ Recommended Precautions:", 1)
            ai_insight_text = parts[0].strip()
            precaution_items = [p.strip() for p in parts[1].split(" | ") if p.strip()]

        # ── Precautions HTML ───────────────────────────────────────────────
        precautions_html = ""
        if precaution_items:
            items_html = "".join(
                f"""<tr>
                    <td style="padding: 10px 16px; border-bottom: 1px solid #d1fae5; font-size: 13px; color: #065f46; line-height: 1.5;">
                        {item}
                    </td>
                </tr>"""
                for item in precaution_items
            )
            precautions_html = f"""
            <div style="margin-top: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #6ee7b7;">
                <div style="background: linear-gradient(90deg, #059669, #10b981); padding: 12px 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">🛡️</span>
                    <span style="color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Recommended Precautions</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; background: #f0fdf4;">
                    {items_html}
                </table>
            </div>"""

        # ── Historical Context HTML ────────────────────────────────────────
        historical_html = ""
        if historical_context:
            lw = historical_context.get("last_week")
            yd = historical_context.get("yesterday")
            wa = historical_context.get("week_averages", {})
            lw_day = historical_context.get("last_week_day", "Last Week")
            time_str = historical_context.get("time_str", "")

            def hist_row(icon, label, snap):
                if snap and snap.get("temperature") is not None:
                    anomaly = snap.get("anomaly_label", "Normal")
                    badge_color = "#ef4444" if anomaly not in ("Normal", "normal") else "#10b981"
                    insight = snap.get("smart_insight", "")
                    
                    t_val = f"{snap['temperature']}°C" if snap.get('temperature') is not None else "—"
                    h_val = f"{snap['humidity']}%" if snap.get('humidity') is not None else "—"
                    g_val = f"{snap['gas']} ppm" if snap.get('gas') is not None else "—"
                    
                    insight_row = f"""<tr><td colspan="5" style="padding: 2px 16px 10px; font-size: 11px; color: #6b7280; font-style: italic;">💬 {insight}</td></tr>""" if insight else ""
                    return f"""
                    <tr style="border-bottom: 1px solid #e0f2fe;">
                        <td style="padding: 10px 16px; font-weight: 600; color: #0369a1; font-size: 13px; white-space: nowrap;">{icon} {label}</td>
                        <td style="padding: 10px 8px; color: #0c4a6e; font-size: 13px; font-weight: 600;">{t_val}</td>
                        <td style="padding: 10px 8px; color: #0c4a6e; font-size: 13px;">{h_val}</td>
                        <td style="padding: 10px 8px; color: #0c4a6e; font-size: 13px;">{g_val}</td>
                        <td style="padding: 10px 16px;"><span style="background: {badge_color}20; color: {badge_color}; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">{anomaly}</span></td>
                    </tr>{insight_row}"""
                return f"""<tr><td colspan="5" style="padding: 10px 16px; color: #9ca3af; font-size: 12px; font-style: italic;">{icon} No data recorded {label.lower()} at this time.</td></tr>"""

            lw_row = hist_row("📅", f"Last {lw_day} at {time_str}", lw)
            yd_row = hist_row("🕐", f"Yesterday at {time_str}", yd)

            avg_cells = ""
            for field, unit in [("temperature", "°C"), ("humidity", "%"), ("gas", " ppm")]:
                v = wa.get(field)
                avg_cells += f'<td style="padding: 10px 8px; color: #1e40af; font-size: 13px; font-weight: 700;">{v}{unit if v is not None else "—"}</td>'

            historical_html = f"""
            <div style="margin-top: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #bae6fd;">
                <div style="background: linear-gradient(90deg, #0284c7, #38bdf8); padding: 12px 16px;">
                    <span style="color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">📊 AI Historical Context</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; background: #f0f9ff;">
                    <thead>
                        <tr style="background: #e0f2fe;">
                            <th style="padding: 8px 16px; text-align: left; font-size: 10px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Period</th>
                            <th style="padding: 8px 8px; text-align: left; font-size: 10px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Temp</th>
                            <th style="padding: 8px 8px; text-align: left; font-size: 10px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Humidity</th>
                            <th style="padding: 8px 8px; text-align: left; font-size: 10px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Gas</th>
                            <th style="padding: 8px 16px; text-align: left; font-size: 10px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lw_row}
                        {yd_row}
                        <tr style="background: #dbeafe;">
                            <td style="padding: 10px 16px; font-weight: 700; color: #1e40af; font-size: 13px;">📈 7-Day Average</td>
                            {avg_cells}
                            <td style="padding: 10px 16px;"><span style="background: #1e40af20; color: #1e40af; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">BASELINE</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>"""

        # ── Metric rows ────────────────────────────────────────────────────
        metric_cards = ""
        for item in alert_data:
            is_critical = "CRITICAL" in item['status']
            is_moderate = "MODERATE" in item['status']
            if is_critical:
                card_bg, border_c, val_color, badge_bg, badge_color = "#fff5f5", "#fca5a5", "#dc2626", "#fee2e2", "#dc2626"
            elif is_moderate:
                card_bg, border_c, val_color, badge_bg, badge_color = "#fffbeb", "#fcd34d", "#d97706", "#fef3c7", "#d97706"
            else:
                card_bg, border_c, val_color, badge_bg, badge_color = "#f0fdf4", "#86efac", "#16a34a", "#dcfce7", "#16a34a"

            metric_cards += f"""
            <td style="width: 25%; padding: 6px;">
                <div style="background: {card_bg}; border: 1px solid {border_c}; border-radius: 12px; padding: 16px; text-align: center;">
                    <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600;">{item['metric']}</div>
                    <div style="font-size: 20px; font-weight: 800; color: {val_color}; margin-bottom: 4px;">{item['value']}</div>
                    <div style="font-size: 10px; color: #9ca3af; margin-bottom: 8px;">Limit: {item['limit']}</div>
                    <span style="background: {badge_bg}; color: {badge_color}; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;">{item['status']}</span>
                </div>
            </td>"""

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

    <!-- HEADER -->
    <tr>
        <td style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%); border-radius: 16px 16px 0 0; padding: 36px 32px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">🛡️</div>
            <h1 style="margin: 0; color: white; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">{title}</h1>
            <p style="margin: 8px 0 0; color: #fca5a5; font-size: 13px; font-weight: 500;">
                📡 {device_name} &nbsp;•&nbsp; 🕐 {timestamp}
            </p>
        </td>
    </tr>

    <!-- ALERT BANNER -->
    <tr>
        <td style="background: #1e293b; padding: 0 32px;">
            <div style="background: linear-gradient(90deg, #7f1d1d20, #dc262610); border: 1px solid #dc262640; border-radius: 10px; padding: 14px 18px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">⚠️</span>
                <span style="color: #fca5a5; font-size: 13px; font-weight: 600;">Environmental threshold breach detected. Immediate review required.</span>
            </div>
        </td>
    </tr>

    <!-- METRIC CARDS -->
    <tr>
        <td style="background: #1e293b; padding: 0 26px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>{metric_cards}</tr>
            </table>
        </td>
    </tr>

    <!-- AI INSIGHT -->
    <tr>
        <td style="background: #1e293b; padding: 0 32px 20px;">
            <div style="background: #1e3a5f; border: 1px solid #3b82f680; border-radius: 12px; padding: 18px 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 18px;">🤖</span>
                    <span style="font-size: 11px; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">AI Risk Analysis</span>
                </div>
                <p style="margin: 0; color: #bfdbfe; font-size: 13px; line-height: 1.7;">{ai_insight_text}</p>
            </div>
        </td>
    </tr>

    <!-- PRECAUTIONS -->
    {'<tr><td style="background: #1e293b; padding: 0 32px 20px;">' + precautions_html + '</td></tr>' if precautions_html else ''}

    <!-- HISTORICAL CONTEXT -->
    {'<tr><td style="background: #1e293b; padding: 0 32px 20px;">' + historical_html + '</td></tr>' if historical_html else ''}

    <!-- CTA BUTTON -->
    <tr>
        <td style="background: #1e293b; padding: 0 32px 32px; text-align: center;">
            <a href="{dashboard_link}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; box-shadow: 0 4px 15px #2563eb40;">
                🖥️ &nbsp; View Live Dashboard
            </a>
        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style="background: #0f172a; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center; border-top: 1px solid #1e293b;">
            <p style="margin: 0; color: #475569; font-size: 11px; line-height: 1.8;">
                EcoSync Sentinel System &nbsp;•&nbsp; Automated Environmental Monitoring<br>
                This is an automated alert. Do not reply to this email.
            </p>
        </td>
    </tr>

</table>
</td></tr>
</table>

</body>
</html>"""
        return html

    def send_alert(self, recipients, device_name, timestamp, alert_data, ai_insight, dashboard_link, title="🚨 Safety Alert Triggered", historical_context=None):
        if not self.sender_email or not self.sender_password:
            return False

        try:
            html_body = self._get_html_template(device_name, timestamp, alert_data, ai_insight, dashboard_link, title, historical_context)
            
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['Subject'] = f"{title}: {device_name}"
            msg.attach(MIMEText(html_body, 'html'))

            print(f"🔄 SMTP: Connecting to {self.smtp_server}:{self.smtp_port}...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            print("🔑 SMTP: Logging in...")
            server.login(self.sender_email, self.sender_password)
            
            for recipient in recipients:
                msg['To'] = recipient
                print(f"📨 SMTP: Sending to {recipient}...")
                server.sendmail(self.sender_email, recipient, msg.as_string())
                logger.info(f"📧 Rich Email sent to {recipient}")
                print(f"✅ SMTP: Sent to {recipient}")

            server.quit()
            return True

        except Exception as e:
            logger.error(f"❌ Email Service Error: {e}")
            print(f"❌ SMTP ERROR: {e}")
            return False

# Singleton
email_notifier = EmailService()

def send_email_notification(to_email, subject, body):
    """Legacy wrapper for simple text emails (used by Auth/OTP)"""
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = email_notifier.sender_email
    msg['To'] = to_email

    try:
        with smtplib.SMTP(email_notifier.smtp_server, email_notifier.smtp_port) as server:
            server.starttls()
            server.login(email_notifier.sender_email, email_notifier.sender_password)
            server.sendmail(email_notifier.sender_email, [to_email], msg.as_string())
            logger.info(f"📧 Legacy Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Legacy Email Error: {e}")
        return False
