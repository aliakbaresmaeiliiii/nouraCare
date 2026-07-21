import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Smsir } from 'sms-typescript';
import { env } from '../auth/config/env';

@Injectable()
export class SmsIrService {
  private readonly logger = new Logger(SmsIrService.name);
  private client: Smsir | null = null;

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
    let digits = phone.trim().replace(/[\s\-()]/g, '');
    if (digits.startsWith('+98')) digits = `0${digits.slice(3)}`;
    else if (digits.startsWith('98')) digits = `0${digits.slice(2)}`;
    else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
    if (!/^09\d{9}$/.test(digits)) return null;
    return digits;
  }

  /**
   * Send OTP via verify template (preferred) or plain bulk SMS.
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
          [{ name: env.SMS_IR_VERIFY_PARAM_NAME, value: code }],
        );
        if (result?.status !== undefined && result.status !== 1) {
          throw new Error(result?.message || 'sms.ir verify send failed');
        }
        this.logger.log(`OTP SMS (verify) queued for ${mobile}`);
        return;
      }

      const message =
        env.SMS_OTP_MESSAGE_TEMPLATE.replace(/\{code\}/g, code) ||
        `DoreHealth code: ${code}`;
      const result = await client.sendBulk(message, [mobile]);
      if (result?.status !== undefined && result.status !== 1) {
        throw new Error(result?.message || 'sms.ir bulk send failed');
      }
      this.logger.log(`OTP SMS (bulk) queued for ${mobile}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${mobile}`, error as Error);
      throw error;
    }
  }
}
