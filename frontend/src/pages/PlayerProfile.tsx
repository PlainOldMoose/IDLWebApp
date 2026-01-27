import { useParams } from "react-router-dom";
import { Card, Col, Row } from "react-bootstrap";
import { usePlayerDetail } from "../services/Queries";
import { useNavigate } from "react-router";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RecentMatchCard from "../components/match/RecentMatchCard";

export default function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const { data: player, isPending, isError } = usePlayerDetail(steamId);
  const navigate = useNavigate();

  const chartData =
    player?.eloSnapshotHistory.map((snapshot, index, arr) => ({
      matchId: snapshot.matchId,
      elo: snapshot.eloDuringMatch,
      win: index === 0 ? true : snapshot.eloDuringMatch > arr[index - 1].eloDuringMatch,
    })) ?? [];

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { win: boolean } }) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={payload?.win ? "#4a9d6b" : "#c45c5c"}
      />
    );
  };

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Player not found</p>;

  const stats = [
    { label: "Elo", value: player?.elo },
    { label: "Matches Played", value: player?.matchesPlayed },
    { label: "Wins", value: player?.wins },
    { label: "Losses", value: player?.losses },
    { label: "Winrate", value: `${player?.winRate?.toFixed(2)}%` },
  ];

  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient mb-4">{player?.username}</h2>
      <p className="text-muted mb-4"> Steam ID: {player?.steamId}</p>

      <Row xs={2} md={3} lg={5} className="g-4">
        {stats.map((stat) => (
          <Col key={stat.label}>
            <Card className="text-center lift-on-hover stat-card gradient-card-subtle">
              <Card.Body className="p-4">
                <Card.Title className="fs-2" style={{ color: "rgba(255, 255, 255, 0.7)" }}>{stat.value}</Card.Title>
                <Card.Text className="text-muted">{stat.label}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="stat-card mt-4">
        <Card.Body>
          <Card.Title className="mb-4">Elo History</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              responsive
              data={chartData}
            >
                <XAxis
                    dataKey="matchId"
                    stroke="var(--text-secondary)"
                    tick={false}
                />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
                domain={["dataMin - 50", "dataMax + 50"]}
              />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "var(--card-bg, #1a1a2e)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }}
                    labelStyle={{ color: "var(--text-secondary)" }}
                    itemStyle={{ color: "rgba(255, 255, 255, 0.7)" }}
                    labelFormatter={(matchId) => `Match ID: ${matchId}`}
                    formatter={(value) => [`${value} ELO`, "Elo"]}
                />

              <Legend />
              <Line
                type="monotone"
                dataKey="elo"
                stroke="rgba(75, 85, 99, 0.5)"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
      <Card className="stat-card mt-4">
        <Card.Body>
          <Card.Title className="mb-4">Recent Matches</Card.Title>
          {player?.recentMatches?.length === 0 && (
            <p className="text-muted">No matches found</p>
          )}
          {player?.recentMatches?.slice(0, 10).map((match) => (
            <RecentMatchCard
              key={match.matchId}
              match={match}
              onClick={() => navigate(`/matches/${match.matchId}`)}
            />
          ))}
        </Card.Body>
      </Card>
    </div>
  );
}
