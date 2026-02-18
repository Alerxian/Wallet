import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  getHealth() {
    return {
      ok: true,
      service: "prediction-backend",
      timestamp: new Date().toISOString(),
    };
  }
}
