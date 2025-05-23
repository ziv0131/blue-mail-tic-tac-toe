import { Socket, Server } from 'socket.io';
import { Board, Game, PlayerSymbol } from './models/Game';

export class GameManager {
  private games: Record<string, Game> = {};
  public server: Server;

  constructor(serverReference: Server) {
    this.server = serverReference;
  }

  onJoinGame = (socket: Socket, roomId: string) => {
    if (!this.games[roomId]) {
      this.games[roomId] = {
        board: Array(9).fill(null),
        turn: 'X',
        players: [],
      };
    }

    const game = this.games[roomId];
    if (game.players.length < 2) {
      game.players.push(socket.id);
      socket.join(roomId);
      const symbol: PlayerSymbol =
        game.players.indexOf(socket.id) === 0 ? 'X' : 'O';
      socket.emit('joined', { symbol });
      this.server.to(roomId).emit('update', game);
    }

    if (game.players.length === 2) {
      this.server.to(roomId).emit('startGame');
    }
  };

  onMakeMove = (socket: Socket, roomId: string, index: number) => {
    const game = this.games[roomId];
    if (!game || game.board[index] !== null) return;

    const playerIndex = game.players.indexOf(socket.id);
    if (playerIndex === -1) return;

    const symbol: PlayerSymbol = playerIndex === 0 ? 'X' : 'O';
    if (symbol !== game.turn) return;

    game.board[index] = symbol;
    game.turn = symbol === 'X' ? 'O' : 'X';

    this.server.to(roomId).emit('update', game);

    const winner = this.checkWinner(game.board);
    if (winner || !game.board.includes(null)) {
      this.server.to(roomId).emit('gameOver', { winner });
      delete this.games[roomId];
    }
  };

  checkWinner = (board: Board): PlayerSymbol | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  };

  onDisconnect = (socket: Socket) => {
    for (const roomId in this.games) {
      const game = this.games[roomId];
      if (game.players.includes(socket.id)) {
        this.server.to(roomId).emit('playerLeft');
        delete this.games[roomId];
        break;
      }
    }
  };
}
