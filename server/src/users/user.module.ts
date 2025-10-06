import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { UserService } from './user.service';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController, ProfileController],
  providers: [UserService, OnboardingService],
  exports: [UserService, OnboardingService],
})
export class UserModule {}
