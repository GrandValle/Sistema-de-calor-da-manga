import {
  FlatList,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
import {
  DoencaPraga,
  doencasPragas,
  LISTA_FAZENDAS,
  locaPlanta,
  Registro,
} from "../data/daodaAvaliacao";

// ---------------------------------------------------------------------------
// CustomSelect — dropdown 100% JS, sem componentes nativos
// ---------------------------------------------------------------------------
interface SelectItem {
  label: string;
  value: any;
  color?: string;
}

interface CustomSelectProps {
  selectedValue: any;
  onValueChange: (value: any) => void;
  items: SelectItem[];
  wrapperStyle?: StyleProp<ViewStyle>;
  enabled?: boolean;
}

const CustomSelect = ({
  selectedValue,
  onValueChange,
  items,
  wrapperStyle,
  enabled = true,
}: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find((i) => i.value === selectedValue);

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerWrapper, wrapperStyle]}
        onPress={() => {
          if (enabled) setOpen(true);
        }}
        activeOpacity={enabled ? 0.7 : 1}
      >
        <View style={styles.selectRow}>
          <Text
            style={[styles.selectText, !selectedItem && { color: "#666" }]}
            numberOfLines={1}
          >
            {selectedItem ? selectedItem.label : (items[0]?.label ?? "")}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalCard}>
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item.value === selectedValue && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: item.color ?? "#000" },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
// ---------------------------------------------------------------------------

export const useAvaliacaoScreenState = (numeroDePlantas: number) => {
  const [avaliacoes, setAvaliacoes] = useState<Registro[]>([]);
  const [plantaSelecionada, setPlantaSelecionada] = useState<number>(1);
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>(
    doencasPragas[0].nome,
  );
  const [nomeAvaliador, setNomeAvaliador] = useState<string>("");

  const [fazendaSelecionada, setFazendaSelecionada] = useState<string>("");
  const [local, setLocal] = useState<string>();
  const [centroCustoSelecionado, setCentroCustoSelecionado] =
    useState<string>("");

  const plantas = useMemo(
    () => Array.from({ length: numeroDePlantas }, (_, i) => i + 1),
    [numeroDePlantas],
  );

  const lotesFiltrados = useMemo(() => {
    if (!fazendaSelecionada) return [];
    return locaPlanta.filter((item) => item.name.includes(fazendaSelecionada));
  }, [fazendaSelecionada]);

  const handleFazendaChange = useCallback((novaFazenda: string) => {
    setFazendaSelecionada(novaFazenda);
    setLocal(undefined);
    setCentroCustoSelecionado("");
    setAvaliacoes([]);
  }, [setAvaliacoes]);

  const handleLocalChange = useCallback((novoLocal: string) => {
    setLocal(novoLocal);
    const itemSelecionado = locaPlanta.find((item) => item.name === novoLocal);
    setCentroCustoSelecionado(
      itemSelecionado ? itemSelecionado.centroCusto : "",
    );
    setAvaliacoes([]);
  }, [setAvaliacoes]);

  return {
    avaliacoes,
    setAvaliacoes,
    plantaSelecionada,
    setPlantaSelecionada,
    filtroSelecionado,
    setFiltroSelecionado,
    nomeAvaliador,
    setNomeAvaliador,
    local,
    setLocal,
    centroCustoSelecionado,
    setCentroCustoSelecionado,
    plantas,
    handleLocalChange,
    fazendaSelecionada,
    handleFazendaChange,
    lotesFiltrados,
    listaFazendas: LISTA_FAZENDAS,
  };
};

export const useAvaliacaoCallbacks = ({
  setPlantaSelecionada,
  setFiltroSelecionado,
}: {
  setPlantaSelecionada: (p: number) => void;
  setFiltroSelecionado: (f: string) => void;
}) => {
  const handlePlantaChange = useCallback(
    (novaPlanta: number) => setPlantaSelecionada(novaPlanta),
    [setPlantaSelecionada],
  );

  const handleFiltroChange = useCallback(
    (novaDoenca: string) => setFiltroSelecionado(novaDoenca),
    [setFiltroSelecionado],
  );

  return { handlePlantaChange, handleFiltroChange };
};

