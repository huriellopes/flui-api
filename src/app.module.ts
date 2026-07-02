import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { GamificationModule } from './gamification/gamification.module';
import { GroupsModule } from './groups/groups.module';
import { LogsModule } from './logs/logs.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';

@ApiTags('Health')
@Controller()
class HealthController {
  /** Verifica se a API está no ar. */
  @Get('health')
  health() {
    return { status: 'ok', service: 'notify-water-health-api' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global (anti brute-force / abuso): 120 req/min por IP.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    TelegramModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    NutritionModule,
    ProfileModule,
    GamificationModule,
    LogsModule,
    GroupsModule,
    PostsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Aplica o rate limiting em todas as rotas.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
