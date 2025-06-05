import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AddMultipleParticipantsDto,
  AddParticipantDto,
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
  ) {
    try {
      const {
        participantType,
        customerId,
        userId,
        role,
        notificationsEnabled,
      } = addParticipantDto;

      // Validate that the correct ID is provided for the participant type
      if (participantType === ParticipantType.CUSTOMER && !customerId) {
        throw new BadRequestException(
          'Customer ID is required for customer participants',
        );
      }

      if (participantType === ParticipantType.USER && !userId) {
        throw new BadRequestException(
          'User ID is required for user participants',
        );
      }

      // Check if participant already exists in conversation
      const existingMember = await this.memberRepository.findOne({
        where: {
          conversationId,
          participantType,
          ...(customerId && { customerId }),
          ...(userId && { userId }),
          isActive: true,
        },
      });

      if (existingMember) {
        throw new BadRequestException(
          'Participant already exists in conversation',
        );
      }

      // Create new member - let database handle foreign key constraints
      const member = this.memberRepository.create({
        conversationId,
        participantType,
        customerId,
        userId,
        joinedAt: new Date(),
        isActive: true,
        memberSettings: {
          role: role ?? 'member',
          notifications_enabled: notificationsEnabled ?? true,
        } as any, // Cast as any if memberSettings expects a specific type
      });

      return await this.memberRepository.save(member);
    } catch (error) {
      throw new InternalServerErrorException('Failed to add participant');
    }
  }

  async addMultipleParticipants(
    conversationId: number,
    addMultipleDto: AddMultipleParticipantsDto,
  ): Promise<ConversationMember[]> {
    const addedMembers: ConversationMember[] = [];

    for (const participant of addMultipleDto.participants) {
      try {
        const member = await this.addParticipant(conversationId, participant);
        addedMembers.push(member);
      } catch (error) {
        // Log error but continue with other participants
        console.error(
          `Failed to add participant ${participant.customerId || participant.userId}:`,
          error.message,
        );
      }
    }

    return addedMembers;
  }

  async removeParticipant(memberId: number): Promise<void> {
    try {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundException('Conversation member not found');
      }

      // Soft remove - mark as inactive and set left_at
      member.isActive = false;
      member.leftAt = new Date();
      await this.memberRepository.save(member);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async getConversationMembers(
    conversationId: number,
  ): Promise<ConversationMember[]> {
    try {
      const members = await this.memberRepository.find({
        where: { conversationId, isActive: true },
        relations: ['customer', 'user', 'memberSettings'],
      });

      if (!members || members.length === 0) {
        throw new NotFoundException(
          'No active members found for this conversation',
        );
      }

      return members;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve members');
    }
  }
}
