
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Spinner from './components/Spinner';


// Lazy load all pages
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const AddSkill = lazy(() => import('./pages/AddSkill'));
const SessionRoom = lazy(() => import('./pages/SessionRoom'));
const Ongoing = lazy(() => import('./pages/Ongoing'));
const History = lazy(() => import('./pages/History'));
const SkillDetails = lazy(() => import('./pages/SkillDetails'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Forum = lazy(() => import('./pages/Forum'));
const GroupSessions = lazy(() => import('./pages/GroupSessions'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const DebugHistory = lazy(() => import('./pages/DebugHistory'));
const About = lazy(() => import('./pages/About'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const SavedSkills = lazy(() => import('./pages/SavedSkills'));
const Certificate = lazy(() => import('./pages/Certificate'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <Router>

      <Layout>
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/saved-skills" element={<SavedSkills />} />
            <Route path="/certificate/:id" element={<Certificate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/add-skill" element={<AddSkill />} />
            <Route path="/session/:requestId" element={<SessionRoom />} />
            <Route path="/ongoing" element={<Ongoing />} />
            <Route path="/skill/:skillId" element={<SkillDetails />} />
            <Route path="/history" element={<History />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:postId" element={<PostDetails />} />
            <Route path="/group-sessions" element={<GroupSessions />} />
            <Route path="/group-session/:sessionId" element={<SessionRoom />} />
            <Route path="/about" element={<About />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug-history" element={<DebugHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
