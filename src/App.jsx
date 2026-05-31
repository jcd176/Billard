import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GamePage from './components/GamePage';

function App() {
  const [currentRoomId, setCurrentRoomId] = useState(null);

  if (!currentRoomId) {
    return <LandingPage onJoinRoom={setCurrentRoomId} />;
  }

  return <GamePage roomId={currentRoomId} onLeave={() => setCurrentRoomId(null)} />;
}
export default App;
