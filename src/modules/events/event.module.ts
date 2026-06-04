// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SupabaseModule } from 'src/@supabase/supabase.module';
import { RealtimeGateway } from 'src/@realtime/realtime.gateway';

@Module({
  imports: [SupabaseModule],
  controllers: [EventsController],
  providers: [EventsService, RealtimeGateway],
  exports: [EventsService],
})
export class EventsModule { }