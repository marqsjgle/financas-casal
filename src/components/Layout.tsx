import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, List, PieChart } from 'lucide-react';

export function Layout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto w-full h-full p-4">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-md mx-auto w-full flex justify-around items-center h-16">
          <NavLink
            to="/extrato"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-medium">Extrato</span>
          </NavLink>

          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">Novo</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <PieChart className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
