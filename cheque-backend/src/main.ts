import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // FIXED LINE: Uses process.cwd() to target the absolute root 'uploads' folder
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/static-assets/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();