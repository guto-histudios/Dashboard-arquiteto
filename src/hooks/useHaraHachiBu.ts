import { useState, useEffect } from 'react';
import { DailyMeals } from '../types';

export function useHaraHachiBu() {
  const [dailyMeals, setDailyMeals] = useState<DailyMeals | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvos = localStorage.getItem('dailyMeals');
    if (salvos) {
      setDailyMeals(JSON.parse(salvos));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando && dailyMeals) {
      localStorage.setItem('dailyMeals', JSON.stringify(dailyMeals));
    }
  }, [dailyMeals, carregando]);

  const saveDailyMeals = (meals: DailyMeals) => {
    setDailyMeals(meals);
  };

  const chooseMealOption = (optionId: string) => {
    if (dailyMeals) {
      setDailyMeals({
        ...dailyMeals,
        opcaoEscolhidaId: optionId
      });
    }
  };

  return { dailyMeals, saveDailyMeals, chooseMealOption, carregando };
}
