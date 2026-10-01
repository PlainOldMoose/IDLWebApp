import {useId, useRef, useState} from "react";
import {useNavigate} from "react-router";
import type {PlayerSummary} from "../types.ts";
import {formatElo} from "../util/format.ts";

interface EloLadderProps {
    // Highest ELO first, as the API returns them
    players: PlayerSummary[];
    highlightSteamId?: string;
    highlightLabel?: string;
}

const DOMAIN_STEP = 100;
const LABEL_STEP = 250;

// How far each key moves through the ranking. Players are sorted highest ELO first, so moving right is -1.
const KEY_STEPS: Record<string, number> = {
    ArrowRight: -1, ArrowUp: -1, ArrowLeft: 1, ArrowDown: 1, PageUp: -10, PageDown: 10,
    Home: Infinity, End: -Infinity,
};

// Places a label over a tick without letting it run off either edge of the ladder
const labelAlignment = (pct: number): string =>
    pct < 15 ? "translate-x-0" : pct > 85 ? "-translate-x-full" : "-translate-x-1/2";

/**
 * Every player as a tick on one ELO axis. Density shows where most of the league sits;
 * one player can be highlighted to show where they stand. It works as a slider:
 * point, tap or use the arrow keys to pick a player, then click or press Enter to open them.
 */
export default function EloLadder({players, highlightSteamId, highlightLabel}: EloLadderProps) {
    const ladderRef = useRef<HTMLDivElement>(null);
    const hintId = useId();
    const navigate = useNavigate();
    // The player under the pointer, or picked with the arrow keys
    const [active, setActive] = useState<PlayerSummary | null>(null);

    if (players.length === 0) return null;

    const highest = players[0];
    const lowest = players[players.length - 1];
    const min = Math.floor(lowest.elo / DOMAIN_STEP) * DOMAIN_STEP;
    const max = Math.ceil(highest.elo / DOMAIN_STEP) * DOMAIN_STEP;
    const toPct = (elo: number) => ((elo - min) / (max - min)) * 100;

    const axisLabels: number[] = [];
    for (let elo = Math.ceil(min / LABEL_STEP) * LABEL_STEP; elo <= max; elo += LABEL_STEP) {
        axisLabels.push(elo);
    }

    const highlighted = players.find(p => p.steamId === highlightSteamId);
    const rankOf = (player: PlayerSummary) => players.indexOf(player) + 1;
    const describe = (player: PlayerSummary) => `${player.username}, ${formatElo(player.elo)}, rank ${rankOf(player)}`;
    const open = (player: PlayerSummary) => navigate(`/players/${player.steamId}`);
    // Where keyboard selection starts: the highlighted player, or the middle of the league
    const current = active ?? highlighted ?? players[Math.floor(players.length / 2)];

    // The player whose tick is closest to a horizontal screen position
    const playerAt = (clientX: number): PlayerSummary | null => {
        const bounds = ladderRef.current?.getBoundingClientRect();
        if (!bounds) return null;
        const elo = min + ((clientX - bounds.left) / bounds.width) * (max - min);
        return players.reduce((best, p) => Math.abs(p.elo - elo) < Math.abs(best.elo - elo) ? p : best);
    };

    // Uses the click position rather than the hovered player, so a tap on a touch screen works too
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const player = playerAt(event.clientX);
        if (player) open(player);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open(current);
            return;
        }
        const step = KEY_STEPS[event.key];
        if (step === undefined) return;
        event.preventDefault();
        const next = Math.min(players.length - 1, Math.max(0, players.indexOf(current) + step));
        setActive(players[next]);
    };

    const callout = active ?? highlighted;
    const calloutText = callout && (callout === highlighted && !active && highlightLabel
        ? `${highlightLabel}, ${formatElo(callout.elo)}`
        : describe(callout));

    return (
        <figure className="select-none">
            <figcaption className="sr-only">
                {`ELO of all ${players.length} players, from ${formatElo(lowest.elo)} to ${formatElo(highest.elo)}`
                    + (highlighted ? `. ${highlighted.username} is rank ${rankOf(highlighted)} at ${formatElo(highlighted.elo)}.` : ".")}
            </figcaption>
            <div
                ref={ladderRef}
                className="relative h-26 cursor-pointer touch-pan-y"
                role="slider"
                tabIndex={0}
                aria-label="Choose a player by ELO"
                aria-describedby={hintId}
                aria-valuemin={lowest.elo}
                aria-valuemax={highest.elo}
                aria-valuenow={current.elo}
                aria-valuetext={describe(current)}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onFocus={() => setActive(current)}
                onBlur={() => setActive(null)}
                onPointerMove={(event) => setActive(playerAt(event.clientX))}
                onPointerLeave={() => {
                    // Keep the keyboard selection if the ladder still has focus
                    if (document.activeElement !== ladderRef.current) setActive(null);
                }}
            >
                {players.map(player => {
                    const pct = toPct(player.elo);
                    const isHighlight = player === highlighted;
                    const isActive = player === active;
                    return (
                        <span
                            key={player.steamId}
                            className={`ladder-tick absolute bottom-0 w-0.5 -translate-x-1/2 rounded-t-sm ${
                                isHighlight ? "h-16 bg-accent" : isActive ? "h-16 bg-bone" : "h-11 bg-ash/65"}`}
                            style={{left: `${pct}%`, animationDelay: `${pct * 4}ms`}}
                        />
                    );
                })}
                {callout && (
                    <p aria-hidden="true"
                       className={`figures absolute top-0 whitespace-nowrap text-sm ${labelAlignment(toPct(callout.elo))} ${
                           callout === highlighted ? "text-accent" : "text-bone"}`}
                       style={{left: `${toPct(callout.elo)}%`}}>
                        {calloutText}
                    </p>
                )}
            </div>
            <div className="relative h-7 border-t border-rule" aria-hidden="true">
                {axisLabels.map(elo => (
                    <span key={elo}
                          className="figures absolute top-1.5 -translate-x-1/2 text-xs text-ash"
                          style={{left: `${toPct(elo)}%`}}>
                        {elo.toLocaleString("en-GB")}
                    </span>
                ))}
            </div>
            <p id={hintId} className="sr-only">Use the arrow keys to move between players, and Enter to open one.</p>
        </figure>
    );
}
