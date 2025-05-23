import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';
import { getLogger } from './services/Logger';
import { validateMoveIndex } from './validations/parametersValidation';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 3000;

const logger = getLogger();
const gameManager = new GameManager(io, logger);

io.on('connection', (socket: Socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('joinGame', (roomId: string) => {
    logger.info('a join game message was recieved');

    if (!!roomId) {
      gameManager.onJoinGame(socket, roomId);
    } else {
      socket.emit('error', { message: 'did not recieve a room id.' });
      // error logic
    }
  });

  socket.on('makeMove', (roomId: string, row: string, col: string) => {
    logger.info('a make move message was recieved');
    if (!roomId || !row || !col) {
      logger.warn('some parameters are missing');
      socket.emit('error', { message: 'some parameters are missing' });
    }
    let parsedRow = -1;
    let parsedCol = -1;
    try {
      parsedRow = validateMoveIndex(row, gameManager.gameSize, 'row');
      parsedCol = validateMoveIndex(col, gameManager.gameSize, 'col');
    } catch (error) {
      logger.warn(`player got the following parameters error: ${error}`);
      socket.emit('error', {
        message: `recieved an invalid parameter: ${error}`,
      });
    }

    if (parsedRow !== -1 && parsedCol !== -1) {
      gameManager.onMakeMove(socket, roomId, parsedRow, parsedCol);
    }
  });

  socket.on('disconnect', () => {
    logger.info('a disconnection message was recieved');
    gameManager.onDisconnect(socket);
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
