'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { DoencaPraga, doencasPragas, LISTA_FAZENDAS, LocalPlantaItem, locaPlanta } from '@/src/data/dados';
import { enviarPacote } from '@/src/services/api';

export default function RegistrarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [locaisFiltrados, setLocaisFiltrados] = useState<LocalPlantaItem[]>([]);

  const [formData, setFormData] = useState({
    lote: '',
    planta: '',
    centroCusto: '',
    nomeAvaliador: ''
  });

  const [itemSelecionado, setItemSelecionado] = useState<DoencaPraga | null>(null);
  const [localPraga, setLocalPraga] = useState<string>("Área interna da parcela");
  const [notasTemporarias, setNotasTemporarias] = useState<Record<string, number>>({});
  const [listaAvaliacoes, setListaAvaliacoes] = useState<any[]>([]);

  useEffect(() => {
    if (!fazendaSelecionada) {
      setLocaisFiltrados([]);
      return;
    }
    const filtrados = locaPlanta.filter(item => item.name.includes(fazendaSelecionada));
    setLocaisFiltrados(filtrados);
    setFormData(prev => ({ ...prev, lote: '', centroCusto: '' }));
  }, [fazendaSelecionada]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nomeLocal = e.target.value;
    const localEncontrado = locaPlanta.find(l => l.name === nomeLocal);
    setFormData({
      ...formData,
      lote: nomeLocal,
      centroCusto: localEncontrado ? localEncontrado.centroCusto : ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nome = e.target.value;
    const item = doencasPragas.find(d => d.nome === nome) || null;
    setItemSelecionado(item);
    setNotasTemporarias({});
  };

  const handleNotaChange = (orgaoNome: string, valor: string, max: number) => {
    let nota = parseFloat(valor);
    if (isNaN(nota)) nota = 0;
    if (nota < 0) nota = 0;
    if (nota > max && max > 0) nota = max;
    setNotasTemporarias(prev => ({ ...prev, [orgaoNome]: nota }));
  };

  const adicionarAvaliacao = () => {
    if (!itemSelecionado) return;

    const novas = Object.entries(notasTemporarias).map(([orgaoNome, notaValor]) => {
      if (notaValor > 0 || itemSelecionado.nome === "INIMIGOS NATURAIS") {
        return {
          doencaOuPraga: itemSelecionado.nome,
          orgao: orgaoNome,
          nota: notaValor,
          identificadorDeLocal: itemSelecionado.tipo === 'praga' ? localPraga : null,
          quadrante: "Web",
          ramo: null,
          numeroLocal: null
        };
      }
      return null;
    }).filter(Boolean);

    if (novas.length > 0) {
      setListaAvaliacoes([...listaAvaliacoes, ...novas]);
      setNotasTemporarias({});
      setItemSelecionado(null);
    }
  };

  const removerAvaliacao = (index: number) => {
    const novaLista = [...listaAvaliacoes];
    novaLista.splice(index, 1);
    setListaAvaliacoes(novaLista);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Monitorar pacote enviado
    // Remover dados sensíveis se necessário
    const pacoteDebug = {
      header: {
        idUnico: `WEB-${formData.lote.replace(/\s/g, '')}-${formData.planta}-${Date.now()}`,
        lote: formData.lote,
        planta: Number(formData.planta),
        centroCusto: formData.centroCusto || 'N/A',
        nomeAvaliador: formData.nomeAvaliador || 'Admin Web',
        criadoEm: new Date().toISOString()
      },
      avaliacoes: listaAvaliacoes,
      relatorios: []
    };
    console.log('handleSubmit - pacote a ser enviado:', pacoteDebug);

    try {
      const pacote = {
        header: {
          idUnico: `WEB-${formData.lote.replace(/\s/g, '')}-${formData.planta}-${Date.now()}`,
          lote: formData.lote,
          planta: Number(formData.planta),
          centroCusto: formData.centroCusto || 'N/A',
          nomeAvaliador: formData.nomeAvaliador || 'Admin Web',
          criadoEm: new Date().toISOString()
        },
        avaliacoes: listaAvaliacoes,
        relatorios: []
      };

      await enviarPacote(pacote);
      alert('Registro salvo com sucesso!');
      router.push('/');
    } catch (error) {
      alert('Erro ao salvar.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-emerald-50 flex justify-center">
      <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)]">

        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <button onClick={() => router.back()} className="text-gray-800 hover:text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-semibold  text-green-800 tracking-tight leading-tight">Novo Registro Web</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fazenda</label>
              <select
                value={fazendaSelecionada}
                onChange={(e) => setFazendaSelecionada(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition duration-200 ${fazendaSelecionada ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"}`}
              >
                <option value="">Selecione...</option>
                {LISTA_FAZENDAS.map((fazenda) => (
                  <option key={fazenda.valor} value={fazenda.valor}>{fazenda.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local / Talhão</label>
              <select
                value={formData.lote}
                onChange={handleLocalChange}
                disabled={!fazendaSelecionada}
                className={`w-full border rounded-lg p-2 text-gray-800 outline-none focus:outline-none focus:border-green-500 transition duration-150 ${formData.lote ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}

              >
                <option value="">Selecione...</option>
                {locaisFiltrados.map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planta (Nº)</label>
              <input
                name="planta"
                type="number"
                value={formData.planta}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2 text-gray-800 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition duration-200 ${formData.planta ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
              <input
                value={formData.centroCusto}
                readOnly
                className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-600 cursor-not-allowed"

              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avaliador</label>
              <input
                name="nomeAvaliador"
                value={formData.nomeAvaliador}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2 text-gray-800 focus:outline-none focus:border-green-600 transition duration-200 ${formData.nomeAvaliador ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"}`}

              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 mt-4">
            <h2 className="text-xl font-semibold text-gray-800 tracking-tight mb-4">Adicionar Avaliação</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doença ou Praga</label>
                <select
                  value={itemSelecionado?.nome || ''}
                  onChange={handleItemChange}
                  className={`w-full border rounded-lg p-2 text-gray-800 focus:outline-none focus:border-green-600 transition duration-200 ${itemSelecionado ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"}`}

                >
                  <option value="">Selecione o item...</option>
                  {doencasPragas.map(d => (
                    <option key={d.nome} value={d.nome}>{d.nome}</option>
                  ))}
                </select>
              </div>

              {itemSelecionado?.tipo === 'praga' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 tracking-wide mb-1">Local da Praga</label>
                  <select
                    value={localPraga}
                    onChange={(e) => setLocalPraga(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-gray-800 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition duration-200 ${localPraga ? "bg-gray-100 border-gray-400" : "bg-white border-gray-300"}`}

                  >
                    <option value="Área interna da parcela">Área interna</option>
                    <option value="Bordadura">Bordadura</option>
                  </select>
                </div>
              )}
            </div>

            {itemSelecionado && (
              <div className="bg-gray-200 p-4 rounded border border-gray-300">
                <h3 className="text-xs font-medium text-gray-600 tracking-wide mb-2">Notas por Órgão:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {itemSelecionado.orgaos.map(org => (
                    <div key={org.nome}>
                      <label className="block text-xs font-semibold text-black mb-1">
                        {org.nome} (Max: {org.notaMax})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={org.notaMax}
                        value={notasTemporarias[org.nome] || ''}
                        onChange={(e) => handleNotaChange(org.nome, e.target.value, org.notaMax)}
                        className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-800 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"

                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={adicionarAvaliacao}
                  className="mt-4 flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded hover:opacity-80 w-full"
                >
                  <Plus size={16} /> Adicionar Item
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 pt-4">
            <h3 className="font-semibold text-black mb-2">Itens Adicionados ({listaAvaliacoes.length})</h3>
            {listaAvaliacoes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum item adicionado ainda.</p>
            ) : (
              <div className="space-y-2">
                {listaAvaliacoes.map((av, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-100 p-2 rounded border border-gray-300">
                    <div className="text-sm text-black">
                      <span className="font-semibold">{av.doencaOuPraga}</span> - {av.orgao}: {av.nota}
                      {av.identificadorDeLocal && <span className="text-xs ml-2">({av.identificadorDeLocal})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removerAvaliacao(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || listaAvaliacoes.length === 0 || !formData.lote}
            className="w-full flex justify-center items-center gap-2 bg-green-700 hover:bg-green-800 text-white p-4 rounded-xl text-lg font-semibold tracking-wide shadow-md hover:shadow-lg transition duration-200 mt-6"
          >
            <Save size={24} />
            {loading ? 'Salvando...' : 'Finalizar e Salvar'}
          </button>

        </form>
      </div>
    </main>
  );
}