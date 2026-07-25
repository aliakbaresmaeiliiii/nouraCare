import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Smsir } from 'sms-typescript';
import { env } from '../auth/config/env';

@Injectable()
export class SmsIrService implements OnModuleInit {
  private readonly logger = new Logger(SmsIrService.name);
  private client: Smsir | null = null;

  onModuleInit(): void {
    if (!this.isConfigured()) {
      this.logger.warn(
        'sms.ir is NOT configured (SMS_IR_API_KEY / SMS_IR_LINE_NUMBER). Phone OTP will fail.',
      );
      return;
    }
    if (env.SMS_IR_VERIFY_TEMPLATE_ID <= 0) {
      this.logger.warn(
        'SMS_IR_VERIFY_TEMPLATE_ID is not set. Phone OTP should use a sms.ir verify template — bulk SMS often never delivers OTP messages.',
      );
    } else {
      this.logger.log(
        `sms.ir ready (line=${env.SMS_IR_LINE_NUMBER}, verifyTemplate=${env.SMS_IR_VERIFY_TEMPLATE_ID})`,
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(env.SMS_IR_API_KEY && env.SMS_IR_LINE_NUMBER);
  }

  private getClient(): Smsir {
    if (!this.isConfigured()) {
      throw new BadRequestException('SMS provider is not configured');
    }
    if (!this.client) {
      this.client = new Smsir(env.SMS_IR_API_KEY, env.SMS_IR_LINE_NUMBER);
    }
    return this.client;
  }

  /**
   * Normalize Iranian mobiles to 09xxxxxxxxx (sms.ir expects local format).
   */
  normalizeMobile(phone: string | null | undefined): string | null {
    if (!phone?.trim()) return null;
    let digits = phone
      .trim()
      .replace(/[\s\-()]/g, '')
      // Persian / Arabic-Indic digits → ASCII
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    if (digits.startsWith('+98')) digits = `0${digits.slice(3)}`;
    else if (digits.startsWith('98') && digits.length >= 12)
      digits = `0${digits.slice(2)}`;
    else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
    if (!/^09\d{9}$/.test(digits)) return null;
    return digits;
  }

  private assertSmsSuccess(result: any, action: string): void {
    if (result?.status !== undefined && result.status !== 1) {
      const detail = result?.message || JSON.stringify(result);
      throw new BadRequestException({
        message: `sms.ir ${action} failed: ${detail}`,
        messageKey: 'auth.api.failedSendOtpSms',
      });
    }
  }

  /**
   * Send OTP via sms.ir verify template (required for reliable delivery).
   * Falls back to bulk only when no template is configured (often blocked by operators).
   */
  async sendOtp(phone: string, code: string): Promise<void> {
    const mobile = this.normalizeMobile(phone);
    if (!mobile) {
      throw new BadRequestException('Invalid Iranian mobile number for SMS OTP');
    }

    const client = this.getClient();

    try {
      if (env.SMS_IR_VERIFY_TEMPLATE_ID > 0) {
        const result = await client.sendVerifyCode(
          mobile,
          env.SMS_IR_VERIFY_TEMPLATE_ID,
          [{ name: env.SMS_IR_VERIFY_PARAM_NAME, value: String(code) }],
        );
        this.assertSmsSuccess(result, 'verify');
        this.logger.log(
          `OTP SMS (verify) queued for ${mobile} messageId=${result?.data?.messageId ?? 'n/a'}`,
        );
        return;
      }

      this.logger.warn(
        'Sending OTP via bulk SMS — set SMS_IR_VERIFY_TEMPLATE_ID for reliable delivery',
      );

      const message =
        env.SMS_OTP_MESSAGE_TEMPLATE.replace(/\{code\}/g, code) ||
        `DoreHealth code: ${code}`;
      const result = await client.sendBulk(message, [mobile]);
      this.assertSmsSuccess(result, 'bulk');
      this.logger.log(
        `OTP SMS (bulk) queued for ${mobile} packId=${result?.data?.packId ?? 'n/a'}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${mobile}`, error as Error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const detail =
        error instanceof Error ? error.message : 'Unknown sms.ir error';
      throw new BadRequestException({
        message: `Failed to send OTP SMS: ${detail}`,
        messageKey: 'auth.api.failedSendOtpSms',
      });
    }
  }
}
