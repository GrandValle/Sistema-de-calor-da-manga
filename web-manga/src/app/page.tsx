'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, ArrowRight, Filter, Plus, Home, Calendar,
  Search, BarChart3, CheckCircle2, Clock
} from 'lucide-react';
import { getSessoes } from '../services/api';
import { LISTA_FAZENDAS, locaPlanta } from '../data/dados';
import { CriticalAlerts } from './components/CriticalAlerts';


interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador?: string;
  criadoEm: string;
  relatorios: any[];
  [key: string]: any;
}

interface LocalProcessado {
  id: number;
  name: string;
  centroCusto: string;
  qtdAvaliacoes: number;
  ultimaData: string | null;
  status: 'recente' | 'antigo' | 'sem_dados';
}


const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-44">
        <div className="flex justify-between mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function HomePage() {
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);


  const [filtroTexto, setFiltroTexto] = useState("");
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");


  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const data = await getSessoes();
        console.log('fetchDados - getSessoes retornou:', data);
        setSessoes(data);
      } catch (error) {
        console.error("Erro ao buscar sessões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);



  const locaisProcessados = useMemo(() => {

    const sessoesFiltradas = sessoes.filter(s => {
      const dataSessao = s.criadoEm.split("T")[0];
      if (dataInicio && dataSessao < dataInicio) return false;
      if (dataFim && dataSessao > dataFim) return false;
      return true;
    });


    const locais = locaPlanta.map(local => {
      const avaliacoesDoLocal = sessoesFiltradas.filter(
        d => d.centroCusto === local.centroCusto
      );


      const avaliacoesOrdenadas = [...avaliacoesDoLocal].sort(
        (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

      const ultimaData = avaliacoesOrdenadas[0]?.criadoEm || null;


      let status: LocalProcessado['status'] = 'sem_dados';
      if (ultimaData) {
        const diasDesdeUltima = (new Date().getTime() - new Date(ultimaData).getTime()) / (1000 * 3600 * 24);
        status = diasDesdeUltima <= 7 ? 'recente' : 'antigo';
      }

      return {
        ...local,
        qtdAvaliacoes: avaliacoesDoLocal.length,
        ultimaData,
        status,
        temDados: avaliacoesDoLocal.length > 0
      };
    });


    return locais
      .filter(l => l.temDados)
      .filter(l => {
        if (fazendaSelecionada && !l.name.includes(fazendaSelecionada)) return false;
        if (filtroTexto) {
          const termo = filtroTexto.toLowerCase();
          return l.name.toLowerCase().includes(termo) || l.centroCusto.includes(termo);
        }
        return true;
      })
      .sort((a, b) => {
        const dataA = a.ultimaData ? new Date(a.ultimaData).getTime() : 0;
        const dataB = b.ultimaData ? new Date(b.ultimaData).getTime() : 0;
        return dataB - dataA;
      });

  }, [sessoes, dataInicio, dataFim, filtroTexto, fazendaSelecionada]);


  const stats = useMemo(() => {
    const totalAvaliacoes = locaisProcessados.reduce((acc, curr) => acc + curr.qtdAvaliacoes, 0);
    const locaisAtivos = locaisProcessados.length;
    return { totalAvaliacoes, locaisAtivos };
  }, [locaisProcessados]);

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Principal */}
        <div className="bg-linear-to-r from-[#2e7d4b] to-[#60b36b] rounded-2xl shadow-xl flex items-center justify-between px-8 py-8 mb-8">
          {/* Logo */}
          <div className="shrink-0">
            <img src="/logo.png" alt="Grand Valle" className="w-20 h-20 rounded-2xl bg-white p-3 shadow-lg border border-white" />
          </div>
          {/* Título e subtítulo */}
          <div className="flex flex-col justify-center items-start flex-1 px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">Monitoramento Agrícola</h1>
            <p className="text-white/90 text-base md:text-lg font-medium">Visão consolidada das áreas e indicadores de qualidade.</p>
          </div>
          {/* Botão Novo Registro */}
          <div className="shrink-0">
            <button
              onClick={() => router.push("/registrar")}
              className="group bg-[#c6e43a] hover:bg-[#b3d62e] text-green-900 px-3 py-2 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base transition-all shadow-xl hover:shadow-[#c6e43a]/30 active:scale-95 border border-[#b3d62e] focus:outline-none focus:ring-2 focus:ring-[#c6e43a]/40"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform text-green-900" />
              Novo Registro
            </button>
          </div>
        </div>

        {/* Alertas Críticos (Componente Existente) */}
        <CriticalAlerts
          dados={sessoes}
          dataInicio={dataInicio}
          dataFim={dataFim}
        />

        {/* Barra de Filtros e Estatísticas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          {/* Linha de Resumo e Filtros */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><MapPin size={24} /></div>
                <div>
                  <p className="text-xs text-gray-700 font-semibold uppercase">Locais Filtrados</p>
                  <p className="text-2xl font-bold text-green-900">{stats.locaisAtivos}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><BarChart3 size={24} /></div>
                <div>
                  <p className="text-xs text-gray-700 font-semibold uppercase">Total Avaliações</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalAvaliacoes}</p>
                </div>
              </div>
            </div>
            {/* Logotipo Grand Valle */}
          </div>
          <hr className="my-4 border-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca Texto */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700" size={18} />
              <input
                type="text"
                placeholder="Buscar Talhão, Lote ou CC..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-700 bg-gray-100 text-emerald-900 placeholder:text-emerald-700 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200/40 outline-none transition-all text-sm"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>
            {/* Select Fazenda */}
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700" size={18} />
              <select
                value={fazendaSelecionada}
                onChange={(e) => setFazendaSelecionada(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-700 bg-gray-100 text-emerald-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200/40 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Todas as Fazendas</option>
                {LISTA_FAZENDAS.map((f) => (
                  <option key={f.valor} value={f.valor}>{f.label}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none" size={14} />
            </div>
            {/* Data Início */}
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 text-xs font-bold">DE:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-700 bg-gray-50 text-emerald-900 focus:border-emerald-700 outline-none text-sm"
              />
            </div>
            {/* Data Fim */}
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 text-xs font-bold">ATÉ:</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-700 bg-gray-100 text-emerald-900 focus:border-emerald-700 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Grid de Resultados */}
        {loading ? (
          <LoadingSkeleton />
        ) : locaisProcessados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros de data ou busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {locaisProcessados.map((local) => (
              <div
                key={local.id}
                onClick={() => router.push(`/local/${encodeURIComponent(local.centroCusto)}`)}
                className="group bg-white rounded-2xl border border-gray-100 p-0 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100/60 overflow-hidden"
                title={`Ver detalhes de ${local.name}`}
              >
                {/* Header do Card */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-green-50 text-green-700 text-xs font-mono font-semibold px-2 py-1 rounded-md border border-green-100 flex items-center gap-2">
                      <MapPin size={16} className="text-green-700" />
                      CC: {local.centroCusto}
                    </span>
                    {local.status === 'recente' ? (
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white bg-linear-to-r from-green-500 to-green-700 px-2 py-1 rounded-full border border-green-200 shadow-md animate-pulse">
                        <CheckCircle2 size={16} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200 shadow-sm">
                        <Clock size={16} /> Antigo
                      </span>
                    )}
                  </div>
                  <h3 className="text-green-900 font-extrabold text-2xl leading-tight line-clamp-2 group-hover:text-green-700 transition-colors flex items-center gap-2">
                    <BarChart3 size={20} className="text-green-700" />
                    <span className="text-lg md:text-xl font-bold">{local.name}</span>
                  </h3>
                </div>

                {/* Footer do Card */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 font-semibold">Última avaliação</span>
                    <span className="text-base font-bold text-green-800 flex items-center gap-1.5">
                      <Calendar size={18} className="text-green-600" />
                      {local.ultimaData ? new Date(local.ultimaData).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-r from-green-200 to-green-400 border border-green-300 shadow-lg text-green-700 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all" title="Acessar detalhes">
                    <ArrowRight size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}