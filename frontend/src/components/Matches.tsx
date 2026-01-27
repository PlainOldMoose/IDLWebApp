import { useMatches } from "../services/Queries";

export default function Matches() {
  const matchesQuery = useMatches();

  if (matchesQuery.isPending || matchesQuery.isError) {
    return <span>loading...</span>;
  }

  return (
    <>
      {matchesQuery.data.map((match) => (
        <p key={match.matchId}>{match.matchId}</p>
      ))}
    </>
  );
}
