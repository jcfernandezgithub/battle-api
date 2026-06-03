// src/votes/votes.controller.ts
import { Body, Controller, Param, Post } from '@nestjs/common';
import { VotesService } from './votes.service';

@Controller('battles/:battleId/vote')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  vote(
    @Param('battleId') battleId: string,
    @Body()
    body: {
      judgeId: string;
      selections: {
        musicality: 'A' | 'B';
        foundation: 'A' | 'B';
        difficulty: 'A' | 'B';
        originality: 'A' | 'B';
        execution: 'A' | 'B';
      };
    },
  ) {
    return this.votesService.vote(battleId, body);
  }
}