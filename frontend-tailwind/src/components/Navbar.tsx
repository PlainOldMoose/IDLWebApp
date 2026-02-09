import {NavLink} from "react-router-dom";
import {useCurrentUser} from "../services/Queries.ts";

export default function Navbar() {
    const {data: user} = useCurrentUser();

    return (
        <nav className="flex p-4 justify-between items-center bg-surface-a20">
            {/*Logo*/}
            <div>
                <NavLink to="/" className="nav-link">IDL Web App</NavLink>
            </div>
            {/*Links*/}
            <div className="flex gap-4">
                {user ? (
                    <span className="nav-link">{user.username || user.steamId}</span>
                ) : (
                    <button
                        onClick={() => window.location.href = 'http://localhost:8080/auth/login'}
                        className="nav-link"
                    >
                        Login with Steam
                    </button>
                )}
                <NavLink to="/players" className="nav-link">Players</NavLink>
                <NavLink to="/seasons" className="nav-link">Seasons</NavLink>
                <NavLink to="/matches" className="nav-link">Matches</NavLink>
                <NavLink to="/tools" className="nav-link">Tools</NavLink>
            </div>
        </nav>
    );
}