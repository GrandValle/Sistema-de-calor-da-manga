'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessoes } from '../../../../services/api';
import { locaPlanta } from '../../../../data/dados';
import {
  ArrowLeft, MapPin, Sprout, ChevronDown,
  AlertOctagon, CheckCircle2, Microscope, ScanLine
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { doencasPragas } from '../../../../data/dados';
import 'leaflet/dist/leaflet.css';

const listaPragas = doencasPragas
  .filter(d => d.tipo === "praga")
  .map(d => d.nome.toUpperCase());

// Mapa para buscar o notaMax correto de cada orgão por doença/praga
const notaMaxMap: Record<string, Record<string, number>> = {};
doencasPragas.forEach(d => {
  notaMaxMap[d.nome.toUpperCase()] = {};
  d.orgaos.forEach(o => {
    notaMaxMap[d.nome.toUpperCase()][o.nome.toUpperCase()] = o.notaMax;
  });
});

const MapaCalor = dynamic(() => import('@/src/app/components/MapaCalor'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900/50 animate-pulse flex items-center justify-center text-emerald-400 font-mono">INICIALIZANDO SATÉLITE...</div>
});

const SeverityBar = ({ percent }: { percent: number }) => {
  const isCritical = percent > 5;
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full transition-all duration-500 ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
};

const PragaCardTech = ({ relatorio, notasDetalhadas }: { relatorio: any, notasDetalhadas: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCritico = relatorio.porcentagem > 5;

  return (
    <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${isOpen ? 'bg-white shadow-xl ring-1 ring-emerald-500/20' : 'bg-white/60 hover:bg-white shadow-sm border-gray-200'}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritico ? 'bg-red-500' : 'bg-emerald-500'}`} />

      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 pl-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${isCritico ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isCritico ? <AlertOctagon size={22} /> : <Microscope size={22} />}
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-800 text-lg leading-tight">{relatorio.doencaOuPraga}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
              {relatorio.orgao}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-24 text-right">
            <div className="flex items-end justify-end gap-1">
              <span className={`text-2xl font-black ${isCritico ? 'text-red-600' : 'text-slate-700'}`}>
                {Math.min(relatorio.porcentagem, 100).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 mb-1">%</span>
            </div>
            <SeverityBar percent={relatorio.porcentagem} />
          </div>
          <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100' : ''}`}>
            <ChevronDown size={20} className="text-slate-400" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-6 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notasDetalhadas.length > 0 ? notasDetalhadas.map((nota, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${nota.identificadorDeLocal === 'Bordadura' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <span className="text-xs font-bold text-slate-600 uppercase">{nota.identificadorDeLocal || nota.local || nota.identificadorLocal || 'Geral'}</span>
                  </div>
                  <div className="flex gap-2 font-mono text-[10px]">
                    {nota.quadrante && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">Q:{nota.quadrante}</span>}
                    {nota.ramo && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">R:{nota.ramo}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Nota</span>
                  <span className={`text-lg font-black ${nota.nota >= 3 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {nota.nota}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 italic col-span-2">Sem notas individuais registradas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const centroCusto = decodeURIComponent(params.centroCusto as string);
  const dataFiltro = params.data as string;

  const [sessoes, setSessoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 AQUI COMEÇA A MÁGICA ATUALIZADA DO SITE
  const calcularPorcentagemManual = (sessao: any, nomeItem: string, orgaoAlvo: string) => {
    const notasDoItem = sessao.avaliacoes?.filter((av: any) =>
      (av.doencaOuPraga || av.doenca) === nomeItem &&
      av.orgao === orgaoAlvo
    ) || [];

    if (notasDoItem.length === 0) return 0;

    const nomeCheck = nomeItem.toUpperCase();
    const isPraga = listaPragas.some(p => nomeCheck.includes(p));

    // 🕵️‍♀️ DETETIVE DE LOTE: Descobre o tamanho real do lote no site
    let qtdePlantasReal = 10; // Padrão
    const numeroNoNome = Number(sessao.lote?.toString().replace(/\D/g, ""));
    const maxPlantaAvaliadas = Math.max(...(sessao.avaliacoes?.map((a: any) => Number(a.planta) || 0) || [0]));

    if (numeroNoNome === 14 || numeroNoNome === 18) {
      qtdePlantasReal = numeroNoNome;
    } else if (maxPlantaAvaliadas > 14) {
      qtdePlantasReal = 18;
    } else if (maxPlantaAvaliadas > 10) {
      qtdePlantasReal = 14;
    }

    if (isPraga) {
      // 🐛 PRAGAS: Filtro flexível para Bordadura/Área Interna
      const bNotas = notasDoItem.filter((r: any) => {
        const localStr = (r.local || "").toString().toLowerCase();
        const idLocalStr = (r.identificadorDeLocal || "").toString().toLowerCase();
        return idLocalStr.includes("bordadura") || localStr.includes("bordadura");
      });
      const aNotas = notasDoItem.filter((r: any) => {
        const localStr = (r.local || "").toString().toLowerCase();
        const idLocalStr = (r.identificadorDeLocal || "").toString().toLowerCase();
        return idLocalStr.includes("interna") || localStr.includes("interna");
      });

      const totalB = bNotas.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 0), 0);
      const totalA = aNotas.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 0), 0);

      // --- Lógica especial para cochonilha ---
      const isCochonilha = [
        "COCHONILHA",
        "COCHONILHA CARAPAÇA",
        "COCHONILHA CABEÇA DE PREGO",
        "COCHONILHA ESTRELA"
      ].includes(nomeCheck);

      const isFolhaCochonilha = orgaoAlvo.toUpperCase().includes("FOLHA");

      let mult = 4;
      let notaMaxOrgao = notaMaxMap[nomeCheck]?.[orgaoAlvo.toUpperCase()] ?? 1;
      if (isCochonilha) {
        if (orgaoAlvo.toUpperCase().includes("FRUTO") || orgaoAlvo.toUpperCase().includes("CACHO")) {
          mult = 4;
          notaMaxOrgao = 1;
        } else if (isFolhaCochonilha) {
          // Regra especial para folha em todas as cochonilhas
          mult = 8;
          notaMaxOrgao = 1;
        } else if (orgaoAlvo.toUpperCase().includes("RAMO")) {
          mult = 4;
          notaMaxOrgao = 2;
        } else {
          mult = 4;
          notaMaxOrgao = 1;
        }
      } else {
        mult = notasDoItem.some((r: any) => !!r.ramo) ? 8 : 4;
        notaMaxOrgao = notaMaxMap[nomeCheck]?.[orgaoAlvo.toUpperCase()] ?? 1;
      }

      let maxB = 4, maxA = 6;
      if (qtdePlantasReal === 14) { maxB = 5; maxA = 9; }
      else if (qtdePlantasReal === 18) { maxB = 6; maxA = 12; }

      const divisorB = maxB * mult * notaMaxOrgao;
      const divisorA = maxA * mult * notaMaxOrgao;

      const pctB = divisorB > 0 ? (totalB * 100) / divisorB : 0;
      const pctA = divisorA > 0 ? (totalA * 100) / divisorA : 0;

      return (pctB + pctA) / 2;
    } else {
      // 🦠 DOENÇAS: Baseada na incidência real (Papel da Embrapa) COM a Nota Máxima!
      const total = notasDoItem.reduce((acc: number, curr: any) => acc + (Number(curr.nota) || 0), 0);
      const orgaoLimpo = orgaoAlvo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // --- Lógica especial para morte descendente ---
      let mult = orgaoLimpo.includes("folha") || orgaoLimpo.includes("ramo") ? 8 : 4;
      let notaMaxDoenca = notaMaxMap[nomeCheck]?.[orgaoAlvo.toUpperCase()] ?? 5;
      if (nomeCheck.includes("MORTE")) {
        notaMaxDoenca = 1;
      }
      const divisorDoenca = mult * qtdePlantasReal * notaMaxDoenca;
      return divisorDoenca > 0 ? (total * 100) / divisorDoenca : 0;
    }
  };
  // 🏁 FIM DA MÁGICA

  const carregarDados = async () => {
    try {
      const todos = await getSessoes();
      const filtrados = todos.filter((d: any) => {
        const dia = d.criadoEm ? d.criadoEm.substring(0, 10) : '';
        return d.centroCusto === centroCusto && dia === dataFiltro;
      });

      const dadosTratados = filtrados.map((sessao: any) => {
        const gpsRef = sessao.avaliacoes?.find((av: any) => av.latitude && av.longitude);

        const chavesUnicas = new Map<string, { doencaOuPraga: string; orgao: string }>();
        (sessao.avaliacoes || []).forEach((av: any) => {
          const nome = av.doencaOuPraga || av.doenca;
          if (!nome || !av.orgao) return;
          const chave = `${nome}|||${av.orgao}`;
          if (!chavesUnicas.has(chave)) chavesUnicas.set(chave, { doencaOuPraga: nome, orgao: av.orgao });
        });

        const relatoriosTratados = Array.from(chavesUnicas.values()).map(({ doencaOuPraga, orgao }) => {
          const pctCalculado = calcularPorcentagemManual(sessao, doencaOuPraga, orgao);
          return { doencaOuPraga, orgao, porcentagem: Math.min(pctCalculado, 100) };
        });

        return {
          ...sessao,
          relatorios: relatoriosTratados,
          latitude: gpsRef?.latitude || null,
          longitude: gpsRef?.longitude || null
        };
      });

      setSessoes(dadosTratados);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  const infoLocal = locaPlanta.find((l: any) => l.centroCusto === centroCusto);
  const nomeLocal = infoLocal ? infoLocal.name : centroCusto;

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-slate-800">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">{nomeLocal}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
              <ScanLine size={12} /> LOTE MONITORADO
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data:</span>
          <span className="text-sm font-bold text-slate-800">
            {dataFiltro ? format(parseISO(dataFiltro), "dd MMM yyyy", { locale: ptBR }).toUpperCase() : '--'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest">Carregando dados...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-white rounded-2xl p-1 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                  <MapPin size={12} className="text-emerald-500" /> SATÉLITE
                </div>
                <div className="h-96 w-full rounded-xl overflow-hidden bg-slate-900">
                  <MapaCalor dados={sessoes} />
                </div>
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
                  <div className="bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Plantas</p>
                    <p className="text-xl font-black text-slate-800">{sessoes.length}</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas</p>
                    <p className="text-xl font-black text-red-500">
                      {sessoes.filter(s => s.relatorios?.some((r: any) => r.porcentagem > 5)).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {sessoes.map((sessao) => (
                <div key={sessao.id} className="relative pl-0 md:pl-8 transition-all duration-300 mb-3">
                  <div className="hidden md:block absolute left-3 top-0 bottom-0 w-px bg-slate-200"></div>
                  <div className="hidden md:flex absolute left-0 top-6 w-7 h-7 bg-white border-4 border-emerald-100 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
                    <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-200 flex items-center justify-center text-white font-black text-xl">
                          {sessao.planta}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Planta {sessao.planta}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-500 uppercase">
                              LOTE {sessao.lote}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">{sessao.nomeAvaliador}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex -space-x-2">
                        {sessao.relatorios?.slice(0, 3).map((r: any, i: number) => (
                          <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${r.porcentagem > 5 ? 'bg-red-500' : 'bg-emerald-400'}`}>
                            {r.doencaOuPraga.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 space-y-2 mt-2">
                      {sessao.relatorios?.map((rel: any, idx: number) => {
                        const notasDestaPraga = sessao.avaliacoes?.filter((av: any) =>
                          (av.doencaOuPraga || av.doenca) === rel.doencaOuPraga &&
                          av.orgao === rel.orgao
                        ) || [];
                        return <PragaCardTech key={idx} relatorio={rel} notasDetalhadas={notasDestaPraga} />;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}