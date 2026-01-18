import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    fetch("/api/players")
      .then((response) => response.json())
      .then((data) => setPlayers(data));
  }, []);

  useEffect(() => {
    fetch("/api/seasons")
      .then((response) => response.json())
      .then((data) => setSeasons(data));
  }, []);

  return (
    <div>
      <h1>Players</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Elo</th> 
          </tr>
          </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.steamId}>
              <td>{player.steamId}</td>
              <td>{player.username}</td>
              <td>{player.elo}</td>
              </tr>
          ))}
        </tbody>
      </table>
      <h1>Seasons</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((season) => (
            <tr key={season.name}>
              <td>{season.name}</td>
              <td>{season.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;