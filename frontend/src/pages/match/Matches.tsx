import { useNavigate } from "react-router";
import MatchCard from "../../components/match/MatchCard";
import { useMatches } from "../../services/Queries";

export default function Matches() {
  const navigate = useNavigate();
  const { data: matches, isPending, isError } = useMatches();

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error loading matches</p>;

  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient mb-4">Matches</h2>
      {matches
        ?.slice()
        .sort(
          (a, b) =>
            new Date(b.timePlayed).getTime() - new Date(a.timePlayed).getTime(),
        )
        .map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            onClick={() => navigate(`/matches/${match.matchId}`)}
          />
        ))}
    </div>
  );
}
