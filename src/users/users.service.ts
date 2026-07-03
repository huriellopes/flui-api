import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { saveBase64Image } from '../common/image-storage';
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

  /** Atualiza a foto de perfil (upload base64). */
  async updateAvatar(userId: string, imageBase64: string, imageMime?: string) {
    const avatarUrl = saveBase64Image(imageBase64, imageMime);
    const user = await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
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

  /** Exclui a conta e, em cascata, todos os dados do usuário. Exige a senha. */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Senha incorreta');

    // Todas as relações do User têm onDelete: Cascade — remove perfil, metas,
    // logs, gamificação, grupos criados, posts, curtidas, comentários e membros.
    await this.prisma.user.delete({ where: { id: userId } });
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
