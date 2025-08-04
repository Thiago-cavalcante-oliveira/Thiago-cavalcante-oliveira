'use client';

import React from 'react';
import { Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
  onCreateClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onCreateClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Manual Manager
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onCreateClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Manual
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;