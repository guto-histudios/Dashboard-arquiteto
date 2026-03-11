import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { REWARDS } from '../hooks/useGamification';
import { RewardCard } from '../components/gamification/RewardCard';
import { Recompensa, RecompensaComprada } from '../types';
import { Coins, ShoppingBag, History, Gift, CheckCircle, Clock } from 'lucide-react';
import { formatarData } from '../utils/dataUtils';
import { clsx } from 'clsx';

export function Loja() {
  const { gamification, buyReward, useReward } = useApp();
  const [activeTab, setActiveTab] = useState<'loja' | 'meus_rewards' | 'historico'>('loja');

  const handleBuy = (reward: Recompensa) => {
    const saldoAtual = Number(gamification.moedas || 0);
    const precoDaRecompensa = Number(reward.custo);

    console.log(`[Loja] Tentativa de resgate: ${reward.titulo}`);
    console.log(`[Loja] Saldo atual: ${saldoAtual} | Preço: ${precoDaRecompensa}`);

    if (saldoAtual < precoDaRecompensa) {
      console.log(`[Loja] Resgate negado: Moedas insuficientes.`);
      alert('Moedas insuficientes');
      return;
    }

    if (window.confirm(`Deseja resgatar "${reward.titulo}" por ${reward.custo} moedas?`)) {
      if (buyReward(reward)) {
        console.log(`[Loja] Resgate realizado com sucesso!`);
        alert('Resgate realizado com sucesso!');
      } else {
        console.log(`[Loja] Erro inesperado no resgate.`);
        alert('Moedas insuficientes');
      }
    }
  };

  const handleUse = (compraId: string) => {
    if (window.confirm('Deseja usar esta recompensa agora?')) {
      useReward(compraId);
    }
  };

  const rewardsNaoUsados = (gamification.recompensasCompradas || []).filter(r => !r.usada);
  const rewardsUsados = (gamification.recompensasCompradas || []).filter(r => r.usada);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShoppingBag size={32} className="text-accent-purple" />
            Loja de Recompensas
          </h1>
          <p className="text-text-sec text-lg">Troque suas moedas por recompensas incríveis.</p>
        </div>
        
        <div className="glass-card px-6 py-4 flex items-center gap-4 border border-warning/30 bg-warning/5 shadow-lg shadow-warning/10">
          <div className="p-3 bg-warning/20 rounded-full text-warning animate-pulse">
            <Coins size={32} />
          </div>
          <div>
            <p className="text-xs text-text-sec font-bold uppercase tracking-wider">Saldo Atual</p>
            <p className="text-3xl font-black text-warning tabular-nums">{gamification.moedas}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-subtle pb-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('loja')}
          className={clsx(
            "px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2",
            activeTab === 'loja' 
              ? "border-accent-purple text-accent-purple" 
              : "border-transparent text-text-sec hover:text-text-main hover:border-border-subtle"
          )}
        >
          <ShoppingBag size={16} />
          Loja
        </button>
        <button
          onClick={() => setActiveTab('meus_rewards')}
          className={clsx(
            "px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2",
            activeTab === 'meus_rewards' 
              ? "border-accent-blue text-accent-blue" 
              : "border-transparent text-text-sec hover:text-text-main hover:border-border-subtle"
          )}
        >
          <Gift size={16} />
          Meus Rewards ({rewardsNaoUsados.length})
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={clsx(
            "px-6 py-3 font-medium text-sm transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2",
            activeTab === 'historico' 
              ? "border-warning text-warning" 
              : "border-transparent text-text-sec hover:text-text-main hover:border-border-subtle"
          )}
        >
          <History size={16} />
          Histórico
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'loja' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {REWARDS.map(reward => (
              <RewardCard 
                key={reward.id} 
                reward={reward} 
                onBuy={handleBuy} 
                canAfford={Number(gamification.moedas || 0) >= Number(reward.custo)} 
              />
            ))}
          </div>
        )}

        {activeTab === 'meus_rewards' && (
          <div className="space-y-8">
            {rewardsNaoUsados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewardsNaoUsados.map(compra => {
                  const reward = REWARDS.find(r => r.id === compra.recompensaId);
                  if (!reward) return null;
                  
                  return (
                    <div key={compra.id} className="glass-card p-6 relative group border-l-4 border-accent-blue">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{reward.titulo}</h3>
                          <p className="text-text-sec text-sm">{reward.descricao}</p>
                        </div>
                        <div className="text-xs text-text-sec bg-bg-sec px-2 py-1 rounded-md border border-border-subtle">
                          Comprado em {formatarData(compra.dataCompra)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleUse(compra.id)}
                        className="w-full bg-accent-blue text-white py-3 rounded-xl font-medium hover:bg-accent-blue/90 transition-colors shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Usar Recompensa
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 glass-card">
                <Gift size={48} className="mx-auto text-text-sec mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-text-sec">Nenhuma recompensa disponível</h3>
                <p className="text-text-sec mt-2">Visite a loja para comprar recompensas!</p>
              </div>
            )}

            {rewardsUsados.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border-subtle">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-sec">
                  <CheckCircle size={20} />
                  Recompensas Usadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                  {rewardsUsados.map(compra => {
                    const reward = REWARDS.find(r => r.id === compra.recompensaId);
                    if (!reward) return null;
                    
                    return (
                      <div key={compra.id} className="bg-bg-sec p-4 rounded-xl border border-border-subtle flex justify-between items-center">
                        <div>
                          <h4 className="font-medium line-through text-text-sec">{reward.titulo}</h4>
                          <p className="text-xs text-text-sec">Usado em {compra.dataUso ? formatarData(compra.dataUso) : '-'}</p>
                        </div>
                        <CheckCircle size={16} className="text-success" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-sec border-b border-border-subtle text-text-sec uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(gamification.historicoMoedas || []).length > 0 ? (
                    (gamification.historicoMoedas || []).map(transacao => (
                      <tr key={transacao.id} className="hover:bg-bg-sec/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-text-sec">
                          {formatarData(transacao.data)}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {transacao.descricao}
                        </td>
                        <td className={clsx(
                          "px-6 py-4 text-right font-bold tabular-nums",
                          transacao.tipo === 'ganho' ? "text-success" : "text-error"
                        )}>
                          {transacao.tipo === 'ganho' ? '+' : '-'}{transacao.quantidade}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-text-sec">
                        Nenhuma transação registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