interface RenderHeaderProps {
  lote: string;
  plantas: number[];
  plantaSelecionada: number;
  handlePlantaChange: (p: number) => void;
  local?: string;
  handleLocalChange: (l: string) => void;
  filtroSelecionado: string;
  handleFiltroChange: (f: string) => void;
  nomeAvaliador: string;
  setNomeAvaliador: (v: string) => void;
  setAvaliacoes: (r: Registro[]) => void;
  centroCustoSelecionado: string;

  fazendaSelecionada: string;
  handleFazendaChange: (f: string) => void;
  lotesFiltrados: any[];
  listaFazendas: typeof LISTA_FAZENDAS;
}

export const RenderHeader = ({
  lote,
  plantas,
  plantaSelecionada,
  handlePlantaChange,
  local,
  handleLocalChange,
  filtroSelecionado,
  handleFiltroChange,
  nomeAvaliador,
  setNomeAvaliador,
  fazendaSelecionada,
  handleFazendaChange,
  lotesFiltrados,
  listaFazendas,
}: RenderHeaderProps) => {
  const itemSelecionado = useMemo(
    () => doencasPragas.find((d) => d.nome === filtroSelecionado),
    [filtroSelecionado],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Avaliação de Quadrantes</Text>
        <Text style={styles.headerSubtitle}>
          Lote: <Text style={styles.loteHighlight}>{lote || "---"}</Text>
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nome do Avaliador 👤</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome..."
            placeholderTextColor="#666"
            value={nomeAvaliador}
            onChangeText={setNomeAvaliador}
          />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>1. Selecione a Fazenda 🚜</Text>
        <CustomSelect
          selectedValue={fazendaSelecionada}
          onValueChange={handleFazendaChange}
          wrapperStyle={{ borderColor: "#2563EB", borderWidth: 2 }}
          items={[
            { label: "Toque para selecionar...", value: "", color: "#666" },
            ...listaFazendas.map((fazenda) => ({
              label: fazenda.label,
              value: fazenda.valor,
              color: "#000",
            })),
          ]}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>2. Selecione o Lote 📍</Text>
        <CustomSelect
          selectedValue={local}
          onValueChange={handleLocalChange}
          enabled={!!fazendaSelecionada}
          wrapperStyle={{
            opacity: fazendaSelecionada ? 1 : 0.5,
            backgroundColor: fazendaSelecionada ? "#fff" : "#f3f4f6",
          }}
          items={[
            {
              label: fazendaSelecionada
                ? "Escolha o lote..."
                : "Selecione a fazenda acima primeiro ⬆️",
              value: undefined,
              color: "#666",
            },
            ...lotesFiltrados.map((d) => ({
              label: d.name,
              value: d.name,
              color: "#000",
            })),
          ]}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.rowContainer}>
        <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Planta 🌱</Text>
          <CustomSelect
            selectedValue={plantaSelecionada}
            onValueChange={handlePlantaChange}
            items={(plantas ?? []).map((p) => ({
              label: `P${p}`,
              value: p,
              color: "#000",
            }))}
          />
        </View>

        <View style={[styles.fieldContainer, { flex: 1 }]}>
          <Text style={styles.label}>Praga/Doença 🔍</Text>
          <CustomSelect
            selectedValue={filtroSelecionado}
            onValueChange={handleFiltroChange}
            items={doencasPragas.map((d) => ({
              label: d.nome,
              value: d.nome,
              color: "#000",
            }))}
          />
        </View>
      </View>

      {itemSelecionado && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            <Text style={{ fontWeight: "bold" }}>{itemSelecionado.nome}</Text> —
            Planta {plantaSelecionada}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  headerContainer: {
    alignItems: "center",
    marginVertical: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  loteHighlight: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    height: 50,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  pickerWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    color: "#000000",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#000000",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    width: "80%",
    maxHeight: 300,
  },
  modalOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionSelected: {
    backgroundColor: "#e8f0fe",
  },
  modalOptionText: {
    fontSize: 16,
  },
  statusCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    color: "#000000",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
});
