import { BadRequestException, Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private userService: UserService) { }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(+id);
  }

  @Put(':id/edit')

  async editUserInfo(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.editUserInfo(+id, updateUserDto);
  }

  @Post(':id/profile-image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'server', 'public', 'uploads', 'profile');
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
        return cb(new BadRequestException('Only image uploads are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadProfileImage(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = process.env.BASE_URL || 'http://172.20.10.2:8080';
    const url = `${baseUrl}/uploads/profile/${file.filename}`;
    await this.userService.editUserInfo(+id, { profileImage: url } as any);
    return { url };
  }
}
