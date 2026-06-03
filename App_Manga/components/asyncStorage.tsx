import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Registro } from "../data/daodaAvaliacao";

type Props = {
  lote: string;
  planta: number;
  setAvaliacoes: React.Dispatch<React.SetStateAction<Registro[]>>;
};

const CHAVE_BASE = "@avaliacoes";
const SENHA_ADMIN = "1234";

export const salvarAvaliacoes = async (
  novasAvaliacoes: Registro[],
  lote: string,
) => {
  try {
    const chaveAvaliacoes = `${CHAVE_BASE}_${lote}`;

    const dadosAntigosJSON = await AsyncStorage.getItem(chaveAvaliacoes);
    const dadosAntigos: Registro[] = dadosAntigosJSON
      ? JSON.parse(dadosAntigosJSON)
      : [];

    const mapa = new Map();

    [...dadosAntigos, ...novasAvaliacoes].forEach((item) => {
      const key = `${item.planta}-${item.doencaOuPraga}-${item.orgao}-${item.identificadorDeLocal}-${item.ramo}-${item.numeroLocal}`;
      mapa.set(key, item);
    });

    const todosOsDados = Array.from(mapa.values());

    await AsyncStorage.setItem(chaveAvaliacoes, JSON.stringify(todosOsDados));

    console.log("Dados combinados foram salvos com sucesso.");
    Alert.alert("✅ Sucesso!", `Dados do lote ${lote} foram salvos.`);
  } catch (e) {
    console.error("Erro ao salvar dados:", e);
    Alert.alert("❌ Erro", "Ocorreu um erro ao salvar os dados.");
  }
};

export const carregarDadosCompletos = async (
  lote: string,
  setAvaliacoes: (avaliacoes: Registro[]) => void,
) => {
  try {
    const chaveAvaliacoes = `${CHAVE_BASE}_${lote}`;
    const jsonAvaliacoes = await AsyncStorage.getItem(chaveAvaliacoes);
    const dadosAvaliacoes: Registro[] = jsonAvaliacoes
      ? JSON.parse(jsonAvaliacoes)
      : [];

    setAvaliacoes(dadosAvaliacoes);

    const plantasAgrupadas = Object.values(
      dadosAvaliacoes.reduce((acc: Record<string, any>, registro) => {
        if (!acc[registro.planta]) {
          acc[registro.planta] = { planta: registro.planta, avaliacoes: [] };
        }

        acc[registro.planta].avaliacoes.push({
          doencaOuPraga: registro.doencaOuPraga,
          orgao: registro.orgao,
          quadrante: registro.quadrante,
          nota: registro.nota,
          centroCusto: registro.centroCusto,
          data: registro.criadoEm,
        });

        return acc;
      }, {}),
    );

    plantasAgrupadas.forEach((p: any) => {
      const notas = p.avaliacoes.map((a: any) => a.nota);
      p.mediaNotas =
        notas.length > 0
          ? notas.reduce((s: number, n: number) => s + n, 0) / notas.length
          : 0;
    });

    return plantasAgrupadas;
  } catch (e) {
    console.error("Erro ao carregar dados de avaliações:", e);
    return [];
  }
};

