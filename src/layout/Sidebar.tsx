import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Target, BarChart2, Settings, Activity, KanbanSquare, Dumbbell, Utensils, ShoppingBag, Star, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Hábitos', href: '/habitos', icon: Calendar },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'KPIs', href: '/kpis', icon: Activity },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="w-[260px] bg-bg-sec border-r border-border-subtle h-screen flex flex-col p-6">
      <div className="text-2xl font-serif font-semibold mb-10 text-text-main">O Arquiteto</div>
      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] transition-colors',
                isActive ? 'bg-bg-card text-text-main' : 'text-text-sec hover:bg-bg-card hover:text-text-main'
              )}
            >
              <item.icon size={20} strokeWidth={1.5} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-border-subtle">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] text-text-sec hover:bg-bg-card hover:text-text-main w-full transition-colors"
        >
          {isDark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </div>
  );
};
