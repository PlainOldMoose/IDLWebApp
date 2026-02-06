import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="flex p-4 justify-between bg-dark-grey border-b">
            {/*Logo*/}
            <div>
                <Link to="/">IDL Web App</Link>
            </div>
            {/*Links*/}
            <div className="flex gap-4">
                <Link to="/players">Players</Link>
                <Link to="/seasons">Seasons</Link>
                <Link to="/matches">Matches</Link>
                <Link to="/tools">Tools</Link>
            </div>
        </nav>
    );
}