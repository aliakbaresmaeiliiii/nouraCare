import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Req,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';
import { OnboardingService } from './onboarding.service';
import { DataExportService } from './data-export.service';
import { OnboardingDataDto } from './dto/onboarding.dto';
import { ApiResponseHelper } from 'src/core/helpers/api-response.helper';
import {
  assertUserOwnership,
  userIdFromRequest,
} from '../auth/utils/assert-user-ownership.util';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private onboardingService: OnboardingService,
    private dataExportService: DataExportService,
  ) {}

  @Get('me/onboarding')
  async getMyOnboarding(@Req() req: Request) {
    const userId = userIdFromRequest(req);
    const result = await this.onboardingService.getUserOnboardingData(userId);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return ApiResponseHelper.success(
      result,
      'Onboarding data retrieved successfully',
    );
  }

  @Patch('me/onboarding')
  async patchMyOnboarding(
    @Req() req: Request,
    @Body() onboardingData: OnboardingDataDto,
  ) {
    const userId = userIdFromRequest(req);
    const result = await this.onboardingService.saveOnboardingData(
      userId,
      onboardingData,
    );
    return ApiResponseHelper.updated(
      result,
      'Onboarding data updated successfully',
    );
  }

  @Post('me/export-data')
  async exportMyData(@Req() req: Request) {
    const userId = userIdFromRequest(req);
    const result = await this.dataExportService.exportAndEmailUserData(userId);
    return ApiResponseHelper.success(
      result,
      'Your data export has been sent to your registered email',
    );
  }

  @Delete('me')
  async deleteMyAccount(@Req() req: Request) {
    const userId = userIdFromRequest(req);
    await this.userService.deleteUser(userId);
    return ApiResponseHelper.success(null, 'User account deleted successfully');
  }

  @Get(':id')
  async getUser(@Req() req: Request, @Param('id') id: string) {
    assertUserOwnership(req, id);
    const result = await this.userService.getUserById(+id);
    return ApiResponseHelper.success(result, 'User retrieved successfully');
  }

  @Put(':id/edit')
  async editUserInfo(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    assertUserOwnership(req, id);
    const result = await this.userService.editUserInfo(+id, updateUserDto);
    return ApiResponseHelper.success(result, 'User information updated successfully');
  }

  @Post(':id/profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(
            process.cwd(),
            'server',
            'public',
            'uploads',
            'profile',
          );
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image uploads are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfileImage(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    assertUserOwnership(req, id);
    if (!file) throw new BadRequestException('No file uploaded');

    const host = req.get('host');
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto =
      (typeof protoHeader === 'string' &&
        protoHeader.split(',')[0].trim().toLowerCase()) ||
      req.protocol ||
      'http';

    const baseUrl = process.env.BASE_URL || (host ? `${proto}://${host}` : '');
    if (!baseUrl) {
      throw new BadRequestException('Unable to derive BASE_URL for image uploads');
    }

    const url = `${baseUrl}/uploads/profile/${file.filename}`;
    await this.userService.editUserInfo(+id, { profileImage: url } as any);
    return ApiResponseHelper.success({ url }, 'Profile image uploaded successfully');
  }

  @Post(':id/onboarding')
  async saveOnboardingData(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() onboardingData: OnboardingDataDto,
  ) {
    assertUserOwnership(req, id);
    const result = await this.onboardingService.saveOnboardingData(+id, onboardingData);
    return ApiResponseHelper.success(result, 'Onboarding data saved successfully');
  }

  @Get(':id/onboarding')
  async getUserOnboardingData(@Req() req: Request, @Param('id') id: string) {
    assertUserOwnership(req, id);
    const result = await this.onboardingService.getUserOnboardingData(+id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return ApiResponseHelper.success(
      result,
      'Onboarding data retrieved successfully',
    );
  }
}
