import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePasswordDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Conta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Atualiza nome e/ou e-mail do usuário autenticado. */
  @Patch('me')
  updateProfile(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.userId, dto);
  }

  /** Troca a senha (exige a senha atual). */
  @Patch('me/password')
  updatePassword(@CurrentUser() user: CurrentUserData, @Body() dto: UpdatePasswordDto) {
    return this.users.updatePassword(user.userId, dto.currentPassword, dto.newPassword);
  }
}
