import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ParticipantsService } from './participants.service';

@Controller('events/:eventId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  create(
    @Param('eventId') eventId: string,
    @Body() body: { aka: string; crew?: string; seed?: number },
  ) {
    return this.participantsService.create(eventId, body);
  }

  @Get()
  findByEvent(@Param('eventId') eventId: string) {
    return this.participantsService.findByEvent(eventId);
  }

  @Patch(':participantId')
  update(
    @Param('eventId') eventId: string,
    @Param('participantId') participantId: string,
    @Body() body: { aka?: string; crew?: string; seed?: number },
  ) {
    return this.participantsService.update(eventId, participantId, body);
  }

  @Delete(':participantId')
  remove(
    @Param('eventId') eventId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.participantsService.remove(eventId, participantId);
  }
}