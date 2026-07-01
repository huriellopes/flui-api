import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Atualiza nome e/ou e-mail, garantindo unicidade do e-mail. */
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('E-mail já está em uso');
      }
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
      },
    });
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  }

  /** Troca a senha exigindo a senha atual. */
  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('A nova senha deve ter ao menos 8 caracteres');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, gamification: true },
    });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        ...data,
        gamification: { create: {} },
      },
    });
  }
}
