import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Image as ImageIcon, Play, Info } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Activity className="w-4 h-4 mr-2" /> },
    { name: 'Samples', path: '/samples', icon: <ImageIcon className="w-4 h-4 mr-2" /> },
    { name: 'Try It', path: '/inference', icon: <Play className="w-4 h-4 mr-2" /> },
    { name: 'About', path: '/about', icon: <Info className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="bg-black border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white tracking-tight">
                Denoise<span className="text-blue-500">RX</span>
              </span>
            </Link>
          </div>

          {/* Links Section */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-zinc-900 text-blue-400 border border-zinc-800' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}