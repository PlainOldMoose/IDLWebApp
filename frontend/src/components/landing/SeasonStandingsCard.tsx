import type { SeasonTeam } from "../../types/season/SeasonDetail";

interface SeasonStandingsCardProps {
  teams: SeasonTeam[];
}

export default function SeasonStandingsCard({ teams }: SeasonStandingsCardProps) {
  return (
    <div className="season-standings-card">
      <h4 className="standings-title">Season Standings</h4>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>Win%</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <tr key={team.teamId}>
              <td className="standings-rank">{index + 1}</td>
              <td className="standings-team-name">{team.teamName}</td>
              <td className="standings-wins">{team.wins}</td>
              <td className="standings-losses">{team.losses}</td>
              <td className="standings-winrate">
                {team.winRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {teams.length === 0 && (
        <div className="standings-empty">No teams registered yet</div>
      )}
    </div>
  );
}
