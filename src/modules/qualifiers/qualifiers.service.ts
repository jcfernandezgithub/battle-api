import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RealtimeGateway } from 'src/@realtime/realtime.gateway';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';
import { QualifierVoteDto } from './qualifiers.types';

@Injectable()
export class QualifiersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: any,
    private readonly realtimeGateway: RealtimeGateway,
  ) { }

  async startQualifier(eventId: string) {
    const { data: existing, error: existingError } = await this.supabase
      .from('qualifier_sessions')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingError) {
      throw new BadRequestException(existingError.message);
    }

    if (existing) {
      return existing;
    }

    const { data, error } = await this.supabase
      .from('qualifier_sessions')
      .insert({
        event_id: eventId,
        mode: 'preselection',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    this.realtimeGateway.emitToEvent(eventId, 'qualifier:started', data);

    return data;
  }

  async getActiveQualifier(eventId: string) {
    return this.getActiveSession(eventId);
  }

  async setCurrentParticipant(eventId: string, participantId: string) {
    const session = await this.getActiveSession(eventId);

    const { data: participant, error: participantError } = await this.supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (participantError) {
      throw new BadRequestException(participantError.message);
    }

    if (!participant) {
      throw new NotFoundException('Participante no encontrado para este evento');
    }

    const { data, error } = await this.supabase
      .from('qualifier_sessions')
      .update({
        current_participant_id: participantId,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    this.realtimeGateway.emitToEvent(eventId, 'qualifier:current', {
      session: data,
      participant,
    });

    return {
      session: data,
      participant,
    };
  }

  async vote(eventId: string, dto: QualifierVoteDto) {
    if (![0, 1, 2].includes(dto.score)) {
      throw new BadRequestException('Score inválido');
    }

    const session = await this.getActiveSession(eventId);

    const { data: participant, error: participantError } = await this.supabase
      .from('participants')
      .select('*')
      .eq('id', dto.participantId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (participantError) {
      throw new BadRequestException(participantError.message);
    }

    if (!participant) {
      throw new NotFoundException('Participante no encontrado');
    }

    const { data, error } = await this.supabase
      .from('qualifier_votes')
      .upsert(
        {
          session_id: session.id,
          event_id: eventId,
          participant_id: dto.participantId,
          judge_id: dto.judgeId,
          score: dto.score,
        },
        {
          onConflict: 'session_id,participant_id,judge_id',
        },
      )
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    const ranking = await this.getRanking(eventId);

    this.realtimeGateway.emitToEvent(eventId, 'qualifier:vote', data);
    this.realtimeGateway.emitToEvent(eventId, 'qualifier:ranking:update', ranking);

    return data;
  }

  async getRanking(eventId: string) {
    const session = await this.getLastSession(eventId);

    const { data, error } = await this.supabase
      .from('qualifier_votes')
      .select(`
    participant_id,
    judge_id,
    score,
    participants (
      id,
      aka,
      crew
    ),
    judges (
      id,
      is_head_judge
    )
  `)
      .eq('session_id', session.id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const rankingMap = new Map<string, any>();

    for (const vote of data ?? []) {
      const participant = Array.isArray(vote.participants)
        ? vote.participants[0]
        : vote.participants;

      if (!rankingMap.has(vote.participant_id)) {
        rankingMap.set(vote.participant_id, {
          participant,
          totalScore: 0,
          votes: 0,
          strongPicks: 0,
          picks: 0,
          noPicks: 0,
          headJudgeScore: null,
        });
      }

      const item = rankingMap.get(vote.participant_id);

      item.totalScore += vote.score;
      item.votes += 1;

      if (vote.score === 2) item.strongPicks += 1;
      if (vote.score === 1) item.picks += 1;
      if (vote.score === 0) item.noPicks += 1;

      const judge = Array.isArray(vote.judges)
        ? vote.judges[0]
        : vote.judges;

      if (judge?.is_head_judge) {
        item.headJudgeScore = vote.score;
      }
    }

    return Array.from(rankingMap.values()).sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      if (b.strongPicks !== a.strongPicks) {
        return b.strongPicks - a.strongPicks;
      }

      if (b.picks !== a.picks) {
        return b.picks - a.picks;
      }

      if (a.noPicks !== b.noPicks) {
        return a.noPicks - b.noPicks;
      }

      const aHeadJudgeScore = a.headJudgeScore ?? -1;
      const bHeadJudgeScore = b.headJudgeScore ?? -1;

      if (bHeadJudgeScore !== aHeadJudgeScore) {
        return bHeadJudgeScore - aHeadJudgeScore;
      }

      return a.participant?.aka?.localeCompare(b.participant?.aka ?? '') ?? 0;
    });
  }

  async closeQualifier(eventId: string) {
    const session = await this.getActiveSession(eventId);

    const ranking = await this.getRanking(eventId);

    const { data, error } = await this.supabase
      .from('qualifier_sessions')
      .update({
        status: 'closed',
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    this.realtimeGateway.emitToEvent(eventId, 'qualifier:closed', {
      session: data,
      ranking,
    });

    return {
      session: data,
      ranking,
    };
  }

  async getTop32(eventId: string) {
    const ranking = await this.getRanking(eventId);

    return ranking.slice(0, 32);
  }

  private async getActiveSession(eventId: string) {
    const { data, error } = await this.supabase
      .from('qualifier_sessions')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('No hay clasificatoria activa');
    }

    return data;
  }

  private async getLastSession(eventId: string) {
    const { data, error } = await this.supabase
      .from('qualifier_sessions')
      .select('*')
      .eq('event_id', eventId)
      .in('status', ['active', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('No hay clasificatoria para este evento');
    }

    return data;
  }

  async getState(eventId: string) {
    const { data: session, error } = await this.supabase
      .from('qualifier_sessions')
      .select(`
      *,
      participants (
        id,
        aka,
        crew
      )
    `)
      .eq('event_id', eventId)
      .in('status', ['active', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!session) {
      return {
        session: null,
        currentParticipant: null,
        ranking: [],
        top32: [],
      };
    }

    const ranking = await this.getRanking(eventId);

    const currentParticipant = Array.isArray(session.participants)
      ? session.participants[0]
      : session.participants;

    return {
      session,
      currentParticipant,
      ranking,
      top32: ranking.slice(0, 32),
    };
  }

  async getQualifiedParticipants(eventId: string, targetSize = 32) {
    const ranking = await this.getRanking(eventId);

    if (ranking.length < targetSize) {
      throw new BadRequestException(
        `La clasificatoria todavía no tiene ${targetSize} participantes con votos`,
      );
    }

    return ranking
      .slice(0, targetSize)
      .map(item => item.participant);
  }

  async getNextToQualify(eventId: string) {
    const session = await this.getLastSession(eventId);
    // Asumo que tu objeto 'session' tiene el 'current_participant_id' guardado 
    // que representa al competidor que está ahora mismo en la tarima.
    const currentParticipantId = session?.current_participant_id;

    const { data: participants, error: participantsError } = await this.supabase
      .from('participants')
      .select('id, aka, crew, seed')
      .eq('event_id', eventId)
      .order('seed', { ascending: true });

    if (participantsError) {
      throw new BadRequestException(participantsError.message);
    }

    const { data: votes, error: votesError } = await this.supabase
      .from('qualifier_votes')
      .select('participant_id')
      .eq('session_id', session.id)
      .eq('event_id', eventId);

    if (votesError) {
      throw new BadRequestException(votesError.message);
    }

    // 1. Guardamos los IDs de los que YA fueron votados (Pasado)
    const votedParticipantIds = new Set(
      (votes ?? []).map(vote => vote.participant_id),
    );

    // 2. El siguiente será el primero que:
    //    - NO haya sido votado todavía (no está en votedParticipantIds)
    //    - Y TAMPOCO sea el que está compitiendo ahora mismo (currentParticipantId)
    const nextParticipant = (participants ?? []).find(
      participant =>
        !votedParticipantIds.has(participant.id) &&
        participant.id !== currentParticipantId
    );

    return {
      participant: nextParticipant ?? null,
    };
  }
}