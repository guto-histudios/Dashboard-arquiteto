import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../contexts/AppContext';
import { Trophy, X } from 'lucide-react';

export function BadgeNotification() {
  const { recentBadges, clearRecentBadge, badgesInfo } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {recentBadges.map((badgeId) => {
          const badge = badgesInfo[badgeId];
          if (!badge) return null;

          return (
            <BadgeToast 
              key={badgeId} 
              badge={badge} 
              onClose={() => clearRecentBadge(badgeId)} 
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface BadgeToastProps {
  badge: any;
  onClose: () => void;
}

const BadgeToast: React.FC<BadgeToastProps> = ({ badge, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="max-w-sm w-full bg-gray-800 border border-yellow-500/30 rounded-xl shadow-2xl overflow-hidden relative pointer-events-auto"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
      
      <div className="p-4 flex items-start gap-4">
        <div className={`p-3 rounded-full bg-gray-700/50 ${badge.cor}`}>
          <Trophy className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">
            Nova Conquista Desbloqueada!
          </p>
          <h4 className="text-lg font-bold text-white mb-1">{badge.nome}</h4>
          <p className="text-sm text-gray-400">{badge.descricao}</p>
        </div>
        
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
