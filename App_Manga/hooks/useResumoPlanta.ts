import { useMemo } from "react";
import { doencasPragas, Registro } from "../data/daodaAvaliacao";

// --- 1. HOOK DA PLANTA (Resumo Individual no Tablet) ---
export const useResumoPlanta = (
  avaliacoes: Registro[],
  plantaSelecionada: number,
  _lote: string,
  centroCustoSelecionado: string,
  qtdePlantas: number,
) => {
  return useMemo(() => {
    if (!avaliacoes || avaliacoes.length === 0 || !centroCustoSelecionado) return [];

    return doencasPragas.map((item) => {
      const registrosItem = avaliacoes.filter(
        (a) => a.planta === plantaSelecionada && a.doencaOuPraga === item.nome && a.centroCusto === centroCustoSelecionado
      );

      const orgaos = item.orgaos.map((o) => {
        const registrosOrgao = registrosItem.filter((r) => r.orgao === o.nome);

        if (item.tipo === "doenca") {
          // 🚀 DOENÇAS NA PLANTA
          const somaNotas = registrosOrgao.reduce((s, r) => s + (Number(r.nota) || 0), 0);
          const mult = o.nome.toUpperCase().includes("FOLHA") || o.nome.toUpperCase().includes("RAMO") ? 8 : 4;

          let notaMaxOrgao = o.notaMax || 5;

          // 🚀 CORREÇÃO DA MORTE DESCENDENTE
          // Trava a nota para 1 para garantir os divisores 80, 112 e 144!
          if (item.nome.toUpperCase().includes("MORTE")) {
            notaMaxOrgao = 1;
          }

          const divisorPlanta = mult * qtdePlantas * notaMaxOrgao;
          const porcentagem = divisorPlanta > 0 ? (somaNotas * 100) / divisorPlanta : 0;

          return { nome: o.nome, tipo: item.tipo, totalNotas: somaNotas, porcentagem };
        } else {
          // 🐛 PRAGAS NA PLANTA (Com a regra da Cochonilha perfeita)
          let totalB = 0, totalA = 0;

          registrosOrgao.forEach(r => {
            const localStr = (r.local || "").toString().toLowerCase();
            const idLocalStr = (r.identificadorDeLocal || "").toString().toLowerCase();
            if (
              (idLocalStr.includes("bordadura") || localStr.includes("bordadura"))
            ) {
              totalB += (Number(r.nota) || 0);
            } else if (
              idLocalStr.includes("interna") || localStr.includes("interna")
            ) {
              totalA += (Number(r.nota) || 0);
            }
          });

          const isCochonilha = [
            "COCHONILHA",
            "COCHONILHA CARAPAÇA",
            "COCHONILHA CABEÇA DE PREGO",
            "COCHONILHA ESTRELA"
          ].includes(item.nome.toUpperCase());

          const isFolhaCochonilha = o.nome.toUpperCase().includes("FOLHA");

          let mult, notaMaxOrgao;

          if (isCochonilha) {
            if (o.nome.toUpperCase().includes("FRUTO") || o.nome.toUpperCase().includes("CACHO")) {
              mult = 4;
              notaMaxOrgao = 1;
            } else if (isFolhaCochonilha) {
              // Regra especial para folha em todas as cochonilhas
              // Borda: 32/40/48 | Área interna: 48/72/96
              mult = 8;
              notaMaxOrgao = 1;
            } else if (o.nome.toUpperCase().includes("RAMO")) {
              mult = 4;
              notaMaxOrgao = 2;
            } else {
              mult = 4;
              notaMaxOrgao = 1;
            }
          } else {
            const temRamo = registrosOrgao.some((r) => !!r.ramo);
            mult = temRamo ? 8 : 4;
            notaMaxOrgao = o.notaMax || 1;
          }

          let maxB = 4, maxA = 6;
          if (qtdePlantas === 14) { maxB = 5; maxA = 9; }
          else if (qtdePlantas === 18) { maxB = 6; maxA = 12; }

          const dB = maxB * mult * notaMaxOrgao;
          const dA = maxA * mult * notaMaxOrgao;

          const pB = dB > 0 ? (totalB * 100) / dB : 0;
          const pA = dA > 0 ? (totalA * 100) / dA : 0;
          const media = (pB + pA) / 2;

          return {
            nome: o.nome,
            tipo: item.tipo,
            totalBordadura: totalB,
            totalArea: totalA,
            porcentagemBordadura: pB,
            porcentagemArea: pA,
            porcentagemMedia: media,
          };
        }
      });

      const orgaosValidos = orgaos.filter(o => {
        const p = (o as any).porcentagemMedia !== undefined ? (o as any).porcentagemMedia : (o as any).porcentagem;
        return p > 0;
      });

      const somaP = orgaosValidos.reduce((acc, o) => {
        const p = (o as any).porcentagemMedia !== undefined ? (o as any).porcentagemMedia : (o as any).porcentagem;
        return acc + p;
      }, 0);

      const mediaFinal = orgaosValidos.length > 0 ? (somaP / orgaosValidos.length) : 0;
      const percentualComposto = Math.min(mediaFinal, 100);

      return {
        nome: item.nome,
        tipo: item.tipo,
        orgaos,
        percentualComposto: parseFloat(percentualComposto.toFixed(2)),
      };
    });
  }, [avaliacoes, plantaSelecionada, centroCustoSelecionado, qtdePlantas]);
};

// --- 2. HOOK DO LOTE (Resumo da Fazenda / PDF / Site) ---
export const useResumoLote = (
  avaliacoes: Registro[],
  _plantaSelecionada: number,
  _lote: string,
  centroCustoSelecionado: string,
  qtdePlantas: number,
) => {
  return useMemo(() => {
    if (!avaliacoes || avaliacoes.length === 0 || !centroCustoSelecionado) return [];

    return doencasPragas.map((item) => {
      const avalsItem = avaliacoes.filter(
        (a) => a.doencaOuPraga === item.nome && a.centroCusto === centroCustoSelecionado
      );

      let percentualFinal = 0;

      if (item.tipo === "doenca") {
        // 🚀 DOENÇAS NO LOTE
        let somaTotalNotas = 0;
        let divisorTotalLote = 0;
        const orgaosAvaliados = [...new Set(avalsItem.map((a) => a.orgao))];

        orgaosAvaliados.forEach((orgaoNome) => {
          if (!orgaoNome) return;
          const registrosDoOrgao = avalsItem.filter((r) => r.orgao === orgaoNome);
          const soma = registrosDoOrgao.reduce((s, a) => s + (Number(a.nota) || 0), 0);

          const mult = orgaoNome.toUpperCase().includes("FOLHA") || orgaoNome.toUpperCase().includes("RAMO") ? 8 : 4;
          const orgaoCompleto = item.orgaos.find(org => org.nome === orgaoNome);

          let notaMaxOrgao = orgaoCompleto?.notaMax || 5;

          // 🚀 CORREÇÃO DA MORTE DESCENDENTE NO LOTE
          if (item.nome.toUpperCase().includes("MORTE")) {
            notaMaxOrgao = 1;
          }

          somaTotalNotas += soma;
          divisorTotalLote += (mult * qtdePlantas * notaMaxOrgao);
        });

        percentualFinal = divisorTotalLote > 0 ? (somaTotalNotas * 100) / divisorTotalLote : 0;

      } else {
        // 🐛 PRAGAS NO LOTE
        const porcentagensDosOrgaos: number[] = [];
        let maxB = 4, maxA = 6;
        if (qtdePlantas === 14) { maxB = 5; maxA = 9; }
        else if (qtdePlantas === 18) { maxB = 6; maxA = 12; }

        item.orgaos.forEach((orgao) => {
          const registrosDoOrgao = avalsItem.filter((r) => r.orgao === orgao.nome);
          if (registrosDoOrgao.length === 0) return;

          const isCochonilha = [
            "COCHONILHA",
            "COCHONILHA CARAPAÇA",
            "COCHONILHA CABEÇA DE PREGO",
            "COCHONILHA ESTRELA"
          ].includes(item.nome.toUpperCase());

          const isFolhaCochonilha = orgao.nome.toUpperCase().includes("FOLHA");

          let mult, notaMaxOrgao;

          if (isCochonilha) {
            if (orgao.nome.toUpperCase().includes("FRUTO") || orgao.nome.toUpperCase().includes("CACHO")) {
              mult = 4;
              notaMaxOrgao = 1;
            } else if (isFolhaCochonilha) {
              mult = 8;
              notaMaxOrgao = 1;
            } else if (orgao.nome.toUpperCase().includes("RAMO")) {
              mult = 8;
              notaMaxOrgao = 2;
            } else {
              mult = 4;
              notaMaxOrgao = 1;
            }
          } else {
            const temRamo = registrosDoOrgao.some(r => !!r.ramo);
            mult = temRamo ? 8 : 4;
            notaMaxOrgao = orgao.notaMax || 1;
          }

          let totalB = 0, totalA = 0;
          registrosDoOrgao.forEach(r => {
            if (r.identificadorDeLocal === "Bordadura" || r.local === "Bordadura") {
              totalB += (Number(r.nota) || 0);
            } else {
              totalA += (Number(r.nota) || 0);
            }
          });

          const divisorB = maxB * mult * notaMaxOrgao;
          const divisorA = maxA * mult * notaMaxOrgao;

          const pB = divisorB > 0 ? (totalB * 100) / divisorB : 0;
          const pA = divisorA > 0 ? (totalA * 100) / divisorA : 0;
          porcentagensDosOrgaos.push((pB + pA) / 2);
        });

        if (porcentagensDosOrgaos.length > 0) {
          percentualFinal = porcentagensDosOrgaos.reduce((s, p) => s + p, 0) / porcentagensDosOrgaos.length;
        }
      }

      percentualFinal = Math.min(percentualFinal, 100);

      return {
        nome: item.nome,
        percentualFinal: parseFloat(percentualFinal.toFixed(2))
      };
    });
  }, [avaliacoes, centroCustoSelecionado, qtdePlantas]);
};