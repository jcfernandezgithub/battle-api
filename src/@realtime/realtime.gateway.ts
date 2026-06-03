import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join:event')
  handleJoinEvent(
    @MessageBody() body: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(body.eventId);

    client.emit('joined:event', {
      eventId: body.eventId,
    });
  }

  emitBattleUpdated(eventId: string, payload: any) {
    this.server.to(eventId).emit('battle:updated', payload);
  }

  emitFixtureUpdated(eventId: string, payload: any) {
    this.server.to(eventId).emit('fixture:updated', payload);
  }

  emitVoteReceived(eventId: string, payload: any) {
    this.server.to(eventId).emit('vote:received', payload);
  }

  emitBattleClosed(eventId: string, payload: any) {
    this.server.to(eventId).emit('battle:closed', payload);
  }

  emitChampionCrowned(eventId: string, payload: any) {
    this.server.to(eventId).emit('champion:crowned', payload);
  }

  emitToEvent(eventId: string, eventName: string, payload: any) {
    this.server.to(eventId).emit(eventName, payload);
  }
}