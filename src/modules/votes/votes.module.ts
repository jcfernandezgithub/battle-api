// src/votes/votes.module.ts
import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { RealtimeModule } from 'src/@realtime/realtime.module';
import { SupabaseModule } from 'src/@supabase/supabase.module';

@Module({
  imports: [SupabaseModule, RealtimeModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}