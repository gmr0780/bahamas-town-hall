import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Survey from './pages/Survey';
import AdminLayout from './components/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ResponseBrowser from './pages/admin/ResponseBrowser';
import ResponseDetail from './pages/admin/ResponseDetail';
import Demographics from './pages/admin/Demographics';
import PrioritiesView from './pages/admin/PrioritiesView';
import AIInsights from './pages/admin/AIInsights';
import Export from './pages/admin/Export';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="responses" element={<ResponseBrowser />} />
          <Route path="responses/:id" element={<ResponseDetail />} />
          <Route path="demographics" element={<Demographics />} />
          <Route path="priorities" element={<PrioritiesView />} />
          <Route path="insights" element={<AIInsights />} />
          <Route path="export" element={<Export />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
