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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px;">
          <table width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding: 30px 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: #111;">Marketplace</h1>
                <p style="margin: 10px 0 0; font-size: 14px; color: #555;">Your digital commerce partner</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 40px 30px 40px; font-size: 16px; color: #333;">
                <p>Hi there,</p>
                <p>${message}</p>
                <p style="margin-top: 30px;">Thanks,<br>The Marketplace Team</p>
              </td>
            </tr>
            <tr>
              <td style="background: #f3f4f6; text-align: center; padding: 20px; font-size: 12px; color: #888;">
                © ${new Date().getFullYear()} Marketplace, Inc. All rights reserved.
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
