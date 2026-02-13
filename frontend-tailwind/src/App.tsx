import Navbar from "./components/Navbar.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Landing from "./pages/Landing.tsx";
import Seasons from "./pages/Seasons.tsx";
import Players from "./pages/Players.tsx";
import Matches from "./pages/Matches.tsx";
import SeasonDetail from "./pages/SeasonDetail.tsx";
import Unregistered from "./pages/Unregistered.tsx";

function App() {

    return (
        <BrowserRouter>

            <div className="text-light-a10 font-inter">
                <Navbar/>
                <main className="max-w-5xl mx-auto">
                    <Routes>
                        <Route path="/" element={<Landing/>}/>
                        <Route path="/players" element={<Players/>}/>
                        <Route path="/seasons" element={<Seasons/>}/>
                        <Route path="/seasons/:seasonId" element={<SeasonDetail/>}/>
                        <Route path="/matches" element={<Matches/>}/>
                        <Route path="/unregistered" element={<Unregistered/>}/>
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App
