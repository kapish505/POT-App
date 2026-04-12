import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FRIEND_USER_SELECT = {
    id: true, name: true, photoUrl: true, city: true,
    occupation: true, interests: true, reputationScore: true,
    groupsCompleted: true, groupsJoined: true,
};

@Injectable()
export class FriendsService {
    constructor(private prisma: PrismaService) { }

    // Send a friend request (optionally record which group they met at)
    async sendRequest(requesterId: string, addresseeId: string, metAtGroupId?: string) {
        if (requesterId === addresseeId) throw new BadRequestException('Cannot friend yourself');

        // Check addressee exists
        const addressee = await this.prisma.user.findUnique({ where: { id: addresseeId } });
        if (!addressee) throw new NotFoundException('User not found');

        // Check if a friendship already exists in either direction
        const existing = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });
        if (existing) {
            if (existing.status === 'ACCEPTED') throw new ConflictException('Already friends');
            if (existing.status === 'PENDING') throw new ConflictException('Request already pending');
        }

        let metAtGroupTitle: string | undefined;
        if (metAtGroupId) {
            const group = await this.prisma.group.findUnique({ where: { id: metAtGroupId }, select: { title: true } });
            metAtGroupTitle = group?.title;
        }

        return this.prisma.friendship.create({
            data: { requesterId, addresseeId, metAtGroupId, metAtGroupTitle },
            include: { addressee: { select: FRIEND_USER_SELECT } },
        });
    }

    // Accept a pending request
    async acceptRequest(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
        if (!friendship) throw new NotFoundException('Request not found');
        if (friendship.addresseeId !== userId) throw new ForbiddenException('Not your request to accept');
        if (friendship.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        return this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'ACCEPTED' },
            include: { requester: { select: FRIEND_USER_SELECT } },
        });
    }

    // Decline or cancel a request
    async deleteRequest(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
        if (!friendship) throw new NotFoundException('Request not found');
        // either party can delete
        if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
            throw new ForbiddenException('Not your friendship to remove');
        }
        await this.prisma.friendship.delete({ where: { id: friendshipId } });
        return { success: true };
    }

    // Get all accepted friends for current user
    async getMyFriends(userId: string) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ requesterId: userId }, { addresseeId: userId }],
            },
            include: {
                requester: { select: FRIEND_USER_SELECT },
                addressee: { select: FRIEND_USER_SELECT },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return friendships.map(f => ({
            friendshipId: f.id,
            metAtGroupId: f.metAtGroupId,
            metAtGroupTitle: f.metAtGroupTitle,
            friend: f.requesterId === userId ? f.addressee : f.requester,
        }));
    }

    // Get incoming pending requests
    async getIncomingRequests(userId: string) {
        return this.prisma.friendship.findMany({
            where: { addresseeId: userId, status: 'PENDING' },
            include: { requester: { select: FRIEND_USER_SELECT } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get outgoing pending requests
    async getOutgoingRequests(userId: string) {
        return this.prisma.friendship.findMany({
            where: { requesterId: userId, status: 'PENDING' },
            include: { addressee: { select: FRIEND_USER_SELECT } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Friendship status between two users (for the Add Friend button)
    async getStatus(requesterId: string, targetId: string) {
        if (requesterId === targetId) return { status: 'SELF' };

        const friendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: requesterId },
                ],
            },
        });

        if (!friendship) return { status: 'NONE', friendshipId: null };

        return {
            status: friendship.status,
            friendshipId: friendship.id,
            isSentByMe: friendship.requesterId === requesterId,
        };
    }

    // ──────────── Direct Messages ────────────

    private convId(a: string, b: string) {
        return [a, b].sort().join('_');
    }

    async sendDM(senderId: string, receiverId: string, content: string) {
        // Ensure they are friends
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: senderId, addresseeId: receiverId },
                    { requesterId: receiverId, addresseeId: senderId },
                ],
            },
        });
        if (!friendship) throw new ForbiddenException('You must be friends to send a DM');

        const conversationId = this.convId(senderId, receiverId);
        return this.prisma.directMessage.create({
            data: { conversationId, senderId, receiverId, content },
            include: { sender: { select: { id: true, name: true, photoUrl: true } } },
        });
    }

    async getDMs(userId: string, friendId: string) {
        const conversationId = this.convId(userId, friendId);
        // Mark as read
        await this.prisma.directMessage.updateMany({
            where: { conversationId, receiverId: userId, read: false },
            data: { read: true },
        });
        return this.prisma.directMessage.findMany({
            where: { conversationId },
            include: { sender: { select: { id: true, name: true, photoUrl: true } } },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
    }

    // List DM conversations (latest message per friend)
    async getDMConversations(userId: string) {
        const friends = await this.getMyFriends(userId);
        const convs: any[] = [];

        for (const { friend, friendshipId, metAtGroupTitle } of friends) {
            const conversationId = this.convId(userId, friend.id);
            const lastMsg = await this.prisma.directMessage.findFirst({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
            });
            const unread = await this.prisma.directMessage.count({
                where: { conversationId, receiverId: userId, read: false },
            });
            convs.push({ friend, friendshipId, metAtGroupTitle, lastMessage: lastMsg, unreadCount: unread });
        }

        return convs.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
            const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
            return bTime - aTime;
        });
    }
}
