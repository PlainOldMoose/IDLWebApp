import type {PlayerDetail} from "../types/Player.ts";

interface PlayerStatsCardProps {
    player: PlayerDetail;
}

export default function PlayerStatsCard({player}: PlayerStatsCardProps) {
    return (
        <div>
            <h1 className="font-extrabold text-3xl text-center mb-8">Stats</h1>
            <div className="grid grid-cols-4 gap-4 font-bold items-center">
                <p className="text-center bg-surface-a20 rounded-xl py-4">{player.elo} Elo</p>
                <p className="text-center bg-surface-a20 rounded-xl py-4">{player.wins} Wins</p>
                <p className="text-center bg-surface-a20 rounded-xl py-4">{player.losses} Losses</p>
                <p className="text-center bg-surface-a20 rounded-xl py-4">{player.winRate}% Winrate</p>
            </div>
        </div>
    );
}