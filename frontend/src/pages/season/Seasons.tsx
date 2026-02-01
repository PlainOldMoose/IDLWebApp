import { useNavigate, Link } from "react-router-dom";
import { useSeasons } from "../../services/Queries";
import { useAuthStore } from "../../store/AuthStore";
import SeasonCard from "../../components/SeasonCard";

export default function Seasons() {
  const navigate = useNavigate();
  const { data: seasons, isPending, isError } = useSeasons();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = isAuthenticated && user?.isAdmin;

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error loading seasons</p>;

  return (
    <div className="container mt-4 slide-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="title-gradient mb-0">Seasons</h2>
        {isAdmin && (
          <Link to="/seasons/create" className="btn-accent">
            Create Season
          </Link>
        )}
      </div>
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
