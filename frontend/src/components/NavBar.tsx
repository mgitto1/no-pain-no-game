import React from 'react';
import { usePoller } from '../../context';

export const NavBar = ({
  currentPage,
  setCurrentPage,
}: {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}) => {
  const navItems = ['Dashboard', 'Restrictions', 'Settings'];
  const { pollerRunning } = usePoller();

  return (
    <div className="bg-[#1e1e1e] w-48 h-full p-4 text-white flex flex-col justify-between border-r border-gray-700">
      <div>
        <h1 className="text-lg font-bold mb-6">No Pain No Game</h1>
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setCurrentPage(item)}
            className={`block text-left w-full px-2 py-2 mb-2 rounded ${
              currentPage === item ? 'bg-[#2d2d2d]' : 'hover:bg-[#2a2a2a]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div>
        <p className="text-xs italic mb-4">
          Poller status:
          <span className={pollerRunning ? 'text-green-500' : 'text-red-500'}>
            {pollerRunning ? ' Active' : ' Not Running'}
          </span>
        </p>
        <p className="text-xs text-gray-400">v1.0</p>
      </div>
    </div>
  );
};
