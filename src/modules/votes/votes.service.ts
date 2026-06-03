// src/votes/votes.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { RealtimeGateway } from 'src/@realtime/realtime.gateway';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

type Side = 'A' | 'B';

@Injectable()
export class VotesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: any,
    private readonly realtimeGateway: RealtimeGateway,
  ) { }

  async vote(
    battleId: string,
    body: {
      judgeId: string;
      selections: {
        musicality: Side;
        foundation: Side;
        difficulty: Side;
        originality: Side;
        execution: Side;
      };
    },
  ) {
    const winnerSide = this.calculateWinnerSide(body.selections);

    const { data: battle, error: battleError } = await this.supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError) throw new Error(battleError.message);

    if (battle.status !== 'active') {
      throw new Error('La batalla no está activa');
    }

    const { data, error } = await this.supabase
      .from('votes')
      .upsert(
        {
          battle_id: battleId,
          judge_id: body.judgeId,
          selections: body.selections,
          winner_side: winnerSide,
        },
        {
          onConflict: 'battle_id,judge_id',
        },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    const summary = await this.getBattleVoteSummary(battleId);

    this.realtimeGateway.emitVoteReceived(battle.event_id, {
      battleId,
      judgeId: body.judgeId,
      winnerSide,
      summary,
    });

    this.realtimeGateway.emitBattleUpdated(battle.event_id, {
      ...battle,
      voteSummary: summary,
    });
    return {
      vote: data,
      summary,
    };
  }

  private calculateWinnerSide(selections: Record<string, Side>): Side {
    const values = Object.values(selections);

    const countA = values.filter((v) => v === 'A').length;
    const countB = values.filter((v) => v === 'B').length;

    if (countA === countB) {
      throw new Error('Empate inválido. Los criterios deben ser impares');
    }

    return countA > countB ? 'A' : 'B';
  }

  private async getBattleVoteSummary(battleId: string) {
    const { data, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('battle_id', battleId);

    if (error) throw new Error(error.message);

    const countA = data.filter((v) => v.winner_side === 'A').length;
    const countB = data.filter((v) => v.winner_side === 'B').length;

    return {
      totalVotes: data.length,
      countA,
      countB,
    };
  }
}