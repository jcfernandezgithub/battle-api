// src/events/events.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  create(@Body() body: { name: string }) {
    return this.eventsService.create(body.name);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':eventId/live-state')
  getLiveState(@Param('eventId') eventId: string) {
    return this.eventsService.getLiveState(eventId);
  }

  @Post('events/:eventId/screen-mode')
  setScreenMode(
    @Param('eventId') eventId: string,
    @Body() body: { mode: string },
  ) {
    return this.eventsService.setScreenMode(eventId, body.mode);
  }
}