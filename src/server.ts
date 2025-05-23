import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3000;

const gameManager = new GameManager(io);

io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinGame', (roomId: string) => {
    if (!!roomId) {
      gameManager.onJoinGame(socket, roomId);
    } else {
      // error logic
    }
  });

  socket.on(
    'makeMove',
    ({ roomId, index }: { roomId: string; index: number }) => {
      if (!!roomId && !isNaN(index)) {
        gameManager.onMakeMove(socket, roomId, index);
      } else {
        //error logic
      }
    }
  );

  socket.on('disconnect', () => gameManager.onDisconnect(socket));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
