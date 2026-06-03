import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class JudgesService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) {}

  async create(eventId: string, body: { name: string }) {
    if (!body.name?.trim()) {
      throw new BadRequestException('El nombre del juez es requerido');
    }

    const accessCode = crypto.randomUUID().slice(0, 8);

    const { data, error } = await this.supabase
      .from('judges')
      .insert({
        event_id: eventId,
        name: body.name.trim(),
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

  async update(eventId: string, judgeId: string, body: { name: string }) {
    if (!body.name?.trim()) {
      throw new BadRequestException('El nombre del juez es requerido');
    }

    const { data, error } = await this.supabase
      .from('judges')
      .update({
        name: body.name.trim(),
      })
      .eq('id', judgeId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new NotFoundException('Juez no encontrado');
    }

    return data;
  }

  async remove(eventId: string, judgeId: string) {
    const { data, error } = await this.supabase
      .from('judges')
      .delete()
      .eq('id', judgeId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new NotFoundException('Juez no encontrado');
    }

    return {
      success: true,
      deleted: data,
    };
  }
}