import { Module } from '@nestjs/common';
import { QualifiersController } from './qualifiers.controller';
import { QualifiersService } from './qualifiers.service';
import { SupabaseModule } from 'src/@supabase/supabase.module';
import { RealtimeModule } from 'src/@realtime/realtime.module';

@Module({
  imports: [
    SupabaseModule,
    RealtimeModule,
  ],
  controllers: [QualifiersController],
  providers: [QualifiersService],
  exports: [QualifiersService],
})
export class QualifiersModule {}