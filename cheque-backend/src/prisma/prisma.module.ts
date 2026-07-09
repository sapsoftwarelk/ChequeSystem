import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This makes PrismaService available across your entire Nest app instantly
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}