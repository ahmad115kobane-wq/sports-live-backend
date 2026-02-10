import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Mini Football <noreply@iqfx.shop>';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'تأكيد بريدك الإلكتروني - Mini Football',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a2e; margin: 0;">⚽ Mini Football</h1>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #1a1a2e; margin-top: 0;">مرحباً ${name}! 👋</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              شكراً لإنشاء حسابك في Mini Football. استخدم الرمز التالي لتأكيد بريدك الإلكتروني:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 12px;">
                ${code}
              </div>
            </div>
            <p style="color: #888; font-size: 14px; text-align: center;">
              هذا الرمز صالح لمدة 15 دقيقة فقط.
            </p>
          </div>
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email service error (verification):', err);
    return false;
  }
}

async function sendPasswordResetEmail(email: string, code: string, name: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'إعادة تعيين كلمة المرور - Mini Football',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1a1a2e; margin: 0;">⚽ Mini Football</h1>
          </div>
          <div style="background: #fff; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #1a1a2e; margin-top: 0;">مرحباً ${name}! 🔒</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 12px;">
                ${code}
              </div>
            </div>
            <p style="color: #888; font-size: 14px; text-align: center;">
              هذا الرمز صالح لمدة 15 دقيقة فقط.
            </p>
          </div>
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send reset email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email service error (reset):', err);
    return false;
  }
}

export { generateCode, sendVerificationEmail, sendPasswordResetEmail };
