import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) // Assuming User is the entity class for users
    private readonly usersRepository: Repository<User>,
  ) {
  }

  async getOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['shop'], // Include relations if needed
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.usersRepository.findBy({ id: In(ids) });
  }
}
