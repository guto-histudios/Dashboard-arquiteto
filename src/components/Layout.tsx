import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Target, BarChart2, Settings, Menu, X, Activity, KanbanSquare, Dumbbell, Star, Maximize, Utensils, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { PomodoroTimer } from './common/PomodoroTimer';
import { FocusMode } from './common/FocusMode';
import { useApp } from '../contexts/AppContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { gamification, getLevelInfo, isFocusMode, setIsFocusMode } = useApp();

  const levelInfo = getLevelInfo(gamification.totalXP);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Perfil', href: '/perfil', icon: Star },
    { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
    { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
    { name: 'Hábitos', href: '/habitos', icon: Calendar },
    { name: 'Metas', href: '/metas', icon: Target },
    { name: 'KPIs', href: '/kpis', icon: Activity },
    { name: 'Darebee', href: '/darebee', icon: Dumbbell },
    { name: 'Hara Hachi Bu', href: '/harahachibu', icon: Utensils },
    { name: 'Loja', href: '/loja', icon: ShoppingBag },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Avaliação Semanal', href: '/avaliacao-semanal', icon: Activity },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  // Keyboard shortcut to enter focus mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
        setIsFocusMode(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsFocusMode]);

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex font-sans selection:bg-accent-primary/30">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-border bg-bg-card shrink-0">
          <span className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent tracking-tight">O Arquiteto</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFocusMode(true)}
              className="hidden lg:flex items-center justify-center p-2 text-text-sec hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
              title="Modo Foco (F)"
            >
              <Maximize size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-text-sec hover:text-text-main transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* User Level Mini-Profile */}
        <div className="px-6 py-6 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-accent-secondary flex items-center justify-center bg-bg-main shadow-lg">
                <span className="font-bold text-lg text-white">{levelInfo.nivel}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-accent-primary rounded-full p-0.5 border-2 border-bg-card">
                <Star size={10} className="text-white" fill="currentColor" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white mb-1">Nível {levelInfo.nivel}</p>
              <div className="w-full bg-bg-main rounded-full h-1.5 border border-border overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accent-secondary to-accent-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progressoPercentual}%` }}
                />
              </div>
              <p className="text-xs text-text-sec mt-1 text-right">{levelInfo.xpAtualNoNivel}/{levelInfo.xpParaProximoNivel} XP</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto pb-4 scrollbar-hide">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={clsx(
                  isActive 
                    ? 'bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 text-white border border-accent-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                    : 'text-text-sec hover:bg-bg-card hover:text-white border border-transparent',
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300'
                )}
              >
                <item.icon className={clsx(
                  isActive ? 'text-accent-blue' : 'text-text-sec group-hover:text-white',
                  'mr-4 flex-shrink-0 h-5 w-5 transition-colors'
                )} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-main relative">
        {/* Top gradient blur effect for modern feel */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-accent-blue/5 to-transparent pointer-events-none -z-10"></div>
        
        <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-bg-sec/80 backdrop-blur-md border-b border-border-subtle sticky top-0 z-30">
          <span className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">O Arquiteto</span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-text-sec hover:text-white hover:bg-bg-card transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu size={24} />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <PomodoroTimer />
      <FocusMode />
    </div>
  );
}



