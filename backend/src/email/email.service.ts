import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'TestForge <onboarding@resend.dev>');
  }

  async sendWelcomeEmail(
    to: string,
    displayName: string,
    companyName: string,
    verificationUrl?: string,
  ): Promise<void> {
    const cta = verificationUrl
      ? `<p style="margin: 0 0 24px;">
           <a href="${verificationUrl}" style="display:inline-block;background:#1A3263;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Verify your email</a>
         </p>`
      : '';

    await this.sendEmail(to, 'Welcome to TestForge', `
      ${this.wrapTemplate('Welcome to TestForge', `
        <p>Hi ${this.escape(displayName)},</p>
        <p>Welcome to <strong>TestForge</strong>. Your workspace for <strong>${this.escape(companyName)}</strong> is ready.</p>
        ${cta}
        <p>You can now start creating projects, managing test cases, and collaborating with your QA team.</p>
      `)}
    `);
  }

  async sendPasswordResetEmail(to: string, displayName: string, resetUrl: string): Promise<void> {
    await this.sendEmail(to, 'Reset your TestForge password', `
      ${this.wrapTemplate('Reset your password', `
        <p>Hi ${this.escape(displayName)},</p>
        <p>We received a request to reset your password. If this was you, click below:</p>
        <p style="margin: 0 0 24px;">
          <a href="${resetUrl}" style="display:inline-block;background:#1A3263;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Reset password</a>
        </p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      `)}
    `);
  }

  async sendInvitationEmail(
    to: string,
    inviterName: string,
    companyName: string,
    role: string,
    inviteUrl: string,
  ): Promise<void> {
    await this.sendEmail(to, `You're invited to ${companyName} on TestForge`, `
      ${this.wrapTemplate('You have been invited', `
        <p>${this.escape(inviterName)} invited you to join <strong>${this.escape(companyName)}</strong> as <strong>${this.escape(role)}</strong>.</p>
        <p style="margin: 0 0 24px;">
          <a href="${inviteUrl}" style="display:inline-block;background:#1A3263;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Accept invitation</a>
        </p>
      `)}
    `);
  }

  async sendTestCaseAssignedEmail(
    to: string,
    assigneeName: string,
    assignerName: string,
    testCaseRef: string,
    testTitle: string,
    projectName: string,
  ): Promise<void> {
    await this.sendEmail(to, `New Test Case Assigned: ${testCaseRef}`, `
      ${this.wrapTemplate('A test case was assigned to you', `
        <p>Hi ${this.escape(assigneeName)},</p>
        <p><strong>${this.escape(assignerName)}</strong> assigned you a test case in <strong>${this.escape(projectName)}</strong>.</p>
        <div style="padding: 12px; background: #F7F9FC; border: 1px solid #E1E8F5; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>${this.escape(testCaseRef)}</strong> — ${this.escape(testTitle)}</p>
        </div>
      `)}
    `);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not set. Skipping email "${subject}" to ${to}.`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html,
    });
  }

  private wrapTemplate(title: string, content: string): string {
    return `
      <div style="margin:0;padding:24px;background:#F2F5FB;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #D9E2F3;border-radius:12px;overflow:hidden;">
          <div style="background:#1A3263;padding:20px 24px;color:#fff;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;">${this.escape(title)}</h1>
          </div>
          <div style="padding:24px;color:#22324F;font-size:15px;line-height:1.6;">
            ${content}
          </div>
        </div>
      </div>
    `;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
