import Navbar from "./components/Navbar.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Landing from "./pages/Landing.tsx";
import Seasons from "./pages/Seasons.tsx";
import Players from "./pages/Players.tsx";
import Matches from "./pages/Matches.tsx";

function App() {

    return (
        <BrowserRouter>
            <main className="max-w-4xl mx-auto text-light-grey">
                <Navbar/>
                <Routes>
                    <Route path="/" element={<Landing/>}/>
                    <Route path="/players" element={<Players/>}/>
                    <Route path="/seasons" element={<Seasons/>}/>
                    <Route path="/matches" element={<Matches/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App
