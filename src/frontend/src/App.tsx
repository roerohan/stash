import { Routes, Route } from 'react-router-dom';
import NewPaste from './pages/NewPaste';
import ViewPaste from './pages/ViewPaste';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<NewPaste />} />
          <Route path="/paste/:id" element={<ViewPaste />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
