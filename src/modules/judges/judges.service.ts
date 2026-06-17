import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class JudgesService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) { }

  async create(eventId: string, body: { name: string; isHeadJudge?: boolean; }) {
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
        is_head_judge: !!body.isHeadJudge,
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

  async update(
    eventId: string,
    judgeId: string,
    body: {
      name: string;
      isHeadJudge?: boolean;
    },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException('El nombre del juez es requerido');
    }

    if (body.isHeadJudge) {
      const { error: resetError } = await this.supabase
        .from('judges')
        .update({ is_head_judge: false })
        .eq('event_id', eventId);

      if (resetError) throw new Error(resetError.message);
    }

    const { data, error } = await this.supabase
      .from('judges')
      .update({
        name: body.name.trim(),
        is_head_judge: !!body.isHeadJudge,
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