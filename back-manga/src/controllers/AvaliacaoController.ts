import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AvaliacaoController {
async sincronizarPacote(req: Request, res: Response) {
  try {
    const pacotes = req.body;

    console.log(`\n=========================================================`);
    console.log(`🚀 [INÍCIO] SINCRONIZAÇÃO DE PACOTES INICIADA`);
    console.log(`=========================================================\n`);

    if (!Array.isArray(pacotes) || pacotes.length === 0) {
      console.log(`❌ [ERRO] Payload inválido ou array de pacotes vazio.\n`);
      return res.status(400).json({ error: "Nenhum pacote enviado." });
    }

    console.log(`📦 [PAYLOAD] Recebido um total de: 🟢 ${pacotes.length} pacote(s)\n`);

    let salvos = 0;

    for (const [index, pacote] of pacotes.entries()) {
      const { header, avaliacoes, relatorios } = pacote;

      console.log(`\n=========================================================`);
      console.log(`🔍 [ANALISANDO PACOTE ${index + 1} DE ${pacotes.length}]`);
      console.log(`=========================================================`);
      
      // 1. COMO CHEGA: HEADER
      console.log(`\n📥 [COMO CHEGA - CABEÇALHO]`);
      console.log(`🌱 Planta: ${header.planta}`);
      console.log(`📍 Lote: ${header.lote}`);
      console.log(`🏢 Centro de Custo: ${header.centroCusto}`);
      console.log(`👤 Avaliador: ${header.nomeAvaliador}`);
      console.log(`📅 Criado Em: ${header.criadoEm}`);
      console.log(`🔑 ID Único (Mobile): ${header.idUnico}`);

      // 2. COMO CHEGA: AVALIAÇÕES (CADA NOTA)
      console.log(`\n📝 [COMO CHEGA - AVALIAÇÕES / NOTAS] (${avaliacoes?.length || 0} recebidas)`);
      if (avaliacoes && avaliacoes.length > 0) {
        avaliacoes.forEach((av: any, i: number) => {
          console.log(
            `   [Nota ${i + 1}] 🦠 Praga/Doença: ${av.doencaOuPraga || av.doenca || "N/A"} | ` +
            `🍃 Órgão: ${av.orgao || "N/A"} | ` +
            `🔢 Nota: ${av.nota || 0} | ` +
            `🌿 Ramo: ${av.ramo || "N/A"} | ` +
            `🎯 Local: ${av.identificadorDeLocal || "N/A"} ` +
            `${av.numeroLocal ? `(#${av.numeroLocal})` : ""} ` +
            `${av.local?.latitude ? `| 🌍 GPS: ${av.local.latitude}, ${av.local.longitude}` : ""}`
          );
        });
      } else {
        console.log(`   ⚠️ Nenhuma avaliação (nota) recebida para esta planta.`);
      }

      // 3. COMO CHEGA: RELATÓRIOS
      console.log(`\n📊 [COMO CHEGA - RELATÓRIOS] (${relatorios?.length || 0} recebidos)`);
      if (relatorios && relatorios.length > 0) {
        relatorios.forEach((rel: any, i: number) => {
          console.log(
            `   [Rel ${i + 1}] 🦠 Praga/Doença: ${rel.doenca || rel.doencaOuPraga || "N/A"} | ` +
            `🍃 Órgão: ${rel.orgao || "N/A"} | ` +
            `📈 Porcentagem: ${rel.porcentagem || 0}% | ` +
            `Σ Total Notas: ${rel.totalNotas || 0}`
          );
        });
      } else {
        console.log(`   ⚠️ Nenhum relatório recebido para esta planta.`);
      }

      const dataRegistro = new Date(header.criadoEm);
      const inicioDia = new Date(dataRegistro);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataRegistro);
      fimDia.setHours(23, 59, 59, 999);

      // Tratamento dos relatórios para o banco
      const relatoriosFinais = (relatorios || []).map((rel: any) => ({
        doencaOuPraga: rel.doenca || rel.doencaOuPraga || "Desconhecido",
        orgao: rel.orgao,
        porcentagem: rel.porcentagem ? Number(rel.porcentagem) : 0,
        totalNotas: rel.totalNotas ? Number(rel.totalNotas) : 0,
      }));

      // Tratamento das avaliações para o banco
      const avaliacoesFinais = (avaliacoes || []).map((av: any) => ({
        doencaOuPraga: av.doencaOuPraga || av.doenca,
        orgao: av.orgao,
        quadrante: av.quadrante || null,
        ramo: av.ramo || null,
        identificadorDeLocal: av.identificadorDeLocal || null,
        numeroLocal: av.numeroLocal ? Number(av.numeroLocal) : null,
        nota: av.nota ? parseFloat(av.nota) : 0,
        latitude: av.local?.latitude || null,
        longitude: av.local?.longitude || null,
        accuracy: av.local?.accuracy || null,
      }));

      console.log(`\n🔎 [BANCO DE DADOS] Verificando existência da sessão...`);
      const sessaoExistente = await prisma.sessaoAvaliacao.findFirst({
        where: {
          centroCusto: header.centroCusto,
          lote: header.lote,
          planta: Number(header.planta),
          criadoEm: { gte: inicioDia, lte: fimDia },
        },
      });

      // 4. COMO ENVIA (DADOS PREPARADOS PARA O PRISMA)
      console.log(`\n💾 [COMO ENVIA - DADOS FORMATADOS PARA O PRISMA]`);
      const payloadPrisma = {
        nomeAvaliador: header.nomeAvaliador,
        avaliacoes: { create: avaliacoesFinais },
        relatorios: { create: relatoriosFinais },
      };
      // Mostra um resumo do objeto JSON que vai pro banco para não poluir infinitamente se for gigante
      console.log(JSON.stringify({
        ...payloadPrisma,
        avaliacoes: `[ Array com ${avaliacoesFinais.length} avaliações processadas ]`,
        relatorios: `[ Array com ${relatoriosFinais.length} relatórios processados ]`
      }, null, 2));

      if (sessaoExistente) {
        console.log(`\n🔄 [AÇÃO] SESSÃO EXISTENTE (ID: ${sessaoExistente.id}). Atualizando dados...`);
        
        await prisma.registroAvaliacao.deleteMany({
          where: { sessaoId: sessaoExistente.id },
        });
        await prisma.relatorioConsolidado.deleteMany({
          where: { sessaoId: sessaoExistente.id },
        });

        await prisma.sessaoAvaliacao.update({
          where: { id: sessaoExistente.id },
          data: payloadPrisma,
        });
        console.log(`✅ [SUCESSO] Sessão ${sessaoExistente.id} atualizada!\n`);
      } else {
        console.log(`\n✨ [AÇÃO] NOVA SESSÃO. Criando registro no banco...`);

        const novaSessao = await prisma.sessaoAvaliacao.create({
          data: {
            mobileSessaoId: header.idUnico,
            lote: header.lote,
            planta: Number(header.planta),
            centroCusto: header.centroCusto,
            criadoEm: dataRegistro,
            ...payloadPrisma
          },
        });
        console.log(`✅ [SUCESSO] Sessão criada com sucesso (ID: ${novaSessao.id})!\n`);
      }
      
      salvos++;
    }

    console.log(`=========================================================`);
    console.log(`🎉 [CONCLUÍDO] Sincronização finalizada com sucesso!`);
    console.log(`💾 Total de pacotes salvos/atualizados: ${salvos}`);
    console.log(`=========================================================\n`);

    return res.status(201).json({ message: "Pacotes sincronizados!", total: salvos });
    
  } catch (error) {
    console.log(`\n=========================================================`);
    console.error(`🚨 [ERRO FATAL] Falha no processamento da sincronização!`);
    console.error(`Detalhes do erro:`, error);
    console.log(`=========================================================\n`);
    return res.status(500).json({ error: "Erro ao salvar pacote." });
  }
}






  async listar(req: Request, res: Response) {
    const lista = await prisma.sessaoAvaliacao.findMany({
      orderBy: { criadoEm: "desc" },
      include: { relatorios: true, avaliacoes: true },
    });
    return res.json(lista);
  }
}
