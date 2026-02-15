import type {PlayerMatchSummary} from "../types/Player.ts";

interface PlayerMatchCardProps {
    match: PlayerMatchSummary;
}

const handleRedirect = (matchId: number): void => {
    window.open(`https://stratz.com/matches/${matchId}`, "_blank");
};

export default function PlayerMatchCard({match}: PlayerMatchCardProps) {
    return (
        <div className="match-summary-card hover:cursor-pointer" onClick={() => handleRedirect(match.matchId)}>
            <p>{match.matchId}</p>
            <p>{match.won ? "Win" : "Loss"}</p>
            <p>{match.eloChange}</p>
            <p>{match.timePlayed}</p>
            <p>{match.seasonName ?? "In-house"}</p>
        </div>
    );
}