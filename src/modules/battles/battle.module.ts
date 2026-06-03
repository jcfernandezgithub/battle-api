// src/battles/battles.module.ts
import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { SupabaseModule } from 'src/@supabase/supabase.module';
import { BattlesController } from './battle.controller';
import { RealtimeModule } from 'src/@realtime/realtime.module';
import { QualifiersModule } from '../qualifiers/qualifiers.module';

@Module({
  imports: [SupabaseModule, RealtimeModule, QualifiersModule],
  controllers: [BattlesController],
  providers: [BattlesService],
  exports: [BattlesService],
})
export class BattlesModule { }