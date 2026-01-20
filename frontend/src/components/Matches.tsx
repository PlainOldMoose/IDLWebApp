import { useMatchIds } from "../services/Queries";

export default function Matches() {
  const matchesQuery = useMatchIds();

  if (matchesQuery.isPending || matchesQuery.isError) {
    return <span>loading...</span>;
  }

  return (
    <>
      {matchesQuery.data.map((id) => (
        <p key={id}>{id}</p>
      ))}
    </>
  );
}
