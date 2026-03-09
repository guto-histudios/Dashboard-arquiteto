import React, { useState } from 'react';
import { NutritionProfile } from '../../types';
import { clsx } from 'clsx';

interface NutritionFormProps {
  initialData?: NutritionProfile;
  onSubmit: (data: NutritionProfile) => void;
  loading?: boolean;
}

export function NutritionForm({ initialData, onSubmit, loading }: NutritionFormProps) {
  const [formData, setFormData] = useState<NutritionProfile>(initialData || {
    peso: 70,
    altura: 170,
    idade: 30,
    genero: 'masculino',
    nivelAtividade: 'moderado',
    objetivo: 'manter',
    restricoesAlimentares: [],
    preferencias: '',
    naoGosta: '',
    refeicoesPorDia: 3,
    horariosRefeicoes: '',
    metaCaloricaPersonalizada: undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
      finalValue = value === '' ? undefined : Number(value);
    } else if (name === 'refeicoesPorDia') {
      finalValue = Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Peso (kg)</label>
          <input
            type="number"
            name="peso"
            value={formData.peso}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Altura (cm)</label>
          <input
            type="number"
            name="altura"
            value={formData.altura}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Idade</label>
          <input
            type="number"
            name="idade"
            value={formData.idade}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Gênero</label>
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          >
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Nível de Atividade</label>
          <select
            name="nivelAtividade"
            value={formData.nivelAtividade}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          >
            <option value="sedentario">Sedentário (pouco ou nenhum exercício)</option>
            <option value="leve">Leve (exercício leve 1-3 dias/semana)</option>
            <option value="moderado">Moderado (exercício moderado 3-5 dias/semana)</option>
            <option value="ativo">Ativo (exercício pesado 6-7 dias/semana)</option>
            <option value="muito_ativo">Muito Ativo (exercício muito pesado/trabalho físico)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Objetivo</label>
          <select
            name="objetivo"
            value={formData.objetivo}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          >
            <option value="perder_peso">Perder Peso</option>
            <option value="manter">Manter Peso</option>
            <option value="ganhar_musculo">Ganhar Músculo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Refeições por Dia</label>
          <select
            name="refeicoesPorDia"
            value={formData.refeicoesPorDia}
            onChange={handleChange}
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          >
            <option value={3}>3 Refeições</option>
            <option value={4}>4 Refeições</option>
            <option value={5}>5 Refeições</option>
            <option value={6}>6 Refeições</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Horários Preferidos</label>
          <input
            type="text"
            name="horariosRefeicoes"
            value={formData.horariosRefeicoes}
            onChange={handleChange}
            placeholder="Ex: 08:00, 12:00, 19:00"
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-sec mb-2">Meta Calórica (Opcional)</label>
          <input
            type="number"
            name="metaCaloricaPersonalizada"
            value={formData.metaCaloricaPersonalizada || ''}
            onChange={handleChange}
            placeholder="Deixe em branco para calcular"
            className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
          />
          <p className="text-xs text-text-sec mt-1">Se preenchido, ignorará o cálculo automático.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-sec mb-2">Preferências Alimentares</label>
        <textarea
          name="preferencias"
          value={formData.preferencias}
          onChange={handleChange}
          placeholder="O que você gosta de comer?"
          className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-sec mb-2">O que não gosta / Alergias</label>
        <textarea
          name="naoGosta"
          value={formData.naoGosta}
          onChange={handleChange}
          placeholder="O que evitar?"
          className="w-full bg-bg-sec border border-border-subtle rounded-lg px-4 py-2 text-white focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all h-24 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={clsx(
          "w-full py-3 rounded-xl font-medium transition-all duration-300",
          loading 
            ? "bg-bg-sec text-text-sec cursor-not-allowed"
            : "bg-accent-blue hover:bg-accent-blue/90 text-white shadow-lg shadow-accent-blue/20"
        )}
      >
        {loading ? 'Gerando Plano...' : 'Gerar Plano Alimentar'}
      </button>
    </form>
  );
}
