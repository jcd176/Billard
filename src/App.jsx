import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';

function App() {
  const [roomId, setRoomId] = useState(null);

  return roomId ? (
    <GamePage roomId={roomId} onLeave={() => setRoomId(null)} />
  ) : (
    <LandingPage onJoinRoom={setRoomId} />
  );
}
export default App;
