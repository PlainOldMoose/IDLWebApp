import type {ReactNode} from "react";
import Page from "../components/Page.tsx";
import Panel from "../components/Panel.tsx";

interface Section {
    id: string;
    number: string;
    title: string;
    rules: [number: string, body: ReactNode][];
}

const subListClass = "mt-2 list-[lower-alpha] space-y-1 pl-6 marker:text-ash";

// NOTE: from the IDL Rulebook. Edit here by PR; keep the numbering so people can cite rules
const sections: Section[] = [
    {
        id: "wheatons-law", number: "0", title: "Wheaton's Law", rules: [
            ["0.1", "Don’t be a dick."],
        ],
    },
    {
        id: "season-format", number: "1", title: "Season Format", rules: [
            ["1.1", "Each IDL season will consist of a player draft, followed by a group stage where each game is Bo2, then a playoff stage of Bo3 games."],
            ["1.2", "The format for each season will be announced in advance of the season beginning, but will typically consist of a group stage, with a number of teams advancing to the main bracket and the bottom 4 teams advancing to the wooden spoon bracket."],
            ["1.3", "There will generally be 3 Captains Mode and 2 Captains Draft seasons per year, but this may vary based on season size."],
        ],
    },
    {
        id: "signups", number: "2", title: "Signups", rules: [
            ["2.1", "Before the start of a season a signup period will be announced. Signups are first come, first served. At the end of the signup period the largest multiple of 5 players possible will be selected, with any remaining players assigned as subs."],
            ["2.2", <>
                To sign up for an IDL season a player must not have been removed from the league and must have either:
                <ol className={subListClass}>
                    <li>participated in a previous season; or</li>
                    <li>been successfully vouched.*</li>
                </ol>
                <p className="mt-2 text-ash">
                    *Under some circumstances players may be barred from vouching, as detailed
                    in <a href="#penalties" className="font-semibold text-accent underline underline-offset-2 hover:text-bone">section 8.2</a>.
                </p>
            </>],
            ["2.2.1", <>
                In order to be successfully vouched, a player must:
                <ol className={subListClass}>
                    <li>have played a minimum of 3 in-house games; and</li>
                    <li>have gone through a process of referencing by the admins, considering character references from any interested parties.</li>
                </ol>
            </>],
            ["2.3", "Upon signup players may indicate a role preference for the season. Captains are encouraged but not obliged to place players in their preferred positions."],
            ["2.4", "Returning players may also volunteer to captain during signups. If there are more volunteer captains than teams, priority will be given to players who have not captained recently. If there are too few willing volunteers, previous captains will be approached to make up the numbers."],
            ["2.5", "All players in the league are required to maintain an open Dotabuff profile, which they will confirm alongside their availability form."],
        ],
    },
    {
        id: "time-commitments", number: "3", title: "Prior time commitments", rules: [
            ["3.1", "Players are expected to complete an availability form in advance of the season beginning, which will be used to help create a schedule that maximises player availability. Failure to submit this form means your availability will not be considered in the initial schedule."],
            ["3.2", "Please be aware that due to the large number of players we cannot guarantee all scheduling requests will be compatible."],
        ],
    },
    {
        id: "player-draft", number: "4", title: "Player draft", rules: [
            ["4.1", "The tournament organiser will arrange a time with the captains for the player draft. If a captain is not present within 20 minutes of the designated time they will be considered unable to attend."],
            ["4.2", "In the event of a captain being unable to attend the player draft they may assign a stand-in who is not competing this season to draft for them. If no stand-in is assigned, the missing captain’s draft will be completed automatically, picking the highest rated available player each round until a player who has been automatically picked is available to complete the draft."],
            ["4.3", "Captains will need to provide a team name, team image and player positions before the first game of the season. Team names (or acronyms) and images cannot include violent images, pornographic material, propaganda, racism, or any form of hatred towards representatives of a certain nationality, gender or sexual identity."],
            ["4.4", "Pick order will be determined based on the team with the lowest draft score (a measure based on player ELO). In the event of a tie the captain who picked least recently will be prioritised."],
        ],
    },
    {
        id: "reschedules-and-subs", number: "5", title: "Reschedules and Subs", rules: [
            ["5.0", "Captains are expected to request reschedules and/or organise subs when they or their team members are not available. No more than two subs are permitted per team per game."],
            ["5.1", "All reschedules must be agreed by both captains with a new time arranged before the start of the originally scheduled match."],
            ["5.2", "All matches must take place before the end of the assigned week (which currently runs Sunday to Saturday) to avoid clashing with or delaying further games."],
            ["5.3", "When arranging reschedules captains are expected to prioritise the date with the most players available, but if an agreement cannot be reached between the captains the game will take place at the originally scheduled time."],
            ["5.4", <>
                Substitutes are required to be lower ELO than the player they are replacing, except in two circumstances:
                <ol className={subListClass}>
                    <li>the absent player is one of the lowest X players (where X is the number of teams); or</li>
                    <li>the substitute signed up before the season began as a “designated sub”. In this case, the designated sub’s ELO is treated as Y lower (Y is decided by a vote of the captains in the current season, before the season starts).</li>
                </ol>
            </>],
            ["5.5", "The lowest X players are all treated as having the same ELO as the highest of them for the purposes of determining subs."],
        ],
    },
    {
        id: "gameplay", number: "6", title: "Gameplay, drafting, pauses and conceding", rules: [
            ["6.1", "The 5 active players may not communicate with any external sources once the game has started, with the following exception: team members who are being replaced by a sub for that game may be present in the voice channel for the draft only."],
            ["6.2", "Use of external programs that suggest picks and bans, including Overwolf, is not permitted, but looking up information on sites such as Dotabuff, OpenDota or Protracker is permitted."],
            ["6.3", "Every team can pause the game for up to 10 minutes."],
            ["6.4", "Before resuming, the team who paused the game must make sure the other team is ready. The game can resume as soon as the opponent announces readiness. If the opposing team doesn’t confirm its readiness, then your opponent’s pause time begins."],
            ["6.5", <>Games must start within 15 minutes of their agreed start time. Any changes to this must be communicated before that start time. <em>Pause time may not be used to extend this.</em></>],
            ["6.6", "A captain calling “gg” during the game concedes the game. Other players on the team should not be calling “gg”."],
            ["6.7", "Games may only be remade if the game timer is before 3 minutes with no kills having taken place. If a remake takes place after the game clock has started, players must play the same heroes (if a remake takes place because a substitute is required, the substitute must play the hero of the player they are replacing)."],
        ],
    },
    {
        id: "sportsmanship", number: "7", title: "Sportsmanship", rules: [
            ["7.1", "Players are expected to behave in a reasonable manner and not perform or encourage behaviour intended to offend or upset other players."],
            ["7.2", "All chat, sprays and tipping should not be used in game unless you are certain they will not cause offence. Any team on the receiving end of BM tipping or communication abuse may report it to the tournament organiser or community manager, who will assess it and assign a penalty to that player or team."],
            ["7.3", "In general, and with the explicit exception of all chat used in ways that could cause offence, communications that can be muted are allowed."],
            ["7.4", "Acts of intentional feeding, griefing or account swapping will also incur penalties."],
            ["7.5", "IDL will not tolerate racism, sexism, homophobia or any other forms of discrimination in the Discord server or in game chat."],
            ["7.6", "Players who on multiple occasions fail to turn up for a game on time without providing any notice may receive a sanction up to and including being barred from one or more future seasons."],
            ["7.7", "Intentional use of bugs or exploits may receive a sanction up to and including a permanent ban."],
        ],
    },
    {
        id: "penalties", number: "8", title: "Penalties", rules: [
            ["8.1", <>
                Penalties may be assigned for unsportsmanlike conduct and will escalate in severity with continued misdemeanours. They will generally follow the order below but are ultimately decided by the league admins and community manager.
                <ol className="mt-2 list-decimal space-y-1 pl-6 marker:text-ash">
                    <li>Verbal warning</li>
                    <li>Verbal warning and draft time penalty</li>
                    <li>Final warning and enforced substitution or technical defeat</li>
                    <li>Removal from the season and/or barring from subsequent seasons</li>
                </ol>
            </>],
            ["8.2", <>
                Players may be barred from vouching if either:
                <ol className={subListClass}>
                    <li>they have received 3 or more warnings; or</li>
                    <li>another player they have vouched for is removed or barred from the league.</li>
                </ol>
            </>],
            ["8.3", "Players who fail to complete a season will be prohibited from playing in future IDL seasons until they complete a season as a designated sub."],
        ],
    },
    {
        id: "tiebreakers", number: "9", title: "Tiebreakers", rules: [
            ["9.1", "While individual season structures are determined by several factors such as player signups, seasons will normally follow a round robin (Bo2) group stage before going to elimination games (Bo3)."],
            ["9.2", "The first tiebreaker in all situations will be the head-to-head score between the teams involved. In a multi-way tie, if the initial tiebreaker removes one team from the equation, the head-to-head between the remaining tied teams will be used to determine their positions."],
            ["9.3", "If head-to-head score is not enough to break a tie, the captains of the tied teams will decide the format of the tiebreakers. If no consensus can be reached, a game between the captains will be played using the 1v1 solo mid format, with both players selecting Goblin Techies."],
        ],
    },
    {
        id: "admin-discretion", number: "10", title: "Admin Discretion", rules: [
            ["10.1", "The admin team reserves the right to make reasonable adjustments or overrule the rules where strict interpretation would result in an unreasonable or unjust outcome."],
        ],
    },
];

