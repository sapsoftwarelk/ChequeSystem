import { Module } from '@nestjs/common';
import { ChequesService } from './cheques.service';
import { ChequesController } from './cheques.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Connects database access to this module
  providers: [ChequesService],
  controllers: [ChequesController],
})
export class ChequesModule {}