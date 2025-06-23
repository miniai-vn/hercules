import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FacebookMessageQueryDTO {
  @ApiProperty({
    description:
      'Page Access Token từ api/facebook/conversations/all để truy cập các cuộc trò chuyện của Page tương ứng',
    example: 'EABqz...ZC',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'Các trường cần lấy từ Graph API, ví dụ “message,from,to”',
    example: 'message,from,to',
  })
  fields: string;

  @ApiProperty({
    description:
      'ID của Conversation từ api/facebook/conversations/all để lấy Page tương ứng (để lấy dữ liệu cụ thể)',
  })
  id: string;
}

export class TFacebookConversatioQueryDTO {
  page_id: string;
  access_token_page: string;
  fields?: string
}

export class FacebookUserProfileQueryDTO {
  // @ApiProperty({
  //   description:
  //     'Lấy access_token tương ứng với page mong muốn, lấy access_token trong api/facebook/conversations/all',
  //   example: 'EABqz...ZC',
  // })
  // @IsString()
  // @IsNotEmpty()
  access_token: string;

  // @ApiProperty({
  //   description: 'Các trường cần lấy từ Graph API',
  //   example: 'first_name,last_name,name,profile_pic',
  // })
  fields: string;

  // @ApiProperty({
  //   description:
  //     'Lấy psid từ trong data -> to trong api/facebook/message/{id}/messageDetail',
  //   example: '29928881456756...',
  // })
  psid: string;
}
