'use client';

import React from 'react';
import { XMarkIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Manual } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentManuals: Manual[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, recentManuals }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {/* Navigation items */}
            <a
              href="/"
              className="bg-primary-100 text-primary-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            >
              <DocumentTextIcon className="text-primary-500 mr-3 h-5 w-5" />
              Todos os Manuais
            </a>
          </div>

          {/* Recent Manuals */}
          {recentManuals.length > 0 && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recentes
              </h3>
              <div className="mt-2 space-y-1">
                {recentManuals.map((manual) => (
                  <a
                    key={manual.id}
                    href={`/manuals/${manual.id}`}
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  >
                    <ClockIcon className="text-gray-400 mr-3 h-4 w-4" />
                    <span className="truncate">{manual.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;