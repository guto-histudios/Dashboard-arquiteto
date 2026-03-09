import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Play, Pause, Square, Coffee, Target, X } from 'lucide-react';
import { clsx } from 'clsx';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export function PomodoroTimer() {
  const { config, activeTaskId, setActiveTaskId, tasks, atualizarTask, addXP, addCoins } = useApp();
  
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(config.duracaoPomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Sync initial time with config when mode changes or config updates
  useEffect(() => {
    if (!isActive) {
      if (mode === 'focus') setTimeLeft(config.duracaoPomodoro * 60);
      else if (mode === 'shortBreak') setTimeLeft(config.duracaoPausaCurta * 60);
      else if (mode === 'longBreak') setTimeLeft(config.duracaoPausaLonga * 60);
    }
  }, [config, mode, isActive]);

  // Show timer if there's an active task
  useEffect(() => {
    if (activeTaskId) {
      setIsVisible(true);
      setMode('focus');
      setTimeLeft(config.duracaoPomodoro * 60);
      setIsActive(false);
    }
  }, [activeTaskId, config.duracaoPomodoro]);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsActive(false);
    playAlertSound();

    if (mode === 'focus') {
      const newCompleted = pomodorosCompleted + 1;
      setPomodorosCompleted(newCompleted);
      
      // Add XP for completing a Pomodoro
      addXP(3);
      // Add Coins
      addCoins(1, 'Pomodoro completado');
      
      // Update task if active
      if (activeTaskId && activeTask) {
        atualizarTask(activeTaskId, {
          pomodorosFeitos: (activeTask.pomodorosFeitos || 0) + 1
        });
      }

      if (newCompleted % config.pomodorosAntesPause === 0) {
        setMode('longBreak');
        setTimeLeft(config.duracaoPausaLonga * 60);
        sendNotification('Pomodoro Concluído!', 'Hora de uma pausa longa. Você merece! (+3 XP)');
      } else {
        setMode('shortBreak');
        setTimeLeft(config.duracaoPausaCurta * 60);
        sendNotification('Pomodoro Concluído!', 'Hora de uma pausa curta. (+3 XP)');
      }
    } else {
      setMode('focus');
      setTimeLeft(config.duracaoPomodoro * 60);
      sendNotification('Pausa Terminada!', 'Hora de voltar ao foco.');
    }
  }, [mode, pomodorosCompleted, activeTaskId, activeTask, atualizarTask, config, playAlertSound, sendNotification, addXP]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    if (!isActive && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'focus') setTimeLeft(config.duracaoPomodoro * 60);
    else if (mode === 'shortBreak') setTimeLeft(config.duracaoPausaCurta * 60);
    else if (mode === 'longBreak') setTimeLeft(config.duracaoPausaLonga * 60);
  };

  const closeTimer = () => {
    setIsVisible(false);
    setIsActive(false);
    setActiveTaskId(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  const totalTime = mode === 'focus' 
    ? config.duracaoPomodoro * 60 
    : mode === 'shortBreak' 
      ? config.duracaoPausaCurta * 60 
      : config.duracaoPausaLonga * 60;
      
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={clsx(
        "glass-card p-5 w-72 relative overflow-hidden transition-all duration-500",
        isBreak ? "shadow-success/20 border-success/30" : "shadow-accent-purple/20 border-accent-purple/30"
      )}>
        {/* Background Progress */}
        <div 
          className={clsx(
            "absolute bottom-0 left-0 right-0 opacity-10 transition-all duration-1000 ease-linear -z-10",
            isBreak ? "bg-success" : "bg-accent-purple"
          )}
          style={{ height: `${progress}%` }}
        />

        <button 
          onClick={closeTimer}
          className="absolute top-3 right-3 text-text-sec hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          {isBreak ? (
            <Coffee size={18} className="text-success" />
          ) : (
            <Target size={18} className="text-accent-purple" />
          )}
          <span className="font-medium text-sm text-text-sec">
            {mode === 'focus' ? 'Foco' : mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa'}
          </span>
        </div>

        {activeTask && mode === 'focus' && (
          <div className="mb-4 text-sm font-medium truncate text-white">
            {activeTask.titulo}
          </div>
        )}

        <div className="text-5xl font-bold text-center mb-6 tracking-tighter tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={toggleTimer}
            className={clsx(
              "p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95",
              isActive 
                ? "bg-bg-sec text-warning hover:bg-warning/10" 
                : isBreak 
                  ? "bg-success text-white shadow-lg shadow-success/25"
                  : "bg-accent-purple text-white shadow-lg shadow-accent-purple/25"
            )}
          >
            {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-3 rounded-full bg-bg-sec text-text-sec hover:text-white hover:bg-border-subtle transition-all duration-300 active:scale-95"
          >
            <Square size={20} />
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: config.pomodorosAntesPause }).map((_, i) => (
            <div 
              key={i} 
              className={clsx(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i < (pomodorosCompleted % config.pomodorosAntesPause) 
                  ? "bg-accent-purple" 
                  : "bg-border-subtle"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
