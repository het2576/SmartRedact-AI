import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

type Page = 'landing' | 'dashboard' | 'history' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Always show navbar */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigation}
      />

      {/* Page content */}
      {currentPage === 'landing' && (
        <Landing onGetStarted={() => setCurrentPage('dashboard')} />
      )}

      {currentPage === 'dashboard' && (
        <Dashboard onBackToHome={() => setCurrentPage('landing')} />
      )}

      {currentPage === 'history' && (
        <div className="pt-20 pb-8 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Document History</h1>
            <p className="text-gray-600 mb-8">View your previous redaction jobs and downloads</p>
            <div className="glass-card rounded-3xl p-8">
              <p className="text-gray-700">History feature coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'settings' && (
        <div className="pt-20 pb-8 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600 mb-8">Configure your preferences and account settings</p>
            <div className="glass-card rounded-3xl p-8">
              <p className="text-gray-700">Settings feature coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {currentPage !== 'landing' && (
        <div className="mt-8">
          <Footer />
        </div>
      )}
    </div>
  );
}

export default App;
