import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DoencaPraga, locaPlanta, Registro } from "../data/daodaAvaliacao";
import { Gps } from "../components/gps";

const getDadosDoLote = async (loteAlvo: string): Promise<Registro[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysPacotes = allKeys.filter((key) => key.startsWith("@pacote_"));
    let todasAvaliacoes: Registro[] = [];

    for (const key of keysPacotes) {
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const pacote = JSON.parse(json);
        if (String(pacote.header.lote) === String(loteAlvo)) {
          todasAvaliacoes = [...todasAvaliacoes, ...pacote.avaliacoes];
        }
      }
    }
    return todasAvaliacoes;
  } catch (error) {
    console.error("Erro ao buscar dados dos pacotes:", error);
    return [];
  }
};

export const gerarRelatorioDoLote = async (
  lote: string,
  doencasPragas: DoencaPraga[],
  nomeAvaliador: string = "Não informado",
) => {
  try {
    const avaliacoesDoLote = await getDadosDoLote(lote);

    if (!avaliacoesDoLote || avaliacoesDoLote.length === 0) {
      Alert.alert(
        "Sem dados",
        `Nenhuma avaliação encontrada para o Lote ${lote}. Lembre-se de SALVAR antes de gerar o PDF.`,
      );
      return;
    }

    await gerarPDF(avaliacoesDoLote, doencasPragas, lote, undefined, nomeAvaliador);
  } catch (e) {
    console.error("Erro ao gerar relatório:", e);
    Alert.alert("Erro", "Não foi possível gerar o relatório.");
  }
};

export async function gerarPDF(
  avaliacoes: Registro[],
  doencasPragas: DoencaPraga[],
  lote: string,
  localSelecionadoNome?: string,
  nomeAvaliador?: string,
) {
  if (avaliacoes.length === 0) return;

  const now = new Date();
  const dataBrasilia = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const plantasAvaliadas = [...new Set(avaliacoes.map((a) => a.planta))].sort((a, b) => a - b);
  const qtdePlantas = Number(lote) || 10;

  // --- 1. RESUMO GERAL (COM PORCENTAGENS PARA TUDO) ---
  const resumoDoencasLote = doencasPragas.map((item) => {
    const avalsItem = avaliacoes.filter((a) => a.doencaOuPraga === item.nome);
    if (avalsItem.length === 0) return "";

    if (item.tipo === "doenca") {
      // DOENÇAS: Listar cada órgão que tiver infestação
      return item.orgaos.map(o => {
        const registrosOrgao = avalsItem.filter(r => r.orgao === o.nome);
        const soma = registrosOrgao.reduce((s, a) => s + (Number(a.nota) || 0), 0);

        // 🚀 CORREÇÃO 1: Inclui o Ramo e adiciona a Nota Máxima (Padrão 5)
        const mult = o.nome.toUpperCase().includes("FOLHA") || o.nome.toUpperCase().includes("RAMO") ? 8 : 4;
        const notaMaxOrgao = o.notaMax || 5;

        const divisor = mult * qtdePlantas * notaMaxOrgao; // Agora o divisor é 400, não 80!
        const pct = divisor > 0 ? (soma * 100) / divisor : 0;

        if (pct <= 0) return "";
        const style = pct >= 5 ? "color:#ef4444;font-weight:bold" : "";
        return `<li style="${style}">${item.nome} (${o.nome}): ${pct.toFixed(2)}%</li>`;
      }).join("");
    } else {
      // PRAGAS: Cálculo completo para o resumo
      const porcentagensDosOrgaos: number[] = [];
      let maxB = 4, maxA = 6;
      if (qtdePlantas === 14) { maxB = 5; maxA = 9; }
      else if (qtdePlantas === 18) { maxB = 6; maxA = 12; }

      item.orgaos.forEach((orgao) => {
        const registrosDoOrgao = avalsItem.filter((r) => r.orgao === orgao.nome);
        if (registrosDoOrgao.length === 0) return;

        const notaMaxOrgao = orgao.notaMax || 1;
        const temRamo = registrosDoOrgao.some(r => !!r.ramo);
        const mult = temRamo ? 8 : 4;

        let totalB = 0, totalA = 0;
        registrosDoOrgao.forEach(r => {
          if (r.identificadorDeLocal === "Bordadura") totalB += (Number(r.nota) || 0);
          else totalA += (Number(r.nota) || 0);
        });

        const dB = maxB * mult * notaMaxOrgao;
        const dA = maxA * mult * notaMaxOrgao;
        const pB = dB > 0 ? (totalB * 100) / dB : 0;
        const pA = dA > 0 ? (totalA * 100) / dA : 0;
        porcentagensDosOrgaos.push((pB + pA) / 2);
      });

      if (porcentagensDosOrgaos.length > 0) {
        const pctFinal = porcentagensDosOrgaos.reduce((s, p) => s + p, 0) / porcentagensDosOrgaos.length;
        const style = pctFinal >= 5 ? "color:#ef4444;font-weight:bold" : "";
        return `<li style="${style}">${item.nome}: ${pctFinal.toFixed(2)}%</li>`;
      }
      return "";
    }
  }).filter(Boolean).join("");

  // --- 2. HTML ---
  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; margin: 20px; color: #333; }
        header { text-align: center; margin-bottom: 20px; }
        header img { width: 150px; }
        h1 { text-align: center; color: #047857; font-size: 20px; }
        h2 { background-color: #f3f4f6; padding: 8px; border-left: 5px solid #10b981; border-radius: 4px; font-size: 16px; margin-top: 25px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: center; }
        th { background-color: #059669; color: white; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; }
        ul { padding-left: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <header><img src="https://grandvalle.com.br/wp-content/uploads/2023/12/GrandValle-1.png" /></header>
      <h1>Relatório QTDA - Lote ${lote}</h1>
      <p style="text-align:center; font-size: 11px;">Avaliador: ${nomeAvaliador} | Data: ${dataBrasilia}</p>
      
      <h2>📊 Resumo Geral</h2>
      <p style="font-size: 12px;">Plantas Avaliadas: <strong>${plantasAvaliadas.length}</strong></p>
      ${resumoDoencasLote ? `<h3>⚠️ Ocorrências Identificadas:</h3><ul>${resumoDoencasLote}</ul>` : "<p>✅ Nenhuma praga ou doença detectada.</p>"}
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  `;

  for (const planta of plantasAvaliadas) {
    const avalsPlanta = avaliacoes.filter((r) => r.planta === planta);
    const centrosCusto = [...new Set(avalsPlanta.map(a => a.centroCusto))];

    for (const cc of centrosCusto) {
      const avalsCC = avalsPlanta.filter(a => a.centroCusto === cc);
      const local = locaPlanta.find(l => l.centroCusto === cc)?.name || `Planta ${planta}`;
      html += `<h3>📍 ${local} (CC: ${cc})</h3>`;

      const itens = [...new Set(avalsCC.map(a => a.doencaOuPraga))];
      for (const nomeItem of itens) {
        const item = doencasPragas.find(d => d.nome === nomeItem);
        if (!item) continue;
        html += `<div style="margin-bottom: 15px;"><strong>${item.nome}</strong><table>
          <thead><tr><th>Órgão</th><th>Local</th><th>Notas</th><th>Total</th><th>%</th></tr></thead><tbody>`;

        for (const o of item.orgaos) {
          const regs = avalsCC.filter(r => r.orgao === o.nome && r.doencaOuPraga === nomeItem);
          if (regs.length === 0) continue;
          const notaMaxO = o.notaMax || 1;

          if (item.tipo === "doenca") {
            const soma = regs.reduce((s, r) => s + (Number(r.nota) || 0), 0);

            // 🚀 CORREÇÃO 2: Tabela detalhada agora também multiplica pela Nota Máxima (padrão 5)
            const mult = o.nome.toUpperCase().includes("FOLHA") || o.nome.toUpperCase().includes("RAMO") ? 8 : 4;
            const notaMaxDoenca = o.notaMax || 5;
            const pct = (soma * 100) / (mult * qtdePlantas * notaMaxDoenca);

            const localTexto = regs.map(r => r.quadrante || 'Geral').join(", ");

            html += `<tr><td>${o.nome}</td><td>${localTexto}</td><td>${regs.map(r => r.nota).join(", ")}</td><td>${soma}</td><td>${pct.toFixed(2)}%</td></tr>`;
          } else {
            ["Bordadura", "Área interna da parcela"].forEach(tipo => {
              const rLocal = regs.filter(r => r.identificadorDeLocal === tipo);
              if (rLocal.length > 0) {
                const soma = rLocal.reduce((s, r) => s + (Number(r.nota) || 0), 0);
                let max = tipo === "Bordadura" ? 4 : 6;
                if (qtdePlantas === 14) {
                  max = tipo === "Bordadura" ? 5 : 9;
                } else if (qtdePlantas === 18) {
                  max = tipo === "Bordadura" ? 6 : 12;
                }
                const mult = rLocal.some(r => !!r.ramo) ? 8 : 4;
                const pct = (soma * 100) / (max * mult * notaMaxO);
                html += `<tr><td>${o.nome} (${tipo})</td><td>${rLocal.map(r => r.quadrante).join(", ")}</td><td>${rLocal.map(r => r.nota).join(", ")}</td><td>${soma}</td><td>${pct.toFixed(2)}%</td></tr>`;
              }
            });
          }
        }
        html += `</tbody></table></div>`;
      }
    }
  }

  let gpsHtml = "<p>Sem dados de GPS.</p>";
  try {
    const coords = await Gps();
    if (coords) {
      gpsHtml = `<p style="font-size: 10px; background: #f9fafb; padding: 10px; border: 1px dashed #ccc;">
          <strong>📍 Localização da Geração:</strong> Lat: ${coords.latitude} | Long: ${coords.longitude} | Alt: ${coords.altitude?.toFixed(2)}m
        </p>`;
    }
  } catch (err) { }

  html += `<div style="margin-top: 30px;">${gpsHtml}</div><div class="footer">GrandValle - v2.0</div></body></html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const newPath = FileSystem.documentDirectory + `Relatorio_Lote${lote}.pdf`;
    await FileSystem.moveAsync({ from: uri, to: newPath });
    await MailComposer.composeAsync({
      recipients: ["wagner@grandvalle.com", "mangagv@grandvalle.com"],
      subject: `Relatório QTDA - Lote ${lote}`,
      attachments: [newPath],
    });
  } catch (error) {
    Alert.alert("Erro", "Falha na criação do PDF.");
  }
}