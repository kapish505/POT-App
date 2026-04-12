import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendsService } from './friends.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('friends')
export class FriendsController {
    constructor(private friendsService: FriendsService) { }

    // --- Friendships ---

    @Get()
    getMyFriends(@GetUser('id') userId: string) {
        return this.friendsService.getMyFriends(userId);
    }

    @Get('requests/incoming')
    getIncoming(@GetUser('id') userId: string) {
        return this.friendsService.getIncomingRequests(userId);
    }

    @Get('requests/outgoing')
    getOutgoing(@GetUser('id') userId: string) {
        return this.friendsService.getOutgoingRequests(userId);
    }

    @Get('status/:targetId')
    getStatus(@GetUser('id') userId: string, @Param('targetId') targetId: string) {
        return this.friendsService.getStatus(userId, targetId);
    }

    @Post('request')
    sendRequest(
        @GetUser('id') userId: string,
        @Body('addresseeId') addresseeId: string,
        @Body('metAtGroupId') metAtGroupId?: string,
    ) {
        return this.friendsService.sendRequest(userId, addresseeId, metAtGroupId);
    }

    @Patch(':id/accept')
    acceptRequest(@GetUser('id') userId: string, @Param('id') id: string) {
        return this.friendsService.acceptRequest(userId, id);
    }

    @Delete(':id')
    deleteRequest(@GetUser('id') userId: string, @Param('id') id: string) {
        return this.friendsService.deleteRequest(userId, id);
    }

    // --- Direct Messages ---

    @Get('dm/conversations')
    getDMConversations(@GetUser('id') userId: string) {
        return this.friendsService.getDMConversations(userId);
    }

    @Get('dm/:friendId')
    getDMs(@GetUser('id') userId: string, @Param('friendId') friendId: string) {
        return this.friendsService.getDMs(userId, friendId);
    }

    @Post('dm')
    sendDM(
        @GetUser('id') userId: string,
        @Body('receiverId') receiverId: string,
        @Body('content') content: string,
    ) {
        return this.friendsService.sendDM(userId, receiverId, content);
    }
}
