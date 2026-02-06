import Navbar from "./components/Navbar.tsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Landing from "./pages/Landing.tsx";

function App() {

    return (
        <BrowserRouter>
            <Navbar/>
            <Routes>
                <Route path="/" element={<Landing/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App
