export const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getGameDisplayName = (gameType: string): string => {
  const names: Record<string, string> = {
    tictactoe: 'Tic Tac Toe',
    connect4: 'Connect 4',
    seabattle: 'Sea Battle',
    dotsboxes: 'Dots & Boxes',
  };
  return names[gameType] || gameType;
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Convert nested array to Firestore-compatible object
// Example: [[1,2],[3,4]] -> {"0_0": 1, "0_1": 2, "1_0": 3, "1_1": 4}
export const array2DToObject = <T>(arr: T[][]): Record<string, T> => {
  const obj: Record<string, T> = {};
  arr.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      obj[`${rowIndex}_${colIndex}`] = cell;
    });
  });
  return obj;
};

// Convert Firestore object back to nested array
// Example: {"0_0": 1, "0_1": 2, "1_0": 3, "1_1": 4} -> [[1,2],[3,4]]
export const objectToArray2D = <T>(
  obj: Record<string, T>,
  rows: number,
  cols: number
): T[][] => {
  const arr: T[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  Object.entries(obj).forEach(([key, value]) => {
    const [row, col] = key.split('_').map(Number);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      arr[row][col] = value;
    }
  });
  return arr;
};
