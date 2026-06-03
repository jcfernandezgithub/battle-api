// src/judges/judges.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JudgesService } from './judges.service';

@Controller('events/:eventId/judges')
export class JudgesController {
  constructor(private readonly judgesService: JudgesService) {}

  @Post()
  create(@Param('eventId') eventId: string, @Body() body: { name: string }) {
    return this.judgesService.create(eventId, body);
  }

  @Get()
  findByEvent(@Param('eventId') eventId: string) {
    return this.judgesService.findByEvent(eventId);
  }
}