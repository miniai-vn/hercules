import { ApiProperty } from '@nestjs/swagger';

export class ChannelUserIdsDto {
  @ApiProperty({ type: [String], description: 'Array of user IDs' })
  userIds: string[];
}
