import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGroupDto, JoinGroupDto } from './dto';
import { GroupsService } from './groups.service';

@ApiTags('Grupos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  /** Cria um grupo de gamificação e gera um código de convite. */
  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.userId, dto);
  }

  /** Entra em um grupo usando o código de convite. */
  @Post('join')
  join(@CurrentUser() user: CurrentUserData, @Body() dto: JoinGroupDto) {
    return this.groups.join(user.userId, dto);
  }

  /** Lista os grupos dos quais o usuário participa. */
  @Get()
  mine(@CurrentUser() user: CurrentUserData) {
    return this.groups.myGroups(user.userId);
  }

  /** Ranking do grupo por XP (o usuário precisa ser membro). */
  @Get(':id/ranking')
  ranking(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.groups.ranking(user.userId, id);
  }
}
