import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update immediately on mount
    setTime(new Date());
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const zonedTime = toZonedTime(time, 'America/Sao_Paulo');
  
  const dayOfWeek = format(zonedTime, 'EEEE', { locale: ptBR });
  const dateStr = format(zonedTime, "d MMMM yyyy", { locale: ptBR });
  const timeStr = format(zonedTime, 'HH:mm', { locale: ptBR });
  const capitalizedDate = dateStr.replace(dateStr.charAt(0), dateStr.charAt(0).toUpperCase()).replace(/(\s)([a-z])/, (match, p1, p2) => p1 + p2.toUpperCase());

  // Capitalize first letter of dayOfWeek
  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  return (
    <div className="text-text-sec font-medium text-sm text-right">
      <p>{capitalizedDay}</p>
      <p>{capitalizedDate}</p>
      <p className="text-2xl font-bold text-text-main mt-1">{timeStr}</p>
    </div>
  );
}
