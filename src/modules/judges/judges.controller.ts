import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { JudgesService } from './judges.service';

@Controller('events/:eventId/judges')
export class JudgesController {
  constructor(private readonly judgesService: JudgesService) { }

  @Post()
  create(@Param('eventId') eventId: string, @Body() body: { name: string, isHeadJudge?: boolean; }) {
    return this.judgesService.create(eventId, body);
  }

  @Get()
  findByEvent(@Param('eventId') eventId: string) {
    return this.judgesService.findByEvent(eventId);
  }

  @Patch(':judgeId')
  update(
    @Param('eventId') eventId: string,
    @Param('judgeId') judgeId: string,
    @Body() body: { name: string },
  ) {
    return this.judgesService.update(eventId, judgeId, body);
  }

  @Delete(':judgeId')
  remove(
    @Param('eventId') eventId: string,
    @Param('judgeId') judgeId: string,
  ) {
    return this.judgesService.remove(eventId, judgeId);
  }
}