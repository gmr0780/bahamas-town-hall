import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Survey from './pages/Survey';
import ChatSurvey from './pages/ChatSurvey';
import Results from './pages/Results';
import AdminLayout from './components/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Questions from './pages/admin/Questions';
import ResponseBrowser from './pages/admin/ResponseBrowser';
import ResponseDetail from './pages/admin/ResponseDetail';
import Demographics from './pages/admin/Demographics';
import AIInsights from './pages/admin/AIInsights';
import Export from './pages/admin/Export';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/survey/chat" element={<ChatSurvey />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="questions" element={<Questions />} />
          <Route path="responses" element={<ResponseBrowser />} />
          <Route path="responses/:id" element={<ResponseDetail />} />
          <Route path="demographics" element={<Demographics />} />
          <Route path="insights" element={<AIInsights />} />
          <Route path="export" element={<Export />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
