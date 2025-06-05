import { Module } from '@nestjs/common';
import { MessageRecepientsController } from './message-recepients.controller';
import { MessageRecepientsService } from './message-recepients.service';

@Module({
  controllers: [MessageRecepientsController],
  providers: [MessageRecepientsService]
})
export class MessageRecepientsModule {}
