// src/judges/judges.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class JudgesService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) {}

  async create(eventId: string, body: { name: string }) {
    const accessCode = crypto.randomUUID().slice(0, 8);

    const { data, error } = await this.supabase
      .from('judges')
      .insert({
        event_id: eventId,
        name: body.name,
        access_code: accessCode,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findByEvent(eventId: string) {
    const { data, error } = await this.supabase
      .from('judges')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }
}