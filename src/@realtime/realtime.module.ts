// src/realtime/realtime.module.ts
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  providers: [
    RealtimeGateway,
  ],
  exports: [
    RealtimeGateway,
  ],
})
export class RealtimeModule { }