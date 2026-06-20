import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QualifiersService } from './qualifiers.service';
import { QualifierVoteDto } from './qualifiers.types';

@Controller('events/:eventId/qualifier')
export class QualifiersController {
  constructor(private readonly qualifiersService: QualifiersService) { }

  @Get('next') // <-- Muévelo aquí arriba
  getNextToQualify(@Param('eventId') eventId: string) {
    return this.qualifiersService.getNextToQualify(eventId);
  }

  @Get('state')
  getState(@Param('eventId') eventId: string) {
    return this.qualifiersService.getState(eventId);
  }

  @Get('active')
  getActive(@Param('eventId') eventId: string) {
    return this.qualifiersService.getActiveQualifier(eventId);
  }

  @Get('ranking')
  getRanking(@Param('eventId') eventId: string) {
    return this.qualifiersService.getRanking(eventId);
  }

  @Get('top-32')
  getTop32(@Param('eventId') eventId: string) {
    return this.qualifiersService.getTop32(eventId);
  }

  @Post('start')
  start(@Param('eventId') eventId: string) {
    return this.qualifiersService.startQualifier(eventId);
  }

  @Post('current/:participantId')
  setCurrentParticipant(
    @Param('eventId') eventId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.qualifiersService.setCurrentParticipant(eventId, participantId);
  }

  @Post('vote')
  vote(
    @Param('eventId') eventId: string,
    @Body() dto: QualifierVoteDto,
  ) {
    return this.qualifiersService.vote(eventId, dto);
  }

  @Post('close')
  close(@Param('eventId') eventId: string) {
    return this.qualifiersService.closeQualifier(eventId);
  }
}