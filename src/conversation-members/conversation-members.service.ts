import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from 'src/messages/messages.entity';
import { Repository } from 'typeorm';
import {
  AddMultipleParticipantsDto,
  AddParticipantDto,
  UpdateMemberSettingsDto,
} from './conversation-members.dto';
import {
  ConversationMember,
  ParticipantType,
} from './conversation-members.entity';

@Injectable()
export class ConversationMembersService {
  constructor(
    @InjectRepository(ConversationMember)
    private memberRepository: Repository<ConversationMember>,
  ) {}

  async addParticipant(
    conversationId: number,
    addParticipantDto: AddParticipantDto,
  ): Promise<ConversationMember> {
    try {
      const {
        participantType,
        customerId,
        userId,
        role = 'member',
        notificationsEnabled = true,
        nickname,
      } = addParticipantDto;

      const existingMember = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType,
          ...(customerId && { customerId }),
          ...(userId && { userId }),
          leftAt: null, // Only check active members
        },
      });

      if (existingMember) {
        // Instead of throwing an error, return the existing member
        return existingMember;
      }

      // Check if there's a previous inactive membership and reactivate it
      const inactiveMember = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType,
          ...(customerId && { customerId }),
          ...(userId && { userId }),
        },
      });

      if (inactiveMember) {
        // Reactivate the member with updated settings
        inactiveMember.leftAt = null;
        inactiveMember.memberSettings = {
          ...inactiveMember.memberSettings,
          role,
          notifications_enabled: notificationsEnabled,
          ...(nickname && { nickname }),
        };
        return await this.memberRepository.save(inactiveMember);
      }

      // Create new member with proper settings structure
      const member = this.memberRepository.create({
        conversationId,
        participantType,
        customerId,
        userId,
        memberSettings: {
          role,
          notifications_enabled: notificationsEnabled,
          ...(nickname && { nickname }),
        },
      });

      return await this.memberRepository.save(member);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to add participant: ${error.message}`,
      );
    }
  }

  async addMultipleParticipants(
    conversationId: number,
    addMultipleDto: AddMultipleParticipantsDto,
  ): Promise<ConversationMember[]> {
    const addedMembers: ConversationMember[] = [];
    const errors: string[] = [];

    for (const participant of addMultipleDto.participants) {
      try {
        const member = await this.addParticipant(conversationId, participant);
        addedMembers.push(member);
      } catch (error) {
        throw new InternalServerErrorException(
          'Server internal error while adding participants',
        );
      }
    }

    // Only throw an error if no members were added at all
    if (addedMembers.length === 0 && errors.length > 0) {
      throw new InternalServerErrorException(
        `Failed to add any participants: ${errors.join('; ')}`,
      );
    }

    return addedMembers;
  }

  async removeParticipant(memberId: number): Promise<number> {
    try {
      await this.memberRepository.delete(memberId);
      return memberId;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to remove participant: ${error.message}`,
      );
    }
  }

  async removeParticipantByUserOrCustomerId(
    conversationId: number,
    participantType: ParticipantType,
    participantId: string,
  ): Promise<void> {
    try {
      const member = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType,
          ...(participantType === ParticipantType.USER
            ? { userId: participantId }
            : { customerId: participantId }),
          leftAt: null, // Only active members
        },
      });

      if (!member) {
        throw new NotFoundException('Conversation member not found');
      }

      member.leftAt = new Date();
      await this.memberRepository.save(member);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to remove participant: ${error.message}`,
      );
    }
  }

  async getConversationMembers(
    conversationId: number,
    includeInactive: boolean = false,
  ): Promise<ConversationMember[]> {
    try {
      const members = await this.memberRepository.find({
        where: {
          conversationId,
          ...(includeInactive ? {} : { leftAt: null }),
        },
        relations: ['customer', 'user', 'lastMessage'],
      });

      if (!members || members.length === 0) {
        return [];
      }

      return members;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve members: ${error.message}`,
      );
    }
  }

  async getMemberById(memberId: number): Promise<ConversationMember> {
    try {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
        relations: ['customer', 'user', 'lastMessage'],
      });

      if (!member) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      return member;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve member: ${error.message}`,
      );
    }
  }

  async updateLastMessage(
    memberId: number,
    message: Message,
  ): Promise<ConversationMember> {
    try {
      await this.memberRepository.update(memberId, {
        lastMessage: message,
      });
      return await this.memberRepository.findOne({
        where: { id: memberId },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update last message: ${error.message}`,
      );
    }
  }

  async updateMemberSettings(
    memberId: number,
    updateDto: UpdateMemberSettingsDto,
  ): Promise<ConversationMember> {
    try {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Update member settings using the DTO structure
      member.memberSettings = {
        ...member.memberSettings,
        ...(updateDto.role && { role: updateDto.role }),
        ...(updateDto.notifications_enabled !== undefined && {
          notifications_enabled: updateDto.notifications_enabled,
        }),
        ...(updateDto.nickname && { nickname: updateDto.nickname }),
        ...(updateDto.additionalSettings && {
          ...updateDto.additionalSettings,
        }),
      };

      return await this.memberRepository.save(member);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update member settings: ${error.message}`,
      );
    }
  }

  async isMemberOfConversation(
    conversationId: number,
    participantType: ParticipantType,
    participantId: string,
  ): Promise<boolean> {
    try {
      const member = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType,
          ...(participantType === ParticipantType.USER
            ? { userId: participantId }
            : { customerId: participantId }),
          leftAt: null, // Only active members
        },
      });

      return !!member;
    } catch (error) {
      console.error(`Error checking membership: ${error.message}`);
      return false;
    }
  }

  async isAdmin(conversationId: number, userId: string): Promise<boolean> {
    try {
      const member = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType: ParticipantType.USER,
          userId,
          leftAt: null,
        },
      });

      if (!member) return false;

      return member.memberSettings?.role === 'admin';
    } catch (error) {
      console.error(`Error checking admin status: ${error.message}`);
      return false;
    }
  }

  async getConversationsForParticipant(
    participantType: ParticipantType,
    participantId: string,
  ): Promise<number[]> {
    try {
      const members = await this.memberRepository.find({
        where: {
          participantType,
          ...(participantType === ParticipantType.USER
            ? { userId: participantId }
            : { customerId: participantId }),
          leftAt: null, // Only active memberships
        },
        select: ['conversationId'],
      });

      return members.map((member) => member.conversationId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve conversations: ${error.message}`,
      );
    }
  }
}
