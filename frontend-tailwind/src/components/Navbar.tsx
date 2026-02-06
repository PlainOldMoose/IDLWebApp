import {Link} from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="flex mx-8 mt-8 p-4 justify-between bg-accent rounded-full">
            {/*Logo*/}
            <div>
                <Link to="/" className="nav-link">IDL Web App</Link>
            </div>
            {/*Links*/}
            <div className="flex gap-4">
                <Link to="/players" className="nav-link">Players</Link>
                <Link to="/seasons" className="nav-link">Seasons</Link>
                <Link to="/matches" className="nav-link">Matches</Link>
                <Link to="/tools" className="nav-link">Tools</Link>
            </div>
        </nav>
    );
}