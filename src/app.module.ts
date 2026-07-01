import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

import { AuthModule } from './auth/auth.module';
import { GamificationModule } from './gamification/gamification.module';
import { GroupsModule } from './groups/groups.module';
import { LogsModule } from './logs/logs.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
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
})
export class AppModule {}
