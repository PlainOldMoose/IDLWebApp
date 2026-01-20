export interface PlayerListColumn<T> {
  key: string;
  header: string;
  align?: "start" | "center" | "end";
  render: (player: T, index: number) => React.ReactNode;
}

export interface PlayerListProps<T extends { steamId: string }> {
  players: T[];
  columns: PlayerListColumn<T>[];
  onPlayerClick?: (player: T) => void;
  showRank?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  className?: string;
}
