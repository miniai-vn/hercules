import { IsInt, IsOptional, IsString } from 'class-validator';
import { Users } from 'src/auth/entity/users.entity';

export class CreateOrUpdateMaterialDto {
  @IsInt()
  id?: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  status: string;

  @IsOptional()
  user?: Users;
}
