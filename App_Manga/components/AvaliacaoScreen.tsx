import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  doencasPragas,
  Registro,
  PontoLocalizacao,
} from "../data/daodaAvaliacao";

import { RenderHeader, useAvaliacaoScreenState } from "../hooks/header";
import { RenderFooter } from "../hooks/footer";
import OrgaoItem from "../hooks/orgao";
import { obterLocalizacaoComTime, localizacaoPadrao } from "./gps";
import { useResumoPlanta } from "../hooks/useResumoPlanta";

// --- COMPONENTE DO MODAL "BLINDADO" (USANDO VIEW EM VEZ DE MODAL NATIVO) ---
interface ModalMapGPSProps {
  visible: boolean;
  status: "ocioso" | "buscando" | "aguardando_confirmacao" | "erro";
  coordenadas?: { lat: number; long: number; acc?: number } | null;
  exibirAvisoRecalculo: boolean;
  onConfirm: () => void;
  onRecalculate: () => void;
  onCancel: () => void;
  onForceLocation: () => void;
}

const ModalMapGPS = ({
  visible,
  status,
  coordenadas,
  exibirAvisoRecalculo,
  onConfirm,
  onRecalculate,
  onCancel,
  onForceLocation,
}: ModalMapGPSProps) => {
  // Se não estiver visível, não renderiza nada
  if (!visible || status === "ocioso") return null;

  return (
    /* 🛡️ A MÁGICA: Usamos StyleSheet.absoluteFill para cobrir a tela sem dar erro de Binder */
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 20, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 }]}>
      <View style={styles.modalContainer}>
        {status === "buscando" && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.modalTitle}>Buscando Satélite...</Text>
            <Text style={styles.modalSub}>Aguarde a triangulação 🛰️</Text>
          </View>
        )}

        {status === "erro" && (
          <View style={styles.loadingContainer}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>⚠️</Text>
            <Text style={styles.modalTitle}>Sinal de GPS Fraco</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity onPress={onRecalculate} style={[styles.btnBase, styles.btnRetry]}>
                <Text style={styles.btnTextWhite}>🔄 Tentar Novamente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onForceLocation} style={[styles.btnBase, { backgroundColor: "#f59e0b", marginTop: 8 }]}>
                <Text style={[styles.btnTextWhite, { color: "#78350f" }]}>📍 Local Padrão</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancel} style={[styles.btnBase, styles.btnCancel, { marginTop: 8 }]}>
                <Text style={styles.btnTextSec}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {status === "aguardando_confirmacao" && coordenadas && (
          <View style={{ width: "100%", alignItems: "center" }}>
            {exibirAvisoRecalculo && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Localização Aproximada</Text>
              </View>
            )}

            <View style={{ marginVertical: 15, alignItems: "center" }}>
              <Text style={{ fontSize: 60 }}>{exibirAvisoRecalculo ? "⚠️" : "📍"}</Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.label}>Latitude</Text>
              <Text style={styles.value}>{coordenadas.lat.toFixed(6)}</Text>
              <View style={styles.divider} />
              <Text style={styles.label}>Longitude</Text>
              <Text style={styles.value}>{coordenadas.long.toFixed(6)}</Text>
              <View style={styles.divider} />
              <Text style={styles.label}>Precisão</Text>
              <Text style={[styles.value, { color: (coordenadas.acc || 0) > 20 ? "#ef4444" : "#15803d" }]}>
                ±{(coordenadas.acc || 0).toFixed(0)}m
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onRecalculate} style={[styles.btnBase, styles.btnRecalc]}>
                <Text style={styles.btnTextSec}>🔄 Recalcular</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={[styles.btnBase, styles.btnConfirm]}>
                <Text style={styles.btnTextWhite}>✅ Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// --- TELA PRINCIPAL (LOGICA MANTIDA) ---
