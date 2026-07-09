import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChequesModule } from './cheques/cheques.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    ChequesModule,   // Database engine configuration
    ScheduleModule.forRoot(), AuthModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}