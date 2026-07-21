import { Module } from '@nestjs/common';
import { SmsIrService } from './sms-ir.service';

@Module({
  providers: [SmsIrService],
  exports: [SmsIrService],
})
export class SmsModule {}
