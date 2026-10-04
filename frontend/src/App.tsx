import {BrowserRouter, Routes, Route, Link, NavLink} from "react-router";
import {useCurrentUser, useSignOut} from "./services/Queries.ts";
import Landing from "./pages/Landing.tsx";
import Seasons from "./pages/Seasons.tsx";
import Players from "./pages/Players.tsx";
import Matches from "./pages/Matches.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import SeasonDetail from "./pages/SeasonDetail.tsx";
import Unregistered from "./pages/Unregistered.tsx";
import PlayerDetail from "./pages/PlayerDetail.tsx";
import Inhouses from "./pages/Inhouses.tsx";
import NotFound from "./pages/NotFound.tsx";

function App() {
    const {data: user} = useCurrentUser();
    const signOut = useSignOut();

    return (
        <BrowserRouter>
            <a href="#main" className="skip-link">Skip to content</a>
            {/*Navbar: a thin translucent bar that stays at the top and blurs whatever scrolls underneath it*/}
            <nav className="sticky top-0 z-30 border-b border-white/[0.07] bg-[rgb(40_34_34/0.75)] backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4">
                    <Link to="/" className="flex h-12 shrink-0 items-center" aria-label="IDL home">
                        <img src="/idl.png" alt="" width={28} height={28} className="h-7 w-7"/>
                    </Link>
                    {/*Links drop to their own row on small screens*/}
                    <div className="order-last -ml-2.5 flex h-10 w-full items-center gap-1 sm:order-none sm:ml-0 sm:h-12 sm:w-auto">
                        <NavLink to="/players" className="nav-link">Players</NavLink>
                        <NavLink to="/seasons" className="nav-link">Seasons</NavLink>
                        <NavLink to="/matches" className="nav-link">Matches</NavLink>
                        <NavLink to="/inhouses" className="nav-link">In-houses</NavLink>
                    </div>
                    {/*Outlined like the sign-in button, so they read as buttons rather than more nav links*/}
                    <div className="ml-auto flex h-12 shrink-0 items-center gap-2">
                        {user ? (<>
                            <NavLink to={`/players/${user.steamId}`}
                                     className={({isActive}) => `secondary-button px-3 py-1 text-sm ${isActive ? "border-ash text-bone" : ""}`}>
                                {/*Phosphor's User*/}
                                <svg aria-hidden="true" width={14} height={14} viewBox="0 0 256 256" fill="currentColor">
                                    <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
                                </svg>
                                {user.username}
                            </NavLink>
                            <button type="button" onClick={() => signOut.mutate()} className="secondary-button px-3 py-1 text-sm">
                                Sign out
                            </button>
                        </>) : (
                            <a href="/auth/login" className="primary-button px-3 py-1 text-sm">
                                Sign in with Steam
                            </a>
                        )}
                    </div>
                </div>
            </nav>
            <main id="main" tabIndex={-1} className="pb-24 focus:outline-none">
                <Routes>
                    <Route path="/" element={<Landing/>}/>
                    <Route path="/players" element={<Players/>}/>
                    <Route path="/players/:steamId" element={<PlayerDetail/>}/>
                    <Route path="/seasons" element={<Seasons/>}/>
                    <Route path="/seasons/:seasonId" element={<SeasonDetail/>}/>
                    <Route path="/matches" element={<Matches/>}/>
                    <Route path="/matches/:matchId" element={<MatchDetail/>}/>
                    <Route path="/inhouses" element={<Inhouses/>}/>
                    <Route path="/unregistered" element={<Unregistered/>}/>
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App
