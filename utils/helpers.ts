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
