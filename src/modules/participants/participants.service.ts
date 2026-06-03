// src/participants/participants.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class ParticipantsService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) {}

  async create(eventId: string, body: { aka: string; crew?: string; seed?: number }) {
    const { data, error } = await this.supabase
      .from('participants')
      .insert({
        event_id: eventId,
        aka: body.aka,
        crew: body.crew ?? null,
        seed: body.seed ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findByEvent(eventId: string) {
    const { data, error } = await this.supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventId)
      .order('seed', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }
}