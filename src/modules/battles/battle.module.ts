// src/battles/battles.module.ts
import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { SupabaseModule } from 'src/@supabase/supabase.module';
import { BattlesController } from './battle.controller';
import { RealtimeModule } from 'src/@realtime/realtime.module';

@Module({
  imports: [SupabaseModule, RealtimeModule],
  controllers: [BattlesController],
  providers: [BattlesService],
  exports: [BattlesService],
})
export class BattlesModule {}