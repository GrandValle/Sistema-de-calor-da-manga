import { useState, useCallback } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ApiService } from "../../services/api";

export default function UpdateScreen() {
  const [loading, setLoading] = useState(false);
  const [qtdPendentes, setQtdPendentes] = useState(0);

  const carregarPendencias = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysPacotes = allKeys.filter((key) => key.startsWith("@pacote_"));
      setQtdPendentes(keysPacotes.length);
    } catch (e) {
      console.log(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPendencias();
    }, [carregarPendencias]),
  );

  const processarEnvioPacotes = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysPacotes = allKeys.filter((key) => key.startsWith("@pacote_"));

      if (keysPacotes.length === 0) return;

      let pacotesSincronizados = 0;

      // Loop cirúrgico: Processa UM por vez
      for (const key of keysPacotes) {
        const json = await AsyncStorage.getItem(key);
        
        if (json) {
          const pacote = JSON.parse(json);

          // Envia apenas o pacote atual (colocado em array caso sua API exija esse formato)
          const resposta = await ApiService.sincronizarPacote([pacote]);

          // Se a API confirmar o recebimento deste pacote específico
          if (resposta) {
            // Remove ele do celular para liberar espaço instantaneamente
            await AsyncStorage.removeItem(key);
            pacotesSincronizados++;
            
            // Bônus: Atualiza a tela em tempo real para o usuário ver os números caindo
            setQtdPendentes((prev) => prev - 1);
          }
        }
      }

      // Finaliza o fluxo mostrando o total que deu certo
      if (pacotesSincronizados > 0) {
        Alert.alert("✅ Sucesso", `Sincronizados: ${pacotesSincronizados} pacotes.`);
      }

    } catch (error: any) {
      // Se a internet cair no meio do loop, ele para, mas os que já foram enviados não são perdidos!
      Alert.alert("❌ Falha Parcial ou Total", error.message);
    }
  };

  const handleSync = async () => {
    if (loading) return;

    if (qtdPendentes === 0) {
      Alert.alert("Tudo certo!", "Não há novos registros para sincronizar.");
      return;
    }

    setLoading(true);

    try {
      // Verifica conexão (Opcional no emulador)
      // const state = await NetInfo.fetch();
      // if (!state.isConnected) { ... }

      await processarEnvioPacotes();
    } finally {
      setLoading(false);
      carregarPendencias();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 40 }}>📦</Text>
        </View>

        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.subtitle}>
          Envie os pacotes de avaliação offline para o sistema central.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Pacotes Pendentes</Text>
          <Text
            style={[
              styles.statusValue,
              { color: qtdPendentes > 0 ? "#ef4444" : "#10b981" },
            ]}
          >
            {qtdPendentes}
          </Text>
          <Text style={styles.statusHelper}>
            {qtdPendentes > 0
              ? "Dados aguardando envio."
              : "Tudo sincronizado."}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSync}
          disabled={loading || qtdPendentes === 0}
          style={({ pressed }) => [
            styles.button,
            (loading || qtdPendentes === 0) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {qtdPendentes === 0 ? "Atualizado" : "Sincronizar Pacotes"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#eff6ff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusLabel: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusHelper: {
    fontSize: 14,
    color: "#64748b",
  },

  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
