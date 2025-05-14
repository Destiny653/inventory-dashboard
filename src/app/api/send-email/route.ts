// app/api/send-email/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { to, subject, message } = await request.json()

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="background-color: #f4f6f8; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 40px 40px 20px; text-align: center;">
                <h1 style="font-size: 28px; margin: 0; color: #0070f3;">Marketplace</h1>
                <p style="color: #666; font-size: 14px; margin-top: 8px;">Your digital commerce partner</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 40px 30px; font-size: 16px; color: #333;">
                <p style="margin-top: 0;">Hi there,</p>
                <p style="line-height: 1.6;">${message}</p>
                <p style="margin-top: 30px;">Thanks,<br><strong>The Marketplace Team</strong></p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px; text-align: center; background-color: #fafafa; font-size: 12px; color: #999;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Marketplace, Inc. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
      `
    });
    
    

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
