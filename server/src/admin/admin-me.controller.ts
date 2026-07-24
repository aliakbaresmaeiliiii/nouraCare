import { Controller, Get, UseGuards } from '@nestjs/common';
import { user_role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseHelper } from '../core/helpers/api-response.helper';

/** Lightweight session probe for the admin SPA. */
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(user_role.SUPER_ADMIN, user_role.ADMIN)
export class AdminMeController {
  @Get('me')
  me(
    @CurrentUser()
    user: {
      id: number;
      email: string;
      fullName: string;
      role: string;
      status: string;
    },
  ) {
    return ApiResponseHelper.success(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
      'Admin session',
    );
  }
}
