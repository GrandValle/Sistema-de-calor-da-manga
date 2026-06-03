'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Sprout, ChevronRight, Users,
  AlertTriangle, CheckCircle, FileText, Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { locaPlanta } from '@/src/data/dados';
import { getSessoes } from '@/src/services/api';

// --- Interfaces Tipadas ---
interface Relatorio {
  porcentagem: number;
  [key: string]: any;
}

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador: string;
  criadoEm: string;
  relatorios: Relatorio[];
  avaliacoes?: any[];
}

interface GrupoPorData {
  dataIso: string;
  dataFormatada: string;
  totalPlantas: number;
  avaliadores: string[];
  alertasCriticos: number;
  sessoes: Sessao[];
}

// --- Componente de Loading (Skeleton) ---
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-48">
        <div className="flex justify-between mb-4">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-6 h-10 w-full bg-gray-100 rounded"></div>
      </div>
    ))}
  </div>
);

export default function LocalHistoryPage() {
  const params = useParams();
  const router = useRouter();

  const centroCustoParam = decodeURIComponent(params.centroCusto as string);

  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<GrupoPorData[]>([]);
  const [filtro, setFiltro] = useState('');

  const infoLocal = locaPlanta.find(l => l.centroCusto === centroCustoParam);
  const nomeLocal = infoLocal ? infoLocal.name : `Local CC: ${centroCustoParam}`;

  // --- Lógica de Busca e Processamento ---
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const todosDados: Sessao[] = await getSessoes();

      // Filtragem inicial pelo local
      const dadosDoLocal = todosDados.filter(d => d.centroCusto === centroCustoParam);

      // Agrupamento por Data
      const agrupado: Record<string, Sessao[]> = {};
      dadosDoLocal.forEach(sessao => {
        const dia = sessao.criadoEm.split('T')[0];
        if (!agrupado[dia]) agrupado[dia] = [];
        agrupado[dia].push(sessao);
      });

      const listaGrupos: GrupoPorData[] = Object.keys(agrupado).map(dia => {
        const sessoesDoDia = agrupado[dia];

        // 🚀 MATEMÁTICA REAL COMBINADA
        const countCriticos = sessoesDoDia.filter(s => {
          const criticoNoResumo = s.relatorios?.some((r) => Number(r.porcentagem) > 5);
          const temNotaGraveBruta = s.avaliacoes?.some((a) => Number(a.nota) > 5);

          let temInfestacaoPorVolume = false;
          if (s.avaliacoes && s.avaliacoes.length > 0) {
            const somaPorPraga: Record<string, number> = {};
            s.avaliacoes.forEach(a => {
              const notaNum = Number(a.nota);
              if (notaNum > 0) {
                somaPorPraga[a.doencaOuPraga] = (somaPorPraga[a.doencaOuPraga] || 0) + notaNum;
              }
            });
            temInfestacaoPorVolume = Object.values(somaPorPraga).some(soma => soma > 5);
          }

          return criticoNoResumo || temNotaGraveBruta || temInfestacaoPorVolume;
        }).length;

        const nomesUnicos = Array.from(new Set(sessoesDoDia.map(s => s.nomeAvaliador || "Desconhecido")));

        return {
          dataIso: dia,
          dataFormatada: format(parseISO(dia), "dd 'de' MMM, yyyy", { locale: ptBR }),
          totalPlantas: sessoesDoDia.length,
          avaliadores: nomesUnicos,
          alertasCriticos: countCriticos,
          sessoes: sessoesDoDia
        };
      });

      // Ordenação decrescente (mais recente primeiro) garante a ordem correta!
      listaGrupos.sort((a, b) => b.dataIso.localeCompare(a.dataIso));

      setGrupos(listaGrupos);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  }, [centroCustoParam]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // --- Filtro (Opcional) ---
  const gruposFiltrados = useMemo(() => {
    return grupos.filter(g =>
      g.dataFormatada.toLowerCase().includes(filtro.toLowerCase()) ||
      g.avaliadores.some(a => a.toLowerCase().includes(filtro.toLowerCase()))
    );
  }, [grupos, filtro]);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 p-2.5 rounded-xl transition-all shadow-md focus:ring-2 focus:ring-emerald-300"
              title="Voltar"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{nomeLocal}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-mono text-gray-770">{centroCustoParam}</span>
                <span>• Histórico de Monitoramento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        {!loading && grupos.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filtrar por data ou avaliador..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-green-900 bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-900/50 focus:border-green-900 transition-all text-sm placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Conteúdo Principal - Lista Única Ordenada por Data */}
        {loading ? (
          <LoadingSkeleton />
        ) : gruposFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-400" size={32} />
            </div>
            <h3 className="text-gray-900 font-semibold text-xl mb-2">
              {filtro ? 'Nenhum resultado para o filtro' : 'Nenhum registro encontrado'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {filtro ? 'Tente buscar por outro termo.' : 'Não há histórico de monitoramento registrado para este local.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gruposFiltrados.map((grupo) => {
              // A variável mágica que decide as cores do card individual:
              const ehCritico = grupo.alertasCriticos > 0;

              return (
                <div
                  key={grupo.dataIso}
                  onClick={() => router.push(`/local/${encodeURIComponent(centroCustoParam)}/${grupo.dataIso}`)}
                  className={`group bg-white rounded-xl border p-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden focus-within:ring-2 ${ehCritico
                    ? 'border-gray-200 hover:border-red-400 focus-within:ring-red-300'
                    : 'border-gray-200 hover:border-green-400 focus-within:ring-green-300'
                    }`}
                  tabIndex={0}
                  title={`Ver detalhes do dia ${grupo.dataFormatada}`}
                >
                  {/* Header Dinâmico (Fundo fica avermelhado ou esverdeado no hover) */}
                  <div className={`p-5 border-b border-gray-100 bg-gray-50/60 transition-colors ${ehCritico ? 'group-hover:bg-red-50/30' : 'group-hover:bg-green-50/30'
                    }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`bg-white border border-gray-200 shadow-sm p-2 rounded-lg transition-colors ${ehCritico ? 'group-hover:border-red-200 group-hover:text-red-600' : 'group-hover:border-green-200 group-hover:text-green-700'
                          }`}>
                          <Calendar size={20} className={ehCritico ? 'text-red-600' : 'text-green-700'} />
                        </div>
                        <div>
                          <span className="block font-bold text-gray-900 text-lg capitalize">
                            {grupo.dataFormatada}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{grupo.dataIso}</span>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-gray-300 group-hover:translate-x-1 transition-all duration-200 ${ehCritico ? 'group-hover:text-red-600' : 'group-hover:text-green-700'
                          }`}
                      />
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Sprout size={16} className="text-emerald-500" />
                        <span>{grupo.totalPlantas} planta{grupo.totalPlantas > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={16} className="text-purple-500" />
                        <span className="truncate max-w-28" title={grupo.avaliadores.join(', ')}>
                          {grupo.avaliadores.length > 1 ? `${grupo.avaliadores.length} avaliadores` : grupo.avaliadores[0]}
                        </span>
                      </div>
                    </div>

                    {/* Selo Dinâmico (CRÍTICO vermelho ou NORMAL verde) */}
                    <div className="pt-2">
                      {ehCritico ? (
                        <div className="flex items-center justify-center bg-red-600 border border-red-300 text-white py-1.5 rounded-lg w-full font-normal shadow-md">
                          <AlertTriangle size={16} className="text-white drop-shadow-lg mr-2" />
                          <span className="text-xs font-semibold uppercase tracking-wide">CRÍTICO</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center bg-green-600 border border-green-300 text-white py-1.5 rounded-lg w-full font-normal shadow-md">
                          <CheckCircle size={18} className="text-white drop-shadow-lg mr-2" />
                          <span className="text-sm font-medium uppercase tracking-wide">TUDO NORMAL</span>
                        </div>
                      )}
                    </div>

                    <button
                      className={`w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold shadow-sm transition-all ${ehCritico
                        ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                        }`}
                      style={{ fontSize: '1rem', height: '40px' }}
                    >
                      Ver avaliação
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}