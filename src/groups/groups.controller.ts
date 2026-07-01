import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGroupDto, JoinGroupDto } from './dto';
import { GroupsService } from './groups.service';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.userId, dto);
  }

  @Post('join')
  join(@CurrentUser() user: CurrentUserData, @Body() dto: JoinGroupDto) {
    return this.groups.join(user.userId, dto);
  }

  @Get()
  mine(@CurrentUser() user: CurrentUserData) {
    return this.groups.myGroups(user.userId);
  }

  @Get(':id/ranking')
  ranking(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.groups.ranking(user.userId, id);
  }
}
