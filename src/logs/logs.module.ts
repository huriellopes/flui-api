import { Module } from '@nestjs/common';

import { GamificationModule } from '../gamification/gamification.module';
import { VisionModule } from '../vision/vision.module';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  imports: [GamificationModule, VisionModule],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
