import { useNavigate } from "react-router";
import { useSeasons } from "../../services/Queries";
import SeasonCard from "../../components/SeasonCard";

export default function Seasons() {
  const navigate = useNavigate();
  const { data: seasons, isPending, isError } = useSeasons();

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error loading seasons</p>;

  return (
    <div className="container mt-4 slide-in">
      <h2 className="title-gradient mb-4">Seasons</h2>
      {seasons?.length === 0 && <p className="text-muted">No seasons found</p>}
      {seasons?.map((season) => (
        <SeasonCard
          key={season.id}
          season={season}
          onClick={() => navigate(`/seasons/${season.id}`)}
        />
      ))}
    </div>
  );
}
