import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/pos',
})
export class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PosGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBranch')
  handleJoinBranch(@ConnectedSocket() client: Socket, @MessageBody() data: { branchId: string; tenantId: string }) {
    const room = `${data.tenantId}:${data.branchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { status: 'joined', room };
  }

  emitOrderUpdate(tenantId: string, branchId: string, event: string, data: object) {
    const room = `${tenantId}:${branchId}`;
    this.server.to(room).emit(event, data);
  }

  emitKOTUpdate(tenantId: string, branchId: string, kot: object) {
    this.emitOrderUpdate(tenantId, branchId, 'kot:update', kot);
  }

  emitTableUpdate(tenantId: string, branchId: string, table: object) {
    this.emitOrderUpdate(tenantId, branchId, 'table:update', table);
  }

  emitOrderCompleted(tenantId: string, branchId: string, order: object) {
    this.emitOrderUpdate(tenantId, branchId, 'order:completed', order);
  }
}