// Section number in its own column, so titles line up from "0" to "10"
function NumberedTitle({number, title, numberWidth}: {number: string; title: string; numberWidth: string}) {
    return (
        <span className="flex">
            <span className={`figures shrink-0 text-ash ${numberWidth}`}>{number}</span>
            {/*NOTE: flex drops this space visually, but it keeps the accessible name "8 Penalties", not "8Penalties"*/}
            {" "}
            <span>{title}</span>
        </span>
    );
}

export default function Rules() {
    return (
        <Page title="Rules" subtitle="How IDL seasons run, and what’s expected of players">
            <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-[calc(var(--nav-height)+1rem)]">
                    <Panel title="Contents" padded={false}>
                        <nav aria-label="Contents">
                            <ol>
                                {sections.map(({id, number, title}) => (
                                    <li key={id}>
                                        <a href={`#${id}`} className="row-link block px-2.5 py-2 leading-snug">
                                            <NumberedTitle number={number} title={title} numberWidth="w-8"/>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </Panel>
                </div>
                <div className="min-w-0 space-y-4">
                    {sections.map(({id, number, title, rules}) => (
                        <Panel key={id} id={id} title={<NumberedTitle number={number} title={title} numberWidth="w-14"/>}>
                            <div className="max-w-[72ch] space-y-3 leading-relaxed text-pretty">
                                {rules.map(([number, body]) => (
                                    <div key={number} className="flex">
                                        <span className="figures w-14 shrink-0 text-ash">{number}</span>
                                        <div className="min-w-0">{body}</div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    ))}
                </div>
            </div>
        </Page>
    );
}
