import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationService } from './integration.service';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}
}
