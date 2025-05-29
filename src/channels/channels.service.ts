import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './channels.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async create(data: Partial<Channel>): Promise<Channel> {
    const channel = this.channelRepository.create(data);
    return this.channelRepository.save(channel);
  }

  async update(id: number, data: Partial<Channel>): Promise<Channel> {
    await this.channelRepository.update(id, data);
    const updated = await this.channelRepository.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Channel not found');
    return updated;
  }

  async delete(id: number): Promise<void> {
    const result = await this.channelRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Channel not found');
  }

  async getOne(id: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async getAll(): Promise<Channel[]> {
    return this.channelRepository.find();
  }

  async getByDepartmentId(departmentId: number): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { departmentId },
    });
  }
}
