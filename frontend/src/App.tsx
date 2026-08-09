import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';

type Page = 'landing' | 'dashboard' | 'history' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1">
        {currentPage === 'landing' && (
          <Landing onGetStarted={() => setCurrentPage('dashboard')} />
        )}

        {currentPage === 'dashboard' && <Dashboard />}

        {currentPage === 'history' && <History />}

        {currentPage === 'settings' && <Settings />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
