import { IsIn, IsNotEmpty } from 'class-validator';
import type { user_subscription_billing_interval } from '@prisma/client';

export class SubscribeBodyDto {
  @IsNotEmpty()
  @IsIn(['MONTH', 'YEAR'])
  interval: user_subscription_billing_interval;
}
