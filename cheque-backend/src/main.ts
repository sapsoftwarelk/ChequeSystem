import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Set global prefix so all API routes start with /api (e.g., /api/auth, /api/cheques)
  // We exclude 'static-assets' so uploaded images stay accessible directly at /static-assets/...
  app.setGlobalPrefix('api', {
    exclude: ['static-assets/(.*)'],
  });

  // 2. Enable CORS (Optional for Option 1 since both share the same domain, but good for local dev)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 3. Serve static assets (uploaded cheque images/signatures)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/static-assets/',
  });

  // 4. Listen on port 5000 across all local network interfaces (0.0.0.0)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend successfully running on http://0.0.0.0:${port}`);
}
bootstrap();
