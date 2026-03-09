import React, { useState } from 'react';
import { Habito } from '../../types';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface HabitoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habito: Habito) => void;
}

export function HabitoForm({ isOpen, onClose, onSave }: HabitoFormProps) {
  const [nome, setNome] = useState('');
  const [diasSemana, setDiasSemana] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [horario, setHorario] = useState('');
  const [categoria, setCategoria] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHabito: Habito = {
      id: uuidv4(),
      nome,
      diasSemana,
      horario,
      categoria,
      conclusoes: [],
      streak: 0,
    };
    onSave(newHabito);
    onClose();
    // Reset form
    setNome('');
    setDiasSemana([0, 1, 2, 3, 4, 5, 6]);
    setHorario('');
    setCategoria('');
  };

  const toggleDia = (dia: number) => {
    if (diasSemana.includes(dia)) {
      setDiasSemana(diasSemana.filter(d => d !== dia));
    } else {
      setDiasSemana([...diasSemana, dia].sort());
    }
  };

  const diasLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle sticky top-0 bg-bg-card/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold tracking-tight">Novo Hábito</h2>
          <button onClick={onClose} className="text-text-sec hover:text-white transition-colors p-2 hover:bg-bg-sec rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">Nome do Hábito</label>
            <input 
              required
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              className="input-modern"
              placeholder="Ex: Ler 10 páginas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-text-sec">Dias da Semana</label>
            <div className="flex justify-between gap-2">
              {diasLabels.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDia(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    diasSemana.includes(index) 
                      ? 'bg-gradient-to-br from-success to-emerald-600 text-white shadow-lg shadow-success/20 scale-110' 
                      : 'bg-bg-sec text-text-sec hover:bg-border-subtle hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Horário (Opcional)</label>
              <input 
                type="time"
                value={horario} 
                onChange={(e) => setHorario(e.target.value)} 
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Categoria</label>
              <input 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value)} 
                className="input-modern"
                placeholder="Ex: Saúde"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

