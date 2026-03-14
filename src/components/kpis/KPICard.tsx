import React, { useState, useEffect } from 'react';
import { KPI } from '../../types';
import { Edit2, Save, X, TrendingUp, TrendingDown, Activity, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface KPICardProps {
  kpi: KPI;
  onUpdate: (id: string, valor: number) => void;
  onEdit: (kpi: KPI) => void;
  onDelete: (id: string) => void;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, onUpdate, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(kpi.valorAtual);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    onUpdate(kpi.id, newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNewValue(kpi.valorAtual);
    setIsEditing(false);
  };

  const progress = Math.min((kpi.valorAtual / kpi.valorMeta) * 100, 100);
  const isAutomatic = kpi.tipoCalculo === 'automatico';

  // Calculate trend
  const history = kpi.historico || [];
  const lastValue = history.length > 1 ? history[history.length - 2].valor : 0;
  const trend = kpi.valorAtual - lastValue;
  const trendPercent = lastValue > 0 ? ((trend / lastValue) * 100).toFixed(1) : 0;

  const chartData = history.map(h => ({
    name: h.data.split('-').slice(1).join('/'), // MM/DD
    valor: h.valor
  }));

  return (
    <div className="card p-6 relative group hover:border-primary transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-serif text-[22px] font-semibold text-text-main tracking-tight flex items-center gap-2">
            {kpi.titulo}
          </h3>
          <p className="text-[14px] text-text-sec mt-1 capitalize">{kpi.frequencia}</p>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {!isAutomatic ? (
            isEditing ? (
              <>
                <button onClick={handleSave} className="text-success hover:text-emerald-400 transition-colors p-1.5 bg-success/10 rounded-lg"><Save size={16} /></button>
                <button onClick={handleCancel} className="text-error hover:text-red-400 transition-colors p-1.5 bg-error/10 rounded-lg"><X size={16} /></button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="text-text-sec hover:text-text-main transition-colors p-1.5 bg-bg-sec rounded-lg border border-border-subtle"><Edit2 size={16} /></button>
            )
          ) : (
            <div className="p-1.5 text-text-sec/50 cursor-not-allowed" title="Atualizado automaticamente">
              <Lock size={16} />
            </div>
          )}
          <button onClick={() => onEdit(kpi)} className="text-accent hover:text-amber-400 transition-colors p-1.5 bg-accent/10 rounded-lg"><Edit2 size={16} /></button>
          <button onClick={() => onDelete(kpi.id)} className="text-error hover:text-red-400 transition-colors p-1.5 bg-error/10 rounded-lg"><X size={16} /></button>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        {isEditing ? (
          <input 
            type="number" 
            value={newValue} 
            onChange={(e) => setNewValue(Number(e.target.value))} 
            className="bg-bg-sec border border-border-subtle rounded-[10px] h-[48px] px-4 py-3.5 w-32 text-[24px] font-bold text-text-main"
            autoFocus
          />
        ) : (
          <span className="text-[24px] font-bold text-text-main">
            {kpi.valorAtual}
          </span>
        )}
        <div className="mb-1.5 flex flex-col">
          <span className="text-text-sec text-[14px] font-medium uppercase tracking-wider">Meta: {kpi.valorMeta} {kpi.unidade}</span>
          {history.length > 1 && (
            <span className={clsx("text-[14px] flex items-center gap-1", trend >= 0 ? "text-success" : "text-error")}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(Number(trendPercent))}%
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-bg-sec rounded-full h-2 border border-border-subtle overflow-hidden mb-4">
        <div 
          className="bg-theme-primary h-full rounded-full transition-all duration-1000 ease-out relative" 
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>

      {/* Mini Chart */}
      {history.length > 1 && (
        <div className="h-16 w-full mt-4 opacity-50 hover:opacity-100 transition-opacity min-h-[64px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-theme-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-theme-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--color-text-main)' }}
                  cursor={{ stroke: 'var(--color-theme-primary)', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="var(--color-theme-primary)" 
                  fillOpacity={1} 
                  fill={`url(#gradient-${kpi.id})`} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {kpi.descricao && (
        <p className="text-xs text-text-sec mt-3 pt-3 border-t border-border-subtle/50 leading-relaxed line-clamp-2">
          {kpi.descricao}
        </p>
      )}
    </div>
  );
}

