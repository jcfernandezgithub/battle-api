import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { GenerateFixtureDto } from './dto/generate-fixture.dto';

@Controller()
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('events/:eventId/generate-fixture')
  generateFixture(
    @Param('eventId') eventId: string,
    @Body() dto: GenerateFixtureDto,
  ) {
    return this.battlesService.generateFixture(eventId, dto.targetSize);
  }

  @Get('events/:eventId/battles')
  findByEvent(@Param('eventId') eventId: string) {
    return this.battlesService.findByEvent(eventId);
  }

  @Get('events/:eventId/battles/active')
  getActiveBattle(@Param('eventId') eventId: string) {
    return this.battlesService.getActiveBattle(eventId);
  }

  @Post('battles/:battleId/start')
  startBattle(@Param('battleId') battleId: string) {
    return this.battlesService.startBattle(battleId);
  }

  @Post('battles/:battleId/close')
  closeBattle(@Param('battleId') battleId: string) {
    return this.battlesService.closeBattle(battleId);
  }
}