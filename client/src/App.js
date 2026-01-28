import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import './styles/index.css';

function App() {
  return (
    <SocketProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
        </Routes>
      </div>
    </SocketProvider>
  );
}

export default App;