import { Module } from '@nestjs/common';

import { NutritionModule } from '../nutrition/nutrition.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [NutritionModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
