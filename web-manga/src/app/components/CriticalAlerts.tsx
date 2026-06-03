'use client';

import { useMemo, useCallback } from 'react';
import { locaPlanta } from '@/src/data/dados';
import {
  AlertTriangle, Calendar, CheckCircle, FileDown,
  Hash, MapPin, Sprout, User
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { id } from 'date-fns/locale';

// --- Interfaces ---
interface Relatorio {
  porcentagem: number;
  doencaOuPraga: string;
  [key: string]: any;
}

interface Sessao {
  id: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador?: string;
  criadoEm: string;
  relatorios: Relatorio[];
}

interface CriticalAlertsProps {
  dados: Sessao[];
  dataInicio?: string;
  dataFim?: string;
}

interface AlertaProcessado extends Relatorio {
  nomeLocal: string;
  lote: string;
  planta: number;
  centroCusto: string;
  nomeAvaliador: string;
  data: string;
}

export function CriticalAlerts({ dados, dataInicio, dataFim }: CriticalAlertsProps) {

  // 1. Otimização com useMemo para evitar recálculos desnecessários
  const alertas = useMemo(() => {
    // 🚀 REGRA DO DASHBOARD: Calcula a data exata de 7 dias atrás
    const dataAtual = new Date();
    dataAtual.setDate(dataAtual.getDate() - 7);

    // Formata para YYYY-MM-DD de forma segura (sem bugar fuso horário)
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const limiteSemana = `${ano}-${mes}-${dia}`;

    return dados
      .flatMap(sessao => {
        const localEncontrado = locaPlanta.find(l => l.centroCusto === sessao.centroCusto);
        const nomeCompleto = localEncontrado ? localEncontrado.name : `CC: ${sessao.centroCusto}`;

        return (sessao.relatorios || [])
          .filter((rel) => rel.porcentagem > 5)
          .map((rel) => ({
            ...rel,
            porcentagem: Math.min(rel.porcentagem, 100), // <--- A TRAVA ENTRA AQUI!
            nomeLocal: nomeCompleto,
            lote: sessao.lote,
            planta: sessao.planta,
            centroCusto: sessao.centroCusto,
            nomeAvaliador: sessao.nomeAvaliador || 'N/A',
            data: sessao.criadoEm
          }));
      })
      .filter((alerta) => {
        const dataAlerta = alerta.data.split('T')[0];

        // 1. A BARREIRA: Bloqueia qualquer alerta mais velho que 7 dias
        if (dataAlerta < limiteSemana) return false;

        // 2. Filtros extras de data (se vierem pelas props do componente)
        if (dataInicio && dataAlerta < dataInicio) return false;
        if (dataFim && dataAlerta > dataFim) return false;

        return true;
      })
      .sort((a, b) => b.porcentagem - a.porcentagem); // Ordenar do maior para o menor risco
  }, [dados, dataInicio, dataFim]);

  // 2. Geração de PDF Otimizada
  const gerarPDF = useCallback(() => {
    const doc = new jsPDF();

    // Título
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.setFontSize(18);
    doc.text("Relatório de Alertas Críticos (Últimos 7 dias)", 14, 15);

    // Subtítulo
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);
    doc.text(`Critério: Infestação acima de 5% recente`, 14, 27);

    const dadosTabela = alertas.map(a => [
      new Date(a.data).toLocaleDateString('pt-BR'),
      a.nomeLocal,
      `Lote ${a.lote} / P${a.planta}`,
      a.doencaOuPraga,
      `${a.porcentagem.toFixed(2)}%`,
      a.nomeAvaliador
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Local', 'Ref.', 'Problema', 'Nível', 'Avaliador']],
      body: dadosTabela,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [254, 242, 242] }, // Vermelho bem claro alternado
    });

    doc.save(`alertas_criticos_semanal_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [alertas]);

  if (dados.length === 0) return null;

  return (
    <section className="bg-linear-to-r from-red-50 to-white border border-red-100 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm relative overflow-hidden">
      {/* Barra lateral decorativa */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>

      {/* Cabeçalho do Componente */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-xl shadow-inner">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Alertas Críticos
            </h2>
            <p className="text-sm text-gray-600">
              Ocorrências acima de 5% nos <strong>últimos 7 dias</strong>
            </p>
          </div>
        </div>

        {alertas.length > 0 && (
          <button
            onClick={gerarPDF}
            className="w-full sm:w-auto bg-white border border-red-600 text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <FileDown size={18} />
            <span>Exportar PDF</span>
          </button>
        )}
      </div>

      {/* Conteúdo */}
      {alertas.length === 0 ? (
        <div className="bg-white/80 rounded-xl border border-dashed border-green-200 p-8 text-center backdrop-blur-sm">
          <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CheckCircle className="text-green-600" size={28} />
          </div>
          <h3 className="text-green-800 font-bold text-lg">Tudo sob controle</h3>
          <p className="text-green-700/80 text-sm mt-1">
            Nenhuma infestação crítica detectada nos últimos 7 dias.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Contador de Risco */}
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alertas.length}
            </span>
            <span className="text-sm font-medium text-red-900">
              Ocorrências de alto risco encontradas na semana
            </span>
          </div>

          {/* Lista Horizontal (Scrollável) */}
          <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {alertas.map((alerta, idx) => (
                <div
                  key={`${alerta.data}-${alerta.lote}-${alerta.planta}-${idx}`}
                  className="min-w-70 sm:min-w-75 bg-white rounded-xl border border-red-100 p-0 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Topo do Card: Porcentagem e Doença */}
                  <div className="p-4 bg-linear-to-br from-red-500 to-red-600 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 backdrop-blur-md">
                          {alerta.doencaOuPraga}
                        </span>
                        <div className="text-3xl font-extrabold tracking-tight">
                          {alerta.porcentagem.toFixed(1)}<span className="text-lg opacity-80">%</span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-1.5 rounded-lg">
                        <Sprout size={20} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Corpo do Card: Detalhes */}
                  <div className="p-4 space-y-3 flex-1 bg-white">

                    {/* Localização */}
                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate" title={alerta.nomeLocal}>
                          {alerta.nomeLocal}
                        </p>
                        <p className="text-xs text-gray-500">CC: {alerta.centroCusto}</p>
                      </div>
                    </div>

                    {/* Identificação Planta/Lote */}
                    <div className="flex items-center gap-3">
                      <Hash className="text-gray-400 shrink-0" size={16} />
                      <div className="text-xs text-gray-700">
                        Lote <span className="font-semibold text-gray-900">{alerta.lote}</span> • Planta <span className="font-semibold text-gray-900">{alerta.planta}</span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full my-2"></div>

                    {/* Rodapé do Card: Data e Avaliador */}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-1.5" title={alerta.nomeAvaliador}>
                        <User size={14} />
                        <span className="truncate max-w-20">{alerta.nomeAvaliador.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{new Date(alerta.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}