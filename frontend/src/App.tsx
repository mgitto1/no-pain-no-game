import React, { useState } from 'react';
import { NavBar } from './components';
import { Dashboard, Settings, Restrictions } from './views';
import { BlockConfigProvider, PollerProvider } from '../context';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'Restrictions':
        return <Restrictions />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <PollerProvider>
      <BlockConfigProvider>
        <div className="flex h-screen w-screen bg-black font-sans">
          <NavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="w-full flex-1 overflow-y-auto p-10">
            {renderPage()}
          </div>
        </div>
      </BlockConfigProvider>
    </PollerProvider>
  );
}
