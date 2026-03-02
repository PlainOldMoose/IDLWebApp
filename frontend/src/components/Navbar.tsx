import {NavLink, useNavigate} from "react-router-dom";
import {useCurrentUser} from "../services/Queries.ts";
import {AUTH_URL} from "../services/Api.ts";

export default function Navbar() {
    const {data: user} = useCurrentUser();
    const navigate = useNavigate();


    return (
        <nav className="flex p-4 justify-between items-center bg-surface-a20 text-light-a30">
            {/*Logo*/}
            <div>
                <NavLink to="/" className="nav-link">IDL Web App</NavLink>
            </div>
            {/*Links*/}
            <div className="flex gap-4">
                {user ? (
                    <button className="nav-link hover:cursor-pointer"
                    onClick={() => navigate(`/players/${user.steamId}`)}>{user.username || user.steamId}</button>
                ) : (
                    <button
                        onClick={() => window.location.href = `${AUTH_URL}/login`}
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