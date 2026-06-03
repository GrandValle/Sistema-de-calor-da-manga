import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import debounce from "lodash/debounce";
import { quadrantes, ramos } from "../data/daodaAvaliacao";

interface OrgaoItemProps {
  item: any;
  itemSelecionado: any;
  plantaSelecionada: number;
  handleCheckbox: (planta: number, itemNome: string, orgaoNome: string) => void;
  getCheckboxValue: (planta: number, itemNome: string, orgaoNome: string) => boolean;
  handleChange: (planta: number, itemNome: string, orgaoNome: string, q: string, r: string | undefined, localItem: string | undefined, extra: any, nota: number, cc: string) => void;
  getNota: (planta: number, itemNome: string, orgaoNome: string, q: string, r: string | undefined, localItem: string | undefined, cc: string) => number;
  isSaving: boolean;
  centroCustoSelecionado: string;
  resetKey: number;
}

const OrgaoItem = React.memo(
  ({
    item: orgao,
    itemSelecionado,
    plantaSelecionada,
    handleCheckbox,
    getCheckboxValue,
    handleChange,
    getNota,
    isSaving,
    centroCustoSelecionado,
    resetKey,
  }: OrgaoItemProps) => {
    const locais = itemSelecionado.locais?.length ? itemSelecionado.locais : [undefined];

    const contextoKey = useMemo(
      () => `${resetKey}|${plantaSelecionada}|${itemSelecionado.nome}|${orgao.nome}|${JSON.stringify(locais)}|${centroCustoSelecionado}`,
      [resetKey, plantaSelecionada, itemSelecionado.nome, orgao.nome, locais, centroCustoSelecionado],
    );

    // 🚀 LÓGICA DE DETECÇÃO DA COCHONILHA (A Regra de Ouro)
    const isCochonilha = [
      "COCHONILHA",
      "COCHONILHA CARAPAÇA",
      "COCHONILHA CABEÇA DE PREGO",
      "COCHONILHA ESTRELA"
    ].includes(itemSelecionado.nome?.toUpperCase());

    const isFrutoOuCacho = orgao.nome?.toUpperCase().includes("FRUTO") || orgao.nome?.toUpperCase().includes("CACHO");

    // 1. Define se vai mostrar R1 e R2 ou "Nota Geral"
    let precisaRamoEfetivo = orgao.precisaRamo;
    if (isCochonilha && isFrutoOuCacho) {
      precisaRamoEfetivo = false; // Arranca o R1 e R2 do Fruto na Cochonilha
    }

    // 2. Define a Nota Máxima visível nos botões (0 a X)
    let notaMaxEfetiva = Number(orgao.notaMax) || 0;
    if (isCochonilha) {
      if (isFrutoOuCacho) {
        notaMaxEfetiva = 1;
      } else if (orgao.nome?.toUpperCase().includes("FOLHA")) {
        notaMaxEfetiva = 1;
      } else if (orgao.nome?.toUpperCase().includes("RAMO")) {
        notaMaxEfetiva = 2;
      } else {
        notaMaxEfetiva = Number(orgao.notaMax) || 0;
      }
    }

    const notasDoBanco = useMemo(() => {
      const notas: Record<string, number> = {};
      locais.forEach((localItem: any) => {
        quadrantes.forEach((q) => {
          if (precisaRamoEfetivo) {
            ramos.forEach((r) => {
              const key = `${localItem ?? "single"}-${q}-${r}`;
              notas[key] = getNota(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, r, localItem, centroCustoSelecionado);
            });
          } else {
            const key = `${localItem ?? "single"}-${q}-single`;
            notas[key] = getNota(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, undefined, localItem, centroCustoSelecionado);
          }
        });
      });
      return notas;
    }, [plantaSelecionada, itemSelecionado.nome, orgao.nome, locais, centroCustoSelecionado, getNota, precisaRamoEfetivo]);

    const [notasLocais, setNotasLocais] = useState<Record<string, number>>(notasDoBanco);

    useEffect(() => {
      setNotasLocais(notasDoBanco);
    }, [contextoKey]);

    const opcoes = useMemo(() => Array.from({ length: notaMaxEfetiva + 1 }, (_, i) => i), [notaMaxEfetiva]);

    const debouncedHandleChange = useMemo(
      () =>
        debounce((planta, itemNome, orgaoNome, q, r, localItem, nota) => {
          handleChange(planta, itemNome, orgaoNome, q, r, localItem, undefined, nota, centroCustoSelecionado);
        }, 300),
      [handleChange, centroCustoSelecionado],
    );

    useEffect(() => {
      return () => { debouncedHandleChange.flush(); };
    }, [debouncedHandleChange]);

    if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
      return (
        <View style={styles.cardContainer}>
          <Pressable
            onPress={() => handleCheckbox(plantaSelecionada, itemSelecionado.nome, orgao.nome)}
            disabled={isSaving}
            style={styles.checkboxRow}
          >
            <Text style={styles.checkboxLabel}>{orgao.nome}</Text>
            <View style={[styles.checkboxBase, getCheckboxValue(plantaSelecionada, itemSelecionado.nome, orgao.nome) && styles.checkboxChecked]}>
              {getCheckboxValue(plantaSelecionada, itemSelecionado.nome, orgao.nome) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </Pressable>
        </View>
      );
    }

    const renderSelect = (key: string, label: string, q: string, r?: string, localItem?: string) => {
      const valorAtual = notasLocais[key] ?? 0;
      return (
        <View key={key} style={styles.inputRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.notaBtnScroll}
            contentContainerStyle={styles.notaBtnContainer}
            keyboardShouldPersistTaps="handled"
          >
            {opcoes.map((v) => (
              <Pressable
                key={v}
                onPress={() => {
                  if (isSaving) return;
                  setNotasLocais((prev) => ({ ...prev, [key]: v }));
                  debouncedHandleChange(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, r, localItem, v);
                }}
                style={[styles.notaBtn, valorAtual === v && styles.notaBtnSelected, isSaving && styles.notaBtnDisabled]}
              >
                <Text style={[styles.notaBtnText, valorAtual === v && styles.notaBtnTextSelected]}>{v}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    };

    const renderRamos = (q: string, localItem?: string) => {
      if (!precisaRamoEfetivo) {
        const key = `${localItem ?? "single"}-${q}-single`;
        return renderSelect(key, "Nota Geral", q, undefined, localItem);
      }
      return ramos.map((r) => {
        const key = `${localItem ?? "single"}-${q}-${r}`;
        return renderSelect(key, r, q, r, localItem);
      });
    };

    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{orgao.nome}</Text>
          <Text style={styles.maxNotaBadge}>Max: {notaMaxEfetiva}</Text>
        </View>

        {locais.map((localItem: any, idx: number) => (
          <View key={localItem ?? idx} style={styles.locationContainer}>
            {localItem && (
              <View style={styles.localBadge}>
                <Text style={styles.localTitle}>{localItem}</Text>
              </View>
            )}
            <View style={styles.gridContainer}>
              {quadrantes.map((q) => (
                <View key={q} style={styles.quadranteBox}>
                  <Text style={styles.quadranteHeader}>{q}</Text>
                  {renderRamos(q, localItem)}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  },
);

export default OrgaoItem;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", flex: 1 },
  maxNotaBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationContainer: { marginBottom: 10 },
  localBadge: {
    backgroundColor: "#e0f2fe",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  localTitle: { fontSize: 14, fontWeight: "700", color: "#0369a1" },
  gridContainer: { gap: 12 },
  quadranteBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fafafa",
  },
  quadranteHeader: { fontSize: 16, fontWeight: "800", color: "#334155", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  inputLabel: { fontSize: 15, fontWeight: "600", color: "#475569", marginRight: 8 },
  notaBtnScroll: { flexShrink: 1 },
  notaBtnContainer: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  notaBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  notaBtnSelected: { backgroundColor: "#10b981", borderColor: "#059669" },
  notaBtnDisabled: { opacity: 0.5 },
  notaBtnText: { fontSize: 15, fontWeight: "700", color: "#475569" },
  notaBtnTextSelected: { color: "#ffffff" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  checkboxLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  checkboxBase: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  checkmark: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});