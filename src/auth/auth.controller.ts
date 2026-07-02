import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  /** Cria uma conta (nome, e-mail, senha) e retorna o token JWT. */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiCreatedResponse({ description: 'Conta criada; retorna o token JWT e os dados do usuário.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou e-mail já cadastrado.' })
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas — tente novamente em instantes.' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /** Autentica com e-mail e senha e retorna o token JWT. */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOkResponse({ description: 'Autenticado; retorna o token JWT e os dados do usuário.' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha incorretos.' })
  @ApiTooManyRequestsResponse({
    description: 'Muitas tentativas de login — tente novamente em instantes.',
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Retorna os dados do usuário autenticado. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOkResponse({ description: 'Dados do usuário autenticado (sem o hash da senha).' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  async me(@Req() req: { user: { userId: string } }) {
    const user = await this.users.findById(req.user.userId);
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
