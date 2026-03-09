import React, { useState, useEffect, useMemo } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

const QUOTES = [
  { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Não espere por circunstâncias ideais. Crie-as.", author: "George Bernard Shaw" },
  { text: "O segredo de progredir é começar.", author: "Mark Twain" },
  { text: "Você não precisa ser ótimo para começar, mas precisa começar para ser ótimo.", author: "Zig Ziglar" },
  { text: "A motivação é o que faz você começar. O hábito é o que faz você continuar.", author: "Jim Ryun" },
  { text: "Produtividade nunca é um acidente. É sempre o resultado de um compromisso com a excelência, planejamento inteligente e esforço focado.", author: "Paul J. Meyer" },
  { text: "Concentre todos os seus pensamentos no trabalho que tem em mãos. Os raios de sol não queimam até serem focados.", author: "Alexander Graham Bell" },
  { text: "Não confunda movimento com progresso.", author: "Ernest Hemingway" },
  { text: "Seja a mudança que você deseja ver no mundo.", author: "Mahatma Gandhi" },
  { text: "A vida é 10% o que acontece com você e 90% como você reage a isso.", author: "Charles R. Swindoll" },
  { text: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Vidal Sassoon" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "O que você faz hoje pode melhorar todos os seus amanhãs.", author: "Ralph Marston" },
  { text: "Ação é a chave fundamental para todo sucesso.", author: "Pablo Picasso" },
  { text: "Não conte os dias, faça os dias contarem.", author: "Muhammad Ali" },
  { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "A jornada de mil milhas começa com um único passo.", author: "Lao Tzu" },
  { text: "Acredite que você pode e você já está no meio do caminho.", author: "Theodore Roosevelt" },
  { text: "Faça o que você pode, com o que você tem, onde você está.", author: "Theodore Roosevelt" },
  { text: "O tempo é o recurso mais escasso e, a menos que seja gerenciado, nada mais pode ser gerenciado.", author: "Peter Drucker" },
  { text: "Foco é dizer não a centenas de outras boas ideias.", author: "Steve Jobs" },
  { text: "A simplicidade é o último grau de sofisticação.", author: "Leonardo da Vinci" },
  { text: "Não é que eu seja tão inteligente, é que eu fico com os problemas por mais tempo.", author: "Albert Einstein" },
  { text: "A sorte favorece a mente preparada.", author: "Louis Pasteur" },
  { text: "O homem que move uma montanha começa carregando pequenas pedras.", author: "Confúcio" },
  { text: "A excelência não é um ato, mas um hábito.", author: "Aristóteles" },
  { text: "Você perde 100% dos tiros que não dá.", author: "Wayne Gretzky" },
  { text: "O maior risco é não correr nenhum risco.", author: "Mark Zuckerberg" },
  { text: "A inovação distingue um líder de um seguidor.", author: "Steve Jobs" },
  { text: "Se você quer ir rápido, vá sozinho. Se quer ir longe, vá acompanhado.", author: "Provérbio Africano" },
  { text: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", author: "Albert Einstein" },
  { text: "O conhecimento fala, mas a sabedoria escuta.", author: "Jimi Hendrix" },
  { text: "A verdadeira medida de um homem não se vê na forma como se comporta em momentos de conforto e conveniência, mas em como se mantém em tempos de controvérsia e desafio.", author: "Martin Luther King Jr." },
  { text: "O que não nos mata nos torna mais fortes.", author: "Friedrich Nietzsche" },
  { text: "A vida é muito simples, mas insistimos em torná-la complicada.", author: "Confúcio" },
  { text: "A única maneira de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs" },
  { text: "Seja você mesmo; todos os outros já existem.", author: "Oscar Wilde" },
  { text: "O sucesso não é o final, o fracasso não é fatal: é a coragem de continuar que conta.", author: "Winston Churchill" },
  { text: "A felicidade não é algo pronto. Ela vem de suas próprias ações.", author: "Dalai Lama" },
  { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", author: "Nelson Mandela" },
  { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein" },
  { text: "A vida é o que acontece enquanto você está ocupado fazendo outros planos.", author: "John Lennon" },
  { text: "O maior erro que você pode cometer na vida é o de ficar o tempo todo com medo de cometer algum.", author: "Elbert Hubbard" },
  { text: "A única coisa que devemos temer é o próprio medo.", author: "Franklin D. Roosevelt" },
  { text: "A paz vem de dentro. Não a procure à sua volta.", author: "Buda" },
  { text: "A mente é tudo. O que você pensa, você se torna.", author: "Buda" },
  { text: "A vida é uma jornada, não um destino.", author: "Ralph Waldo Emerson" },
  { text: "O amor é a única força capaz de transformar um inimigo em amigo.", author: "Martin Luther King Jr." },
  { text: "A beleza está nos olhos de quem vê.", author: "Platão" },
  { text: "A verdade vos libertará.", author: "Jesus Cristo" }
];

export function DailyQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use the day of the year as a seed to select the daily quote
  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    setQuoteIndex(dayOfYear % QUOTES.length);
  }, []);

  const handleNextQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
      setIsAnimating(false);
    }, 300); // Matches the transition duration
  };

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between h-full bg-gradient-to-br from-bg-card to-bg-sec border-t-2 border-t-accent-blue/50">
      {/* Background Icon */}
      <div className="absolute -top-4 -right-4 opacity-5 text-accent-blue pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
        <Quote size={120} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="mb-4 text-accent-blue/80">
          <Quote size={24} fill="currentColor" />
        </div>
        
        <div className={clsx(
          "transition-all duration-300 ease-in-out",
          isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}>
          <p className="text-lg md:text-xl font-medium italic text-white leading-relaxed mb-4">
            "{currentQuote.text}"
          </p>
          <p className="text-sm font-bold text-accent-blue uppercase tracking-wider">
            — {currentQuote.author}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end relative z-10">
        <button 
          onClick={handleNextQuote}
          disabled={isAnimating}
          className="flex items-center gap-2 text-xs font-medium text-text-sec hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 active:scale-95"
          title="Próxima citação"
        >
          <RefreshCw size={14} className={clsx(isAnimating && "animate-spin")} />
          <span>Outra citação</span>
        </button>
      </div>
    </div>
  );
}
