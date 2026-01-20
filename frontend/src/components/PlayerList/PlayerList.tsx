import { Table } from "react-bootstrap";
import type { PlayerListProps } from "./PlayerListTypes";

export default function PlayerList<T extends { steamId: string }>({
  players,
  columns,
  onPlayerClick,
  showRank = false,
  isLoading = false,
  errorMessage,
  emptyMessage = "No players found",
  className,
}: PlayerListProps<T>) {
  if (isLoading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;
  if (players.length === 0) return <p>{emptyMessage}</p>;

  return (
    <div className={`rounded-table glass-panel ${className ?? ""}`}>
      <Table hover className="align-middle mb-0">
        <thead>
          <tr>
            {showRank && <th>#</th>}
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.align ? `text-${col.align}` : ""}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={player.steamId}
              onClick={() => onPlayerClick?.(player)}
              style={onPlayerClick ? { cursor: "pointer" } : undefined}
            >
              {showRank && <td>{index + 1}</td>}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.align ? `text-${col.align}` : ""}
                >
                  {col.render(player, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
