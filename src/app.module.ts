import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeGateway } from './@realtime/realtime.gateway';
import { SupabaseModule } from './@supabase/supabase.module';
import { JudgesModule } from './modules/judges/judge.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { BattlesModule } from './modules/battles/battle.module';
import { EventsModule } from './modules/events/event.module';
import { VotesModule } from './modules/votes/votes.module';
import { QualifiersModule } from './modules/qualifiers/qualifiers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    EventsModule,
    ParticipantsModule,
    JudgesModule,
    BattlesModule,
    VotesModule,
    QualifiersModule
  ],
  providers: [RealtimeGateway],
})
export class AppModule {}