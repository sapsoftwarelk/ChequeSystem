import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for all local network devices
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static assets (uploaded cheque images/signatures)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/static-assets/',
  });

  // Listen on port 5000 across all local network interfaces (0.0.0.0)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend successfully running on http://0.0.0.0:${port}`);
}
bootstrap();