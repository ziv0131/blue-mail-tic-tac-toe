export type PlayerSymbol = 'X' | 'O';
export type Board = (PlayerSymbol | null)[][];

export interface Game {
  board: Board;
  turn: PlayerSymbol;
  players: string[];
}
