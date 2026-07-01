import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'notify-water-health-api' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    NutritionModule,
    // Fase 2: LogsModule, GroupsModule, GamificationModule
  ],
  controllers: [HealthController],
})
export class AppModule {}
