import { useUpcomingMatches, useActiveSeason } from "../services/Queries";
import UpcomingMatchCard from "../components/landing/UpcomingMatchCard";
import CurrentSeasonCard from "../components/landing/CurrentSeasonCard";
import SeasonStandingsCard from "../components/landing/SeasonStandingsCard";

export default function Landing() {
  const { data: upcomingMatches, isLoading: matchesLoading } =
    useUpcomingMatches(5);
  const { data: activeSeason, isLoading: seasonLoading } = useActiveSeason();

  return (
    <div className="container py-4">
      <div className="landing-hero text-center mb-5">
        <h1 className="landing-title">IDL In-House League</h1>
        <p className="landing-tagline">The I in IDL stands for IDL</p>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {seasonLoading ? (
            <div className="glass-panel p-4 mb-4">
              <p className="text-secondary mb-0">Loading season data...</p>
            </div>
          ) : activeSeason ? (
            <>
              <div className="glass-panel p-4 mb-4">
                <CurrentSeasonCard season={activeSeason} />
              </div>
              <div className="glass-panel p-4">
                <SeasonStandingsCard teams={activeSeason.teams} />
              </div>
            </>
          ) : (
            <div className="glass-panel p-4 mb-4">
              <h3 className="text-primary mb-3">No Active Season</h3>
              <p className="text-secondary mb-0">
                There is no active season at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="glass-panel p-4">
            <h4 className="upcoming-matches-title mb-4">Upcoming Matches</h4>
            {matchesLoading ? (
              <p className="text-secondary">Loading matches...</p>
            ) : upcomingMatches && upcomingMatches.length > 0 ? (
              <div className="upcoming-matches-list">
                {upcomingMatches.map((match) => (
                  <UpcomingMatchCard key={match.matchId} match={match} />
                ))}
              </div>
            ) : (
              <p className="text-secondary">No upcoming matches scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
