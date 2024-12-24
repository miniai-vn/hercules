import {
  Injectable,
  Dependencies,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Users } from './entity/users.entity';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

const saltOrRounds = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private readonly jwtService: JwtService,
  ) {
    this.jwtService = jwtService;
  }

  async register({ username, password }: LoginDto) {
    try {
      const hashedPassword = await bcrypt.hash(password, saltOrRounds);
      const user = this.usersRepository.create({
        username,
        password: hashedPassword,
      });
      return await this.usersRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException({ message: error.message });
    }
  }

  async login({ username, password }: LoginDto) {
    try {
      const user = await this.usersRepository.findOne({ where: { username } });
      if (!user) {
        throw new UnauthorizedException();
      }
      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        throw new UnauthorizedException();
      }
      const token = await this.createToken(user);
      return {
        token: token,
      };
    } catch (error) {
      throw new InternalServerErrorException({ message: error.message });
    }
  }

  async verifyToken(token) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException({ message: error.message });
    }
  }

  async createToken(user: Users) {
    return this.jwtService.sign({
      user,
    });
  }
}
