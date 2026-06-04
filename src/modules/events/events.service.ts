// src/events/events.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { RealtimeGateway } from 'src/@realtime/realtime.gateway';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class EventsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: any,
    private readonly realtimeGateway: RealtimeGateway
  ) { }

  async create(name: string) {
    const { data, error } = await this.supabase
      .from('events')
      .insert({ name })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async getLiveState(eventId: string) {
    const { data: event, error: eventError } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw new Error(eventError.message);

    const { data: activeBattles, error: activeBattleError } = await this.supabase
      .from('battles')
      .select(`
    *,
    participant_a:participant_a_id(*),
    participant_b:participant_b_id(*),
    winner:winner_id(*)
  `)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeBattleError) throw new Error(activeBattleError.message);

    const activeBattle = activeBattles?.[0] ?? null;

    const { data: fixture, error: fixtureError } = await this.supabase
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

    if (fixtureError) throw new Error(fixtureError.message);

    let voteSummary = {
      totalVotes: 0,
      countA: 0,
      countB: 0,
    };

    if (activeBattle) {
      const { data: votes, error: votesError } = await this.supabase
        .from('votes')
        .select('*')
        .eq('battle_id', activeBattle.id);

      if (votesError) throw new Error(votesError.message);

      voteSummary = {
        totalVotes: votes.length,
        countA: votes.filter((v) => v.winner_side === 'A').length,
        countB: votes.filter((v) => v.winner_side === 'B').length,
      };
    }

    return {
      event,
      activeBattle,
      fixture,
      voteSummary,
    };
  }

  async setScreenMode(eventId: string, mode: string) {
    const allowed = ['auto', 'battle', 'fixture', 'qualifier', 'ranking', 'blank'];

    if (!allowed.includes(mode)) {
      throw new Error('Modo de pantalla inválido');
    }

    const { data, error } = await this.supabase
      .from('events')
      .update({ screen_mode: mode })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    this.realtimeGateway.emitToEvent(eventId, 'screen:mode', {
      mode,
    });

    return data;
  }
}