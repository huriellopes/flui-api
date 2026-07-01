import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, JoinGroupDto } from './dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return randomBytes(4).toString('hex'); // 8 chars
  }

  /** Exclui um grupo — apenas o dono pode. Remove membros/convites em cascata. */
  async remove(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    if (group.ownerId !== userId) {
      throw new ForbiddenException('Apenas o criador do grupo pode excluí-lo');
    }
    await this.prisma.group.delete({ where: { id: groupId } });
    return { ok: true };
  }

  async create(userId: string, dto: CreateGroupDto) {
    // Gera um código único (retry em caso de colisão improvável).
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = this.generateCode();
      const existing = await this.prisma.group.findUnique({ where: { inviteCode } });
      if (existing) continue;

      return this.prisma.group.create({
        data: {
          name: dto.name,
          ownerId: userId,
          inviteCode,
          members: { create: { userId } },
        },
        include: { members: true },
      });
    }
    throw new Error('Não foi possível gerar um código de convite único');
  }

  async join(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { inviteCode: dto.inviteCode } });
    if (!group) throw new NotFoundException('Grupo não encontrado');

    const already = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (!already) {
      await this.prisma.groupMember.create({ data: { groupId: group.id, userId } });
    }
    return group;
  }

  async myGroups(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ranking do grupo por XP (o usuário precisa ser membro). */
  async ranking(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Você não faz parte deste grupo');

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            gamification: {
              select: { xp: true, level: true, currentStreak: true },
            },
          },
        },
      },
    });

    return members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        xp: m.user.gamification?.xp ?? 0,
        level: m.user.gamification?.level ?? 1,
        currentStreak: m.user.gamification?.currentStreak ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp);
  }
}