export default function BotaoApagarEspecifico({
  lote,
  planta,
  setAvaliacoes,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [senha, setSenha] = useState("");

  const confirmarApagar = async () => {
    if (senha === SENHA_ADMIN) {
      try {
        const chave = `${CHAVE_BASE}_${lote}`;
        const dadosBrutos = await AsyncStorage.getItem(chave);
        const dadosAtuais: Registro[] = dadosBrutos
          ? JSON.parse(dadosBrutos)
          : [];

        const dadosAtualizados = dadosAtuais.filter(
          (item) => item.planta !== planta,
        );

        await AsyncStorage.setItem(chave, JSON.stringify(dadosAtualizados));

        setAvaliacoes(dadosAtualizados);

        setModalVisible(false);
        setSenha("");
        Alert.alert(
          "✅ Apagado",
          `Avaliações da planta ${planta} do lote ${lote} foram apagadas.`,
        );
      } catch (erro) {
        console.error("Erro ao apagar avaliações específicas: ", erro);
        Alert.alert("❌ Erro", "Não foi possível apagar os dados.");
      }
    } else {
      Alert.alert("❌ Senha incorreta", "Ação cancelada.");
      setSenha("");
    }
  };

  return (
    <View>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: "red",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text
          style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}
        >
          Apagar Planta {planta} do Lote {lote}
        </Text>
      </Pressable>
      <Modal transparent visible={modalVisible} animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000099",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                marginBottom: 10,
                fontSize: 14,
                fontWeight: "700",
                color: "#FF0000",
                textAlign: "center",
              }}
            >
              Ao confirmar, irá apagar todos os dados da Planta {planta} do
              Lote: {lote}
            </Text>
            <Text style={{ marginBottom: 10, fontSize: 16 }}>
              Digite a senha para confirmar:
            </Text>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 6,
                marginBottom: 15,
              }}
            />
            <Pressable
              onPress={confirmarApagar}
              style={{
                backgroundColor: "#3b82f6",
                padding: 12,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                Confirmar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setModalVisible(false);
                setSenha("");
              }}
              style={{ padding: 12, borderRadius: 8 }}
            >
              <Text style={{ textAlign: "center", color: "#3b82f6" }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export const SincronizarIndicadores = async (
  dadosResumo: any[],
  lote: string,
  planta: number,
  centroCusto: string,
) => {
  try {
    const dadosParaEnviar = dadosResumo
      .filter(
        (item) =>
          item.percentualComposto > 0 ||
          item.orgaos.some((o: any) => o.totalNotas > 0),
      )
      .map((item) => ({
        mobileId: `${lote}-${planta}-${item.nome}-${Date.now()}`,
        lote,
        planta,
        centroCusto,
        nome: item.nome,
        percentualComposto: (item.percentualComposto ?? 0) / 10,
        totalNotas: item.orgaos?.reduce(
          (acc: number, cur: any) => acc + (cur.totalNotas || 0),
          0,
        ),
      }));

    if (dadosParaEnviar.length === 0) return;

    // Log do payload enviado para o backend
    console.log('Payload enviado para o backend:', JSON.stringify(dadosParaEnviar, null, 2));

    await fetch("http://10.0.2.2:3004/api/sincronizar-relatorio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosParaEnviar),
    });

    console.log("📊 Indicadores de % enviados para o banco!");
  } catch (error) {
    console.error("Erro ao enviar indicadores:", error);
  }
};

export const salvarPacoteOffline = async (pacoteCompleto: any) => {
  try {
    // 1. Geramos a string JSON primeiro para medir o impacto na RAM
    const stringData = JSON.stringify(pacoteCompleto);
    
    // 2. Log de monitoramento (Essencial para diagnosticar o crash)
    const tamanhoEmMB = (stringData.length / (1024 * 1024)).toFixed(2);
    console.log(`📏 Tentando salvar pacote offline. Tamanho: ${tamanhoEmMB} MB`);

    // Alerta se o pacote passar de 2MB (AsyncStorage começa a sofrer aqui)
    if (stringData.length > 2 * 1024 * 1024) {
      console.warn("🚨 ALERTA: Pacote muito grande! Isso pode causar o erro 'Scudo' no motor Hermes.");
    }

    // 3. Geramos a chave única
    const key = `@pacote_${pacoteCompleto.header.lote}_${pacoteCompleto.header.planta}_${Date.now()}`;

    // 4. Salvamento
    await AsyncStorage.setItem(key, stringData);

    console.log("📦 Pacote Completo salvo offline com sucesso:", key);
    return true;
  } catch (e) {
    console.error("❌ Erro fatal ao salvar pacote offline:", e);
    return false;
  }
};

export const sincronizarPacotesCompletos = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysPacotes = allKeys.filter((key) => key.startsWith("@pacote_"));

    if (keysPacotes.length === 0) return true;

    console.log(`Iniciando sincronização de ${keysPacotes.length} pacotes...`);

    for (const key of keysPacotes) {
      const json = await AsyncStorage.getItem(key);
      if (!json) continue;

      // Enviamos um por um para não estourar a memória (Hermes/Scudo)
      const response = await fetch(
        "http://10.0.2.2:3004/api/sincronizar-pacote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Enviamos o JSON direto como string para economizar o parse/stringify
          body: json, 
        }
      );

      if (response.ok) {
        // Só remove do celular se o servidor confirmar o recebimento
        await AsyncStorage.removeItem(key);
        console.log(`✅ Pacote ${key} sincronizado e removido.`);
      } else {
        console.warn(`⚠️ Falha ao sincronizar pacote ${key}. Status: ${response.status}`);
        // Opcional: interromper o loop se o servidor estiver fora do ar
        return false; 
      }
    }

    return true;
  } catch (error) {
    console.error("Erro no envio do pacote:", error);
    return false;
  }
};
