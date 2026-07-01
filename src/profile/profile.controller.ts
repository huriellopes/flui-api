import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertProfileDto } from './dto';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserData) {
    return this.profile.get(user.userId);
  }

  @Put()
  upsert(@CurrentUser() user: CurrentUserData, @Body() dto: UpsertProfileDto) {
    return this.profile.upsert(user.userId, dto);
  }
}
