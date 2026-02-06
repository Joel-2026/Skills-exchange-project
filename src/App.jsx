
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Profile from './pages/Profile';
import AddSkill from './pages/AddSkill';
import SessionRoom from './pages/SessionRoom';
import Ongoing from './pages/Ongoing';
import History from './pages/History';
import Onboarding from './pages/Onboarding';
import Leaderboard from './pages/Leaderboard';
import Forum from './pages/Forum';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/add-skill" element={<AddSkill />} />
          <Route path="/session/:requestId" element={<SessionRoom />} />
          <Route path="/ongoing" element={<Ongoing />} />
          <Route path="/history" element={<History />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/forum" element={<Forum />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
