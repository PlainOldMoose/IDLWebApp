import { Link, useNavigate, useParams } from "react-router-dom";
import { useSeasonDetail, useFilteredMatches } from "../../services/Queries";
import { Badge, Row, Col } from "react-bootstrap";
import { format } from "date-fns";
import type { SeasonTeam, TeamMember } from "../../types/season/SeasonDetail";
import MatchCard from "../../components/match/MatchCard";

export default function SeasonDetail() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const { data: season, isPending, isError } = useSeasonDetail(seasonId);
  const { data: matches } = useFilteredMatches(seasonId);

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Season not found</p>;

  const statusBadgeVariant =
    season.status === "ACTIVE"
      ? "success"
      : season.status === "COMPLETED"
        ? "secondary"
        : "warning";

  return (
    <div className="container mt-4 slide-in">
      {/* Header */}
      <div className="match-detail-header">
        <Row className="align-items-center">
          <Col xs={12} md={6}>
            <h1 className="title-gradient mb-2">{season.name}</h1>
            <Badge bg={statusBadgeVariant} className="me-2">
              {season.status}
            </Badge>
            <span className="text-muted">
              {format(new Date(season.startDate), "MMM d, yyyy")} -{" "}
              {format(new Date(season.endDate), "MMM d, yyyy")}
            </span>
          </Col>
          <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0">
            <div className="d-flex gap-4 justify-content-md-end">
              <div className="stat-card px-4 py-2">
                <div className="fw-bold fs-4">{season.teams.length}</div>
                <div className="text-muted small">Teams</div>
              </div>
              <div className="stat-card px-4 py-2">
                <div className="fw-bold fs-4">{matches?.length || 0}</div>
                <div className="text-muted small">Matches</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Teams Grid */}
      <div className="section-header">
        <h2 className="title-gradient">Teams</h2>
      </div>
      <div className="team-grid mb-5">
        {season.teams.map((team) => (
          <TeamCard key={team.teamId} team={team} />
        ))}
      </div>

      {/* Match History */}
      {matches && matches.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="title-gradient">Match History</h2>
          </div>
          <div>
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onClick={() => navigate(`/matches/${match.matchId}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: SeasonTeam }) {
  return (
    <div className="team-card">
      <div className="team-card-header">
        <h5>{team.teamName}</h5>
        <span className="text-muted small">{team.avgElo} ELO</span>
      </div>

      <ul className="team-member-list">
        {team.members.map((member) => (
          <MemberRow
            key={member.steamId}
            member={member}
            isCaptain={member.steamId === team.captainSteamId}
          />
        ))}
      </ul>

      <div className="team-stats">
        <div className="team-stat">
          <span className="team-stat-value" style={{ color: "#22c55e" }}>
            {team.wins}
          </span>
          <span className="team-stat-label">Wins</span>
        </div>
        <div className="team-stat">
          <span className="team-stat-value" style={{ color: "#ef4444" }}>
            {team.losses}
          </span>
          <span className="team-stat-label">Losses</span>
        </div>
        <div className="team-stat">
          <span className="team-stat-value">{team.winRate.toFixed(0)}%</span>
          <span className="team-stat-label">Win Rate</span>
        </div>
        <div className="team-stat">
          <span className="team-stat-value">{team.avgElo}</span>
          <span className="team-stat-label">Avg ELO</span>
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  isCaptain,
}: {
  member: TeamMember;
  isCaptain: boolean;
}) {
  return (
    <li className="team-member-item">
      <div>
        <Link to={`/players/${member.steamId}`} className="team-member-link">
          {member.username}
        </Link>
        {isCaptain && <span className="captain-badge">Captain</span>}
      </div>
      <span className="text-muted small">{member.currentElo}</span>
    </li>
  );
}
