import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const corsOrigins = (configService.get<string>("corsOrigins") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin blocked"), false);
    },
    credentials: true,
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
