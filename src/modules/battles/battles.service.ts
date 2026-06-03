// src/battles/battles.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { RealtimeGateway } from 'src/@realtime/realtime.gateway';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';
import { BattleInsert } from './battle.types';

@Injectable()
export class BattlesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: any,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private getRoundPriority(round: string): number {
    const order: Record<string, number> = {
      round_of_32: 1,
      round_of_16: 2,
      quarterfinal: 3,
      semifinal: 4,
      final: 5,
    };

    return order[round] ?? 99;
  }

  private getRoundLabel(round: string): string {
    const labels: Record<string, string> = {
      round_of_32: 'TOP 32',
      round_of_16: 'TOP 16',
      quarterfinal: 'TOP 8',
      semifinal: 'SEMIFINAL',
      final: 'FINAL',
    };

    return labels[round] ?? round;
  }

  async findByEvent(eventId: string) {
    const { data, error } = await this.supabase
      .from('battles')
      .select(`
        *,
        participant_a:participant_a_id(*),
        participant_b:participant_b_id(*),
        winner:winner_id(*)
      `)
      .eq('event_id', eventId)
      .order('round', { ascending: true })
      .order('position', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  private getVisualFirstRoundPositions(totalBattles: number): number[] {
    if (totalBattles === 1) return [1];

    const left: number[] = [];
    const right: number[] = [];

    for (let position = 1; position <= totalBattles; position++) {
      if (position <= totalBattles / 2) {
        left.push(position);
      } else {
        right.push(position);
      }
    }

    const result: number[] = [];

    for (let i = 0; i < left.length; i++) {
      result.push(left[i]);

      if (right[i] !== undefined) {
        result.push(right[i]);
      }
    }

    return result;
  }

  async generateFixture(eventId: string) {
    const { data: participants, error } = await this.supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw new Error(error.message);

    if (!participants || participants.length < 2) {
      throw new Error('Necesitás al menos 2 participantes');
    }

    if (![2, 4, 8, 16, 32].includes(participants.length)) {
      throw new Error('Por ahora el fixture acepta 2, 4, 8, 16 o 32 participantes');
    }

    const { data: existingBattles, error: existingBattlesError } =
      await this.supabase
        .from('battles')
        .select('id')
        .eq('event_id', eventId);

    if (existingBattlesError) {
      throw new Error(existingBattlesError.message);
    }

    const battleIds = existingBattles?.map((b) => b.id) ?? [];

    if (battleIds.length > 0) {
      const { error: votesDeleteError } = await this.supabase
        .from('votes')
        .delete()
        .in('battle_id', battleIds);

      if (votesDeleteError) {
        throw new Error(votesDeleteError.message);
      }
    }

    const { error: battlesDeleteError } = await this.supabase
      .from('battles')
      .delete()
      .eq('event_id', eventId);

    if (battlesDeleteError) {
      throw new Error(battlesDeleteError.message);
    }

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    const totalParticipants = shuffled.length;
    const totalRounds = Math.log2(totalParticipants);

    const rounds: any[][] = [];

    const firstRound: BattleInsert[] = [];
    const totalFirstRoundBattles = totalParticipants / 2;
    const visualPositions = this.getVisualFirstRoundPositions(totalFirstRoundBattles);

    for (let i = 0; i < totalParticipants; i += 2) {
      const battleIndex = i / 2;

      firstRound.push({
        event_id: eventId,
        round: this.getRoundName(totalParticipants),
        position: visualPositions[battleIndex],
        participant_a_id: shuffled[i].id,
        participant_b_id: shuffled[i + 1].id,
        status: 'pending',
        next_battle_id: null,
        next_slot: null,
      });
    }

    const { data: insertedFirstRound, error: firstRoundError } =
      await this.supabase
        .from('battles')
        .insert(firstRound)
        .select();

    if (firstRoundError) throw new Error(firstRoundError.message);

    rounds.push(insertedFirstRound);

    let battlesInRound = insertedFirstRound.length / 2;

    for (let roundIndex = 2; roundIndex <= totalRounds; roundIndex++) {
      const participantsInThisRound =
        totalParticipants / Math.pow(2, roundIndex - 1);

      const roundBattles: BattleInsert[] = [];

      for (let position = 1; position <= battlesInRound; position++) {
        roundBattles.push({
          event_id: eventId,
          round: this.getRoundName(participantsInThisRound),
          position,
          participant_a_id: null,
          participant_b_id: null,
          status: 'pending',
          next_battle_id: null,
          next_slot: null,
        });
      }

      const { data: insertedRound, error: roundError } = await this.supabase
        .from('battles')
        .insert(roundBattles)
        .select();

      if (roundError) throw new Error(roundError.message);

      rounds.push(insertedRound);

      battlesInRound = battlesInRound / 2;
    }

    for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
      const currentRound = [...rounds[roundIndex]].sort(
        (a, b) => a.position - b.position,
      );

      const nextRound = [...rounds[roundIndex + 1]].sort(
        (a, b) => a.position - b.position,
      );

      for (const battle of currentRound) {
        const nextBattleIndex = Math.floor((battle.position - 1) / 2);
        const nextBattle = nextRound[nextBattleIndex];

        const nextSlot = battle.position % 2 === 1 ? 'A' : 'B';

        const { error: updateError } = await this.supabase
          .from('battles')
          .update({
            next_battle_id: nextBattle.id,
            next_slot: nextSlot,
          })
          .eq('id', battle.id);

        if (updateError) throw new Error(updateError.message);

        battle.next_battle_id = nextBattle.id;
        battle.next_slot = nextSlot;
      }
    }

    const fixture = await this.findByEvent(eventId);

    this.realtimeGateway.emitFixtureUpdated(eventId, fixture);

    return fixture;
  }

  async startBattle(battleId: string) {
    const { data: battle, error: battleError } = await this.supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError) throw new Error(battleError.message);

    if (!battle.participant_a_id || !battle.participant_b_id) {
      throw new Error('La batalla no tiene ambos participantes definidos');
    }

    if (battle.status === 'closed') {
      throw new Error('No se puede iniciar una batalla ya cerrada');
    }

    const currentRoundPriority = this.getRoundPriority(battle.round);

    const { data: previousBattles, error: previousBattlesError } =
      await this.supabase
        .from('battles')
        .select('*')
        .eq('event_id', battle.event_id)
        .neq('status', 'closed');

    if (previousBattlesError) {
      throw new Error(previousBattlesError.message);
    }

    const hasPreviousRoundPending = previousBattles.some((b) => {
      return this.getRoundPriority(b.round) < currentRoundPriority;
    });

    if (hasPreviousRoundPending) {
      throw new Error(
        `Primero tenés que completar todas las batallas de la ronda anterior antes de iniciar ${this.getRoundLabel(battle.round)}`,
      );
    }

    const { error: deactivateError } = await this.supabase
      .from('battles')
      .update({ status: 'pending' })
      .eq('event_id', battle.event_id)
      .eq('status', 'active');

    if (deactivateError) throw new Error(deactivateError.message);

    const { data, error } = await this.supabase
      .from('battles')
      .update({ status: 'active' })
      .eq('id', battleId)
      .select(`
        *,
        participant_a:participant_a_id(*),
        participant_b:participant_b_id(*)
      `)
      .single();

    if (error) throw new Error(error.message);

    const fixture = await this.findByEvent(data.event_id);

    this.realtimeGateway.emitBattleUpdated(data.event_id, data);
    this.realtimeGateway.emitFixtureUpdated(data.event_id, fixture);

    return data;
  }

  async closeBattle(battleId: string) {
    const { data: votes, error: votesError } = await this.supabase
      .from('votes')
      .select('*')
      .eq('battle_id', battleId);

    if (votesError) throw new Error(votesError.message);

    if (!votes || votes.length === 0) {
      throw new Error('No hay votos cargados para esta batalla');
    }

    const countA = votes.filter((v) => v.winner_side === 'A').length;
    const countB = votes.filter((v) => v.winner_side === 'B').length;

    if (countA === countB) {
      throw new Error('Empate detectado. Revisar cantidad impar de jueces');
    }

    const winnerSide = countA > countB ? 'A' : 'B';

    const { data: battle, error: battleError } = await this.supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError) throw new Error(battleError.message);

    const winnerId =
      winnerSide === 'A'
        ? battle.participant_a_id
        : battle.participant_b_id;

    const { data: updatedBattle, error: updateError } = await this.supabase
      .from('battles')
      .update({
        status: 'closed',
        winner_id: winnerId,
      })
      .eq('id', battleId)
      .select(`
        *,
        participant_a:participant_a_id(*),
        participant_b:participant_b_id(*),
        winner:winner_id(*)
      `)
      .single();

    if (updateError) throw new Error(updateError.message);

    const winner =
      winnerSide === 'A'
        ? updatedBattle.participant_a
        : updatedBattle.participant_b;

    if (battle.next_battle_id && battle.next_slot) {
      const updateField =
        battle.next_slot === 'A'
          ? { participant_a_id: winnerId }
          : { participant_b_id: winnerId };

      const { error: nextBattleError } = await this.supabase
        .from('battles')
        .update(updateField)
        .eq('id', battle.next_battle_id);

      if (nextBattleError) throw new Error(nextBattleError.message);
    }

    let championPayload: any = null;

    if (!battle.next_battle_id) {
      const { error: eventUpdateError } = await this.supabase
        .from('events')
        .update({
          status: 'finished',
          champion_id: winnerId,
        })
        .eq('id', battle.event_id);

      if (eventUpdateError) throw new Error(eventUpdateError.message);

      championPayload = {
        champion: winner,
        battle: updatedBattle,
      };
    }

    const fixture = await this.findByEvent(updatedBattle.event_id);

    this.realtimeGateway.emitBattleClosed(updatedBattle.event_id, {
      battle: {
        ...updatedBattle,
        result: {
          winnerSide,
          countA,
          countB,
        },
      },
      winner,
      result: {
        winnerSide,
        countA,
        countB,
      },
    });

    this.realtimeGateway.emitBattleUpdated(updatedBattle.event_id, {
      ...updatedBattle,
      result: {
        winnerSide,
        countA,
        countB,
      },
    });

    this.realtimeGateway.emitFixtureUpdated(updatedBattle.event_id, fixture);

    if (championPayload) {
      this.realtimeGateway.emitChampionCrowned(updatedBattle.event_id, championPayload);
    }

    return {
      battle: updatedBattle,
      winner,
      result: {
        winnerSide,
        countA,
        countB,
      },
    };
  }

  private getRoundName(totalParticipants: number) {
    if (totalParticipants === 2) return 'final';
    if (totalParticipants === 4) return 'semifinal';
    if (totalParticipants === 8) return 'quarterfinal';
    if (totalParticipants === 16) return 'round_of_16';
    if (totalParticipants === 32) return 'round_of_32';
    return 'round';
  }

  async getActiveBattle(eventId: string) {
    const { data, error } = await this.supabase
      .from('battles')
      .select(`
        *,
        participant_a:participant_a_id(*),
        participant_b:participant_b_id(*),
        winner:winner_id(*)
      `)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw new Error(error.message);

    return data;
  }
}