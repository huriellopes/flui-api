import { Body, Controller, Delete, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeleteAccountDto, UpdateAvatarDto, UpdatePasswordDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Conta')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Atualiza nome e/ou e-mail do usuário autenticado. */
  @Patch('me')
  @ApiBadRequestResponse({ description: 'Dados inválidos ou e-mail já em uso.' })
  updateProfile(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.userId, dto);
  }

  /** Troca a senha (exige a senha atual). */
  @Patch('me/password')
  @ApiBadRequestResponse({ description: 'Senha atual incorreta ou nova senha inválida.' })
  updatePassword(@CurrentUser() user: CurrentUserData, @Body() dto: UpdatePasswordDto) {
    return this.users.updatePassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  /** Atualiza a foto de perfil (imagem base64). */
  @Patch('me/avatar')
  @ApiBadRequestResponse({ description: 'Imagem inválida.' })
  updateAvatar(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateAvatarDto) {
    return this.users.updateAvatar(user.userId, dto.imageBase64, dto.imageMime);
  }

  /** Exclui permanentemente a conta e todos os dados do usuário (exige a senha). */
  @Delete('me')
  @ApiBadRequestResponse({ description: 'Senha incorreta.' })
  deleteAccount(@CurrentUser() user: CurrentUserData, @Body() dto: DeleteAccountDto) {
    return this.users.deleteAccount(user.userId, dto.password);
  }
}
