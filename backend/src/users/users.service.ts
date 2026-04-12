import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Full user projection — used for /users/me to power the frontend
const ME_SELECT = {
    id: true,
    email: true,
    name: true,
    bio: true,
    photoUrl: true,
    age: true,
    city: true,
    interests: true,
    // New profile fields
    relationshipStatus: true,
    hasKids: true,
    wantsKids: true,
    zodiacSign: true,
    languages: true,
    occupation: true,
    height: true,
    lifestyle: true,
    profileComplete: true,
    // Reputation
    reputationScore: true,
    attendanceScore: true,
    behaviorScore: true,
    completionRate: true,
    groupsJoined: true,
    groupsCompleted: true,
    createdAt: true,
};

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: ME_SELECT,
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                bio: true,
                photoUrl: true,
                age: true,
                city: true,
                interests: true,
                lifestyle: true,
                occupation: true,
                zodiacSign: true,
                reputationScore: true,
                attendanceScore: true,
                behaviorScore: true,
                completionRate: true,
                groupsJoined: true,
                groupsCompleted: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateMe(userId: string, dto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: ME_SELECT,
        });
    }
}
