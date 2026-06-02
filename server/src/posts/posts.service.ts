import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}
}
