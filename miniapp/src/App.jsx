import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initTelegramApp } from './utils/telegram';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import EditorPage from './pages/EditorPage';

export default function App() {
  useEffect(() => {
    initTelegramApp();
  }, []);

  return (
    <Router>
      <div className="min-h-screen min-h-dvh">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
        </Routes>
      </div>
    </Router>
  );
}
