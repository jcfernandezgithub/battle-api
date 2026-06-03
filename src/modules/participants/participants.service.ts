import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from 'src/@supabase/supabase.provider';

@Injectable()
export class ParticipantsService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) {}

  async create(
    eventId: string,
    body: { aka: string; crew?: string; seed?: number },
  ) {
    if (!body.aka?.trim()) {
      throw new BadRequestException('El AKA es requerido');
    }

    const { data, error } = await this.supabase
      .from('participants')
      .insert({
        event_id: eventId,
        aka: body.aka.trim(),
        crew: body.crew?.trim() || null,
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

  async update(
    eventId: string,
    participantId: string,
    body: { aka?: string; crew?: string; seed?: number },
  ) {
    const updateData: any = {};

    if (body.aka !== undefined) {
      if (!body.aka.trim()) {
        throw new BadRequestException('El AKA no puede estar vacío');
      }

      updateData.aka = body.aka.trim();
    }

    if (body.crew !== undefined) {
      updateData.crew = body.crew?.trim() || null;
    }

    if (body.seed !== undefined) {
      updateData.seed = body.seed ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    const { data, error } = await this.supabase
      .from('participants')
      .update(updateData)
      .eq('id', participantId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new NotFoundException('Participante no encontrado');
    }

    return data;
  }

  async remove(eventId: string, participantId: string) {
    const { data, error } = await this.supabase
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new NotFoundException('Participante no encontrado');
    }

    return {
      success: true,
      deleted: data,
    };
  }
}