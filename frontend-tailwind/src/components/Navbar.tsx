export default function Navbar() {
    return (
        <nav className="flex p-4 justify-between bg-dark-grey border-b">
            {/*Logo*/}
            <div>
                IDL Web App
            </div>
            {/*Links*/}
            <div className="flex gap-4">
                <a>Players</a>
                <a>Seasons</a>
                <a>Matches</a>
                <a>Tools</a>
            </div>
        </nav>
    );
}