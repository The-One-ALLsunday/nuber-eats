import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { JwtMiddleware } from './jwt/jwt.middleware';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    // app.use(JwtMiddleware);
    await app.listen(3000);
  } catch (e) {
    console.log(e);
  }
}
bootstrap();
