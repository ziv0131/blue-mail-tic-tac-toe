import { Socket, Server } from 'socket.io';
import { Board, Game, PlayerSymbol } from './models/Game';
import { Logger } from 'winston';

export class GameManager {
  private games: Record<string, Game> = {};
  private logger: Logger;
  public gameSize: number;
  public server: Server;

  constructor(serverReference: Server, logger: Logger) {
    this.server = serverReference;
    this.logger = logger;
    const envGameSize = parseInt(process.env.GAME_SIZE || '');
    if (isNaN(envGameSize)) {
      this.gameSize = 3;
      this.logger.error('GAME_SIZE env variable is missing');
    } else {
      this.gameSize = envGameSize;
    }
  }

  onJoinGame = (socket: Socket, roomId: string) => {
    try {
      if (!this.games[roomId]) {
        this.logger.info(`room ${roomId} does not exist: creating it.`);
        this.games[roomId] = {
          board: Array.from({ length: this.gameSize }, () =>
            Array(this.gameSize).fill(null)
          ),
          turn: 'X',
          players: [],
        };
      }

      const game = this.games[roomId];
      if (game.players.length < 2) {
        this.logger.info('player joining the game');

        game.players.push(socket.id);
        socket.join(roomId);
        const symbol: PlayerSymbol =
          game.players.indexOf(socket.id) === 0 ? 'X' : 'O';
        socket.emit('joined', { symbol });
        this.server.to(roomId).emit('update', game);

        this.logger.info('player was joined successfully');
      }

      if (game.players.length === 2) {
        this.logger.info('2 players are connected, starting the game');
        this.server.to(roomId).emit('startGame');
      }
    } catch (error) {
      this.logger.error(
        `error occurred during a player's attempt to join a game: ${error}`
      );
      socket.emit('error', {
        message:
          'there was an joining you to the game, you can try again or disconnect',
      });
    }
  };

  onMakeMove = (socket: Socket, roomId: string, row: number, col: number) => {
    try {
      const game = this.games[roomId];
      if (!!game && game.board[row][col] !== null) {
        this.logger.warn(
          `a player attempted a move over a taken spot: ${row}, ${col}`
        );
        socket.emit('error', {
          message: 'you attempted a move over a taken spot',
        });
        return;
      }

      const playerIndex = game.players.indexOf(socket.id);
      if (playerIndex === -1) {
        this.logger.warn('a non participant player attempted to make a move');
        socket.emit('error', { message: 'join a game before making a move' });
        return;
      }

      const symbol: PlayerSymbol = playerIndex === 0 ? 'X' : 'O';
      if (symbol !== game.turn) {
        this.logger.warn('a player attempted to make a move not in his turn');
        socket.emit('error', {
          message: 'wait for the rival player to make a move',
        });
        return;
      }

      const lastPlayedTurn = game.turn;
      game.board[row][col] = symbol;
      game.turn = symbol === 'X' ? 'O' : 'X';

      this.server.to(roomId).emit('update', game);

      const isWinner = this.checkIsWinner(game, lastPlayedTurn);
      if (isWinner) {
        const gameWinningMessage = `game was won by: ${lastPlayedTurn}`;
        this.logger.info(gameWinningMessage);
        this.server
          .to(roomId)
          .emit('gameOver', { message: gameWinningMessage });
        delete this.games[roomId];
        return;
      }
      if (this.checkIsDraw(game.board)) {
        const tieGameMessage = 'game ended with a tie';
        this.logger.info(tieGameMessage);
        this.server.to(roomId).emit('gameOver', { message: tieGameMessage });
        delete this.games[roomId];
      }
    } catch (error) {
      this.logger.error(
        `error occurred during a player's move processing: ${error}`
      );
      socket.emit('error', {
        message:
          'there was an error processing your move, you can try again or disconnect',
      });
    }
  };

  getLines(board: Board): (PlayerSymbol | null)[][] {
    const lines: (PlayerSymbol | null)[][] = [];

    for (let i = 0; i < this.gameSize; i++) {
      lines.push(board[i]); // Row
      lines.push(board.map((row) => row[i])); // Column
    }

    // Diagonals
    lines.push(board.map((row, index) => row[index])); // Top-left to bottom-right
    lines.push(board.map((row, index) => row[this.gameSize - 1 - index])); // Top-right to bottom-left

    return lines;
  }

  checkIsWinner = (game: Game, lastPlayedTurn: PlayerSymbol) => {
    const lines = this.getLines(game.board);
    return lines.some((line) => line.every((cell) => cell === lastPlayedTurn));
  };

  checkIsDraw(board: Board) {
    return board.every((row) => row.every((cell) => cell !== null));
  }

  onDisconnect = (socket: Socket) => {
    try {
      for (const roomId in this.games) {
        const game = this.games[roomId];
        if (game.players.includes(socket.id)) {
          this.server.to(roomId).emit('playerLeft');
          delete this.games[roomId];
          break;
        }
      }
    } catch (error) {
      this.logger.error(`error occurred during disconnection: ${error}`);
    }
  };
}
