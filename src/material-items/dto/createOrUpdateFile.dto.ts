import { IsInt, IsString } from 'class-validator';
import { Users } from 'src/auth/entity/users.entity';

export class CreateOrUpdateFileDto {
  @IsInt()
  id?: number;

  @IsString()
  size: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  path: string;

  user: Users;
}
