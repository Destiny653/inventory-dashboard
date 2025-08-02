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

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #374151;
          }
          .message {
            background-color: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 30px 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 0;
              border: none;
            }
            .header, .content, .footer {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Marketplace</h1>
            <p>Your digital commerce partner</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello!</h2>
            
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div class="divider"></div>
            
            <p style="margin-bottom: 0;">
              If you have any questions or need assistance, please don't hesitate to reach out to our support team.
            </p>
            
            <p style="margin-top: 20px; margin-bottom: 0;">
              Best regards,<br>
              <strong>The Marketplace Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Marketplace, Inc. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
              This email was sent to you as part of your Marketplace account.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: emailHtml
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
