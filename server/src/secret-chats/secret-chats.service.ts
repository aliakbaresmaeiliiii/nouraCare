import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class SecretChatsService {
  constructor(private prismaService: PrismaService) {}
}
