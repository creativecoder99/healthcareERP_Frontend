import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_5i06yjj";
const TEMPLATE_ID = "template_pwclh5a";
const PUBLIC_KEY  = "rPKG2NtQzC43RRgVs";

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  toName?: string
): Promise<boolean> {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name: toName || toEmail,
        otp,
      },
      PUBLIC_KEY
    );
    return true;
  } catch (err) {
    console.error("EmailJS send failed:", err);
    return false;
  }
}
