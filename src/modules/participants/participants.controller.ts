// src/participants/participants.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
}