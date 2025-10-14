import { Home, Shield, FileText, Settings } from 'lucide-react';
import { NavBar } from './ui/tubelight-navbar';

type Page = 'landing' | 'dashboard' | 'history' | 'settings';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { 
      name: 'Home', 
      url: '#', 
      icon: Home,
      page: 'landing' as Page
    },
    { 
      name: 'Redact', 
      url: '#', 
      icon: Shield,
      page: 'dashboard' as Page
    },
    { 
      name: 'History', 
      url: '#', 
      icon: FileText,
      page: 'history' as Page
    },
    { 
      name: 'Settings', 
      url: '#', 
      icon: Settings,
      page: 'settings' as Page
    }
  ];

  // Map current page to active tab name
  const getActiveTab = () => {
    const activeItem = navItems.find(item => item.page === currentPage);
    return activeItem?.name || 'Home';
  };

  return (
    <NavBar 
      items={navItems.map(item => ({
        ...item,
        onClick: () => onNavigate(item.page)
      }))}
      activeTab={getActiveTab()}
      className="sm:top-0"
    />
  );
}
