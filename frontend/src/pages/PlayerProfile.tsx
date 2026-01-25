import { useParams } from "react-router-dom";
import { Card, Col, Row } from "react-bootstrap";
import { usePlayerDetail } from "../services/Queries";
<<<<<<< HEAD
=======
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
>>>>>>> 4e8cb82 (WIP)

export default function PlayerProfile() {
  const { steamId } = useParams<{ steamId: string }>();
  const { data: player, isPending, isError } = usePlayerDetail(steamId);
<<<<<<< HEAD
=======
  const navigate = useNavigate();

  const chartData =
    player?.eloHistory.map((elo, index) => ({
      match: index + 1,
      elo: elo,
    })) ?? [];
>>>>>>> 4e8cb82 (WIP)

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Player not found</p>;

  const stats = [
    { label: "Elo", value: player?.elo },
    { label: "Matches Played", value: player?.matchesPlayed },
    { label: "Wins", value: player?.wins },
    { label: "Losses", value: player?.losses },
<<<<<<< HEAD
    { label: "Winrate", value: `${player?.winRate}%` },
=======
    { label: "Winrate", value: `${player?.winRate?.toFixed(2)}%` },
>>>>>>> 4e8cb82 (WIP)
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
                <Card.Title className="fs-2">{stat.value}</Card.Title>
                <Card.Text className="text-muted">{stat.label}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
<<<<<<< HEAD
=======

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
                dataKey="match"
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                tick={{ fill: "var(--text-secondary)" }}
                domain={["dataMin - 50", "dataMax + 50"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "var(--text-secondary)" }}
                formatter={(value) => [`${value} ELO`, ""]}
                labelFormatter={(eloHistory) => `Match ${eloHistory.match}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="elo"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 4 }}
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
>>>>>>> 4e8cb82 (WIP)
    </div>
  );
}
