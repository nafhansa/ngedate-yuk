export type PlayerSymbol = 'X' | 'O' | null;

// Tic Tac Toe
export function checkTicTacToeWinner(board: (string | null)[]) {
  const size = 5; // Ukuran grid
  
  // Baris (Rows)
  for (let i = 0; i < 25; i += 5) {
    if (board[i] && board[i] === board[i+1] && board[i] === board[i+2] && board[i] === board[i+3] && board[i] === board[i+4]) {
      return board[i];
    }
  }

  // Kolom (Columns)
  for (let i = 0; i < 5; i++) {
    if (board[i] && board[i] === board[i+5] && board[i] === board[i+10] && board[i] === board[i+15] && board[i] === board[i+20]) {
      return board[i];
    }
  }

  // Diagonal Utama
  if (board[0] && board[0] === board[6] && board[0] === board[12] && board[0] === board[18] && board[0] === board[24]) {
    return board[0];
  }

  // Diagonal Terbalik
  if (board[4] && board[4] === board[8] && board[4] === board[12] && board[4] === board[16] && board[4] === board[20]) {
    return board[4];
  }

  // Cek Draw
  if (!board.includes(null)) return 'draw';

  return null;
}

// Connect 4
export const checkConnect4Winner = (grid: (string | null)[][]): string | 'draw' | null => {
  const rows = 6;
  const cols = 7;

  // Check horizontal
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - 4; col++) {
      const cell = grid[row][col];
      if (cell && 
          grid[row][col + 1] === cell &&
          grid[row][col + 2] === cell &&
          grid[row][col + 3] === cell) {
        return cell;
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      if (cell &&
          grid[row + 1][col] === cell &&
          grid[row + 2][col] === cell &&
          grid[row + 3][col] === cell) {
        return cell;
      }
    }
  }

  // Check diagonal /
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 0; col <= cols - 4; col++) {
      const cell = grid[row][col];
      if (cell &&
          grid[row + 1][col + 1] === cell &&
          grid[row + 2][col + 2] === cell &&
          grid[row + 3][col + 3] === cell) {
        return cell;
      }
    }
  }

  // Check diagonal \
  for (let row = 0; row <= rows - 4; row++) {
    for (let col = 3; col < cols; col++) {
      const cell = grid[row][col];
      if (cell &&
          grid[row + 1][col - 1] === cell &&
          grid[row + 2][col - 2] === cell &&
          grid[row + 3][col - 3] === cell) {
        return cell;
      }
    }
  }

  // Check for draw
  if (grid.every(row => row.every(cell => cell !== null))) {
    return 'draw';
  }

  return null;
};

// Dots & Boxes
export const checkDotsBoxesWinner = (scores: Record<string, number>): string | null => {
  const scoreEntries = Object.entries(scores);
  if (scoreEntries.length < 2) return null;

  const [player1, score1] = scoreEntries[0];
  const [player2, score2] = scoreEntries[1];

  if (score1 > score2) return player1;
  if (score2 > score1) return player2;
  return 'draw';
};

export const checkBoxCompleted = (
  boxIndex: number,
  hLines: boolean[][],
  vLines: boolean[][]
): boolean => {
  const row = Math.floor(boxIndex / 3);
  const col = boxIndex % 3;

  const top = hLines[row][col];
  const bottom = hLines[row + 1][col];
  const left = vLines[row][col];
  const right = vLines[row][col + 1];

  return top && bottom && left && right;
};

// Sea Battle
export const checkSeaBattleWinner = (
  p1Shots: Array<{ x: number; y: number; hit: boolean }>,
  p2Shots: Array<{ x: number; y: number; hit: boolean }>,
  p1Board: number[][] | null,
  p2Board: number[][] | null
): string | null => {
  if (!p1Board || !p2Board) return null;

  // Check if all ships are hit
  const p1AllShipsHit = p2Board.every((row, y) =>
    row.every((cell, x) => {
      if (cell === 1) {
        // Ship cell, check if hit
        return p1Shots.some(shot => shot.x === x && shot.y === y && shot.hit);
      }
      return true;
    })
  );

  const p2AllShipsHit = p1Board.every((row, y) =>
    row.every((cell, x) => {
      if (cell === 1) {
        // Ship cell, check if hit
        return p2Shots.some(shot => shot.x === x && shot.y === y && shot.hit);
      }
      return true;
    })
  );

  // This would need to be determined by which player's shots hit all enemy ships
  // For now, return null and handle in game logic
  return null;
};

export const generateSeaBattleBoard = (): number[][] => {
  // Simple 10x10 board with some ships placed
  // 1 = ship, 0 = water
  const board = Array(10).fill(null).map(() => Array(10).fill(0));
  
  // Place ships (simplified - in real game, user would place them)
  // Ship 1: 2 cells horizontal
  board[2][2] = 1;
  board[2][3] = 1;
  
  // Ship 2: 3 cells vertical
  board[5][5] = 1;
  board[6][5] = 1;
  board[7][5] = 1;
  
  // Ship 3: 2 cells horizontal
  board[8][1] = 1;
  board[8][2] = 1;
  
  return board;
};