export default function AvaliacaoScreen({ numeroDePlantas, lote: loteInicial }: any) {
  const {
    avaliacoes, setAvaliacoes, plantaSelecionada, setPlantaSelecionada,
    filtroSelecionado, setFiltroSelecionado, nomeAvaliador, setNomeAvaliador,
    local, handleLocalChange, centroCustoSelecionado, plantas,
    fazendaSelecionada, handleFazendaChange, lotesFiltrados, listaFazendas,
  } = useAvaliacaoScreenState(numeroDePlantas);

  const [plantasSelecionadas, setPlantasSelecionadas] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<"ocioso" | "buscando" | "aguardando_confirmacao" | "erro">("ocioso");
  const [gpsInfo, setGpsInfo] = useState<{ lat: number; long: number; acc?: number } | null>(null);
  const [registroPendente, setRegistroPendente] = useState<any>(null);
  const isLockedRef = useRef(false);
  const [tentativasFallback, setTentativasFallback] = useState(0);

  const buscarGPS = async () => {
    setGpsStatus("buscando");
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 300));
      const referenciaGPS = local || loteInicial || "DESCONHECIDO";
      const pontoAtual: any = await obterLocalizacaoComTime(referenciaGPS);

      const isFallback = pontoAtual.latitude === localizacaoPadrao.latitude && pontoAtual.longitude === localizacaoPadrao.longitude;
      setTentativasFallback(isFallback ? prev => prev + 1 : 0);

      setGpsInfo({ lat: pontoAtual.latitude, long: pontoAtual.longitude, acc: pontoAtual.accuracy ?? 0 });
      setGpsStatus("aguardando_confirmacao");
    } catch (error) {
      setGpsStatus("erro");
    }
  };

  const iniciarFluxoDeRegistro = (action: any) => {
    if (isLockedRef.current) return;
    if (!centroCustoSelecionado || !nomeAvaliador) {
      Alert.alert("⚠️ Atenção", "Selecione local e avaliador.");
      return;
    }
    isLockedRef.current = true;
    setRegistroPendente(action);
    buscarGPS();
  };

  const handleCancel = () => {
    setGpsStatus("ocioso");
    setRegistroPendente(null);
    setGpsInfo(null);
    setTentativasFallback(0);
    // Destrava com pequeno delay para o UI respirar
    setTimeout(() => { isLockedRef.current = false; }, 500);
  };

  const handleConfirm = () => {
    if (!registroPendente || !gpsInfo) return;

    const loteNumeroReal = loteInicial || "SEM_LOTE";
    const pontoConfirmado: PontoLocalizacao = {
      id: Date.now(), lote: loteNumeroReal,
      latitude: gpsInfo.lat, longitude: gpsInfo.long,
      timestamp: Date.now(), accuracy: gpsInfo.acc,
    };

    if (registroPendente.type === "numeric") {
      const { planta, doencaOuPraga, orgao, quadrante, ramo, localPicker, numeroLocal, nota } = registroPendente.payload;
      const localFinal = localPicker ? localPicker : (local || null);

      setAvaliacoes((prev) => {
        const filtradas = prev.filter(r => !(
          r.planta === planta && r.doencaOuPraga === doencaOuPraga && r.orgao === orgao &&
          (r.quadrante || null) === (quadrante || null) && (r.ramo || null) === (ramo || null) &&
          (r.identificadorDeLocal || null) === (localFinal || null) && (r.numeroLocal || null) === (numeroLocal || null)
        ));

        if (nota != null && nota >= 0) {
          const novo: Registro = {
            id: Date.now(), planta, doencaOuPraga, orgao, quadrante, ramo, nota,
            lote: loteNumeroReal, centroCusto: centroCustoSelecionado, criadoEm: new Date().toISOString(),
            local: pontoConfirmado, localId: pontoConfirmado.id, identificadorDeLocal: localFinal,
            numeroLocal: numeroLocal || null, nomeAvaliador,
          };
          return [...filtradas, novo];
        }
        return filtradas;
      });
    } else if (registroPendente.type === "checkbox") {
      const { planta, doencaOuPraga, orgao } = registroPendente.payload;
      setAvaliacoes((prev) => {
        const existe = prev.find(a => a.planta === planta && a.doencaOuPraga === doencaOuPraga && a.orgao === orgao);
        if (existe) return prev.filter(a => a.id !== existe.id);
        const novo: Registro = {
          id: Date.now(), planta, doencaOuPraga, orgao, lote: loteNumeroReal, centroCusto: centroCustoSelecionado,
          nota: 1, criadoEm: new Date().toISOString(), local: pontoConfirmado, localId: pontoConfirmado.id,
          identificadorDeLocal: local || null, numeroLocal: null, nomeAvaliador,
        };
        return [...prev, novo];
      });
    }
    handleCancel();
  };

  const itemSelecionado = useMemo(() => doencasPragas.find(d => d.nome === filtroSelecionado), [filtroSelecionado]);
  const resumoDaPlanta = useResumoPlanta(avaliacoes, plantaSelecionada, local || loteInicial, centroCustoSelecionado, numeroDePlantas);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <RenderHeader
            lote={loteInicial} plantas={plantas} plantaSelecionada={plantaSelecionada}
            handlePlantaChange={setPlantaSelecionada} local={local} handleLocalChange={handleLocalChange}
            filtroSelecionado={filtroSelecionado} handleFiltroChange={setFiltroSelecionado}
            nomeAvaliador={nomeAvaliador} setNomeAvaliador={setNomeAvaliador} setAvaliacoes={setAvaliacoes}
            centroCustoSelecionado={centroCustoSelecionado} fazendaSelecionada={fazendaSelecionada}
            handleFazendaChange={handleFazendaChange} lotesFiltrados={lotesFiltrados} listaFazendas={listaFazendas}
          />
        }
        ListFooterComponent={
          <RenderFooter
            plantas={plantas} plantaSelecionada={plantaSelecionada} plantasComDados={[]}
            plantasSelecionadas={plantasSelecionadas} togglePlantaSelecionada={() => { }}
            avaliacoes={avaliacoes} setAvaliacoes={setAvaliacoes} setResetKey={setResetKey}
            lote={loteInicial} nomeAvaliador={nomeAvaliador} isSaving={gpsStatus !== "ocioso"}
            resumoDaPlanta={resumoDaPlanta} centroCustoSelecionado={centroCustoSelecionado}
          />
        }
        data={itemSelecionado ? itemSelecionado.orgaos : []}
        renderItem={({ item }) => (
          <OrgaoItem
            item={item} itemSelecionado={itemSelecionado} plantaSelecionada={plantaSelecionada}
            handleCheckbox={(p, d, o) => iniciarFluxoDeRegistro({ type: 'checkbox', payload: { planta: p, doencaOuPraga: d, orgao: o } })}
            getCheckboxValue={(p, d, o) => avaliacoes.some(a => a.planta === p && a.doencaOuPraga === d && a.orgao === o)}
            handleChange={(p, d, o, q, r, lp, nl, n) => iniciarFluxoDeRegistro({ type: 'numeric', payload: { planta: p, doencaOuPraga: d, orgao: o, quadrante: q, ramo: r, localPicker: lp, numeroLocal: nl, nota: n } })}
            getNota={(p, it, or, q, r) =>
              avaliacoes.find(a =>
                a.planta === p &&
                a.doencaOuPraga === it &&
                a.orgao === or &&
                (a.quadrante || null) === (q || null) &&
                (a.ramo || null) === (r || null)
              )?.nota ?? 0
            }
            isSaving={gpsStatus !== "ocioso"}
            centroCustoSelecionado={centroCustoSelecionado} resetKey={resetKey}
          />
        )}
        keyExtractor={(item) => item.nome}
      />

      {/* 🚀 O MODAL BLINDADO FICA AQUI FORA DA LISTA */}
      <ModalMapGPS
        visible={gpsStatus !== "ocioso"}
        status={gpsStatus}
        coordenadas={gpsInfo}
        exibirAvisoRecalculo={tentativasFallback > 1}
        onConfirm={handleConfirm}
        onRecalculate={() => buscarGPS()}
        onCancel={handleCancel}
        onForceLocation={() => { }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 16 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 28, padding: 24, alignItems: "center", elevation: 20 },
  loadingContainer: { paddingVertical: 40, alignItems: "center", width: "100%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#1e293b", marginTop: 12 },
  modalSub: { fontSize: 16, color: "#64748b", marginTop: 4, textAlign: "center" },
  dataBox: { backgroundColor: "#f1f5f9", width: "100%", padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", marginVertical: 20 },
  label: { fontSize: 12, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  value: { fontSize: 20, color: "#1e293b", fontWeight: "bold", fontFamily: "monospace", textAlign: "center" },
  divider: { height: 1, backgroundColor: "#cbd5e1", marginVertical: 12, width: "60%", alignSelf: 'center' },
  warningBox: { backgroundColor: "#fef3c7", padding: 12, borderRadius: 16, marginBottom: 10, width: "100%" },
  warningTitle: { color: "#b45309", fontWeight: "bold", fontSize: 14, textAlign: 'center' },
  buttonRow: { flexDirection: "row", width: "100%", justifyContent: "space-between", gap: 12, marginTop: 10 },
  btnBase: { paddingVertical: 16, borderRadius: 18, alignItems: "center", justifyContent: "center", flex: 1 },
  btnRecalc: { backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#cbd5e1" },
  btnConfirm: { backgroundColor: "#10b981" },
  btnRetry: { backgroundColor: "#3b82f6", width: "100%" },
  btnCancel: { backgroundColor: "#e2e8f0", width: "100%" },
  btnTextWhite: { color: "white", fontWeight: "bold", fontSize: 16 },
  btnTextSec: { color: "#334155", fontWeight: "bold", fontSize: 16 },
  errorButtons: { width: "100%", marginTop: 20 }
});