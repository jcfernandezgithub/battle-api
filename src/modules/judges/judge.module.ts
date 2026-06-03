// src/judges/judges.module.ts
import { Module } from '@nestjs/common';
import { JudgesController } from './judges.controller';
import { JudgesService } from './judges.service';
import { SupabaseModule } from 'src/@supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [JudgesController],
  providers: [JudgesService],
})
export class JudgesModule {}