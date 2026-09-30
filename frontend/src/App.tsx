import {BrowserRouter, Routes, Route, Link, NavLink} from "react-router-dom";
import {useCurrentUser} from "./services/Queries.ts";
import Landing from "./pages/Landing.tsx";
import Seasons from "./pages/Seasons.tsx";
import Players from "./pages/Players.tsx";
import Matches from "./pages/Matches.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import SeasonDetail from "./pages/SeasonDetail.tsx";
import Unregistered from "./pages/Unregistered.tsx";
import PlayerDetail from "./pages/PlayerDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

function App() {
    const {data: user} = useCurrentUser();

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
                    </div>
                    <div className="ml-auto flex h-12 shrink-0 items-center">
                        {user ? (
                            <NavLink to={`/players/${user.steamId}`} className="nav-link">
                                {user.username || user.steamId}
                            </NavLink>
                        ) : (
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
                    <Route path="/unregistered" element={<Unregistered/>}/>
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App
