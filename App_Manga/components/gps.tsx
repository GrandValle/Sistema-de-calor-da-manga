import * as Location from "expo-location";
import { Alert } from "react-native";
import { PontoLocalizacao } from "../data/daodaAvaliacao";

export const localizacaoPadrao = {
  latitude: -9.287495,
  longitude: -40.878419,
};

const criarPontoLocalizacao = (
  lote: string,
  {
    latitude,
    longitude,
    accuracy,
  }: { latitude: number; longitude: number; accuracy?: number },
): PontoLocalizacao => ({
  id: Date.now(),
  lote,
  latitude,
  longitude,
  accuracy: accuracy ?? 0,
  timestamp: Date.now(),
});

// 🚀 VARIÁVEIS GLOBAIS (A Catraca e a Permissão)
let permissaoGpsConcedida = false;
let buscandoGps = false; // Diz se o GPS já está ocupado
let cachePosicaoReal: PontoLocalizacao | null = null; // Guarda a última coordenada salva
let tempoUltimoCache = 0; // Guarda a hora da última busca

async function garantirPermissao() {
  if (permissaoGpsConcedida) return true;

  let { status } = await Location.getForegroundPermissionsAsync();

  if (status !== "granted") {
    const request = await Location.requestForegroundPermissionsAsync();
    status = request.status;
  }

  permissaoGpsConcedida = status === "granted";
  return permissaoGpsConcedida;
}

export async function Gps() {
  try {
    const temPermissao = await garantirPermissao();
    if (!temPermissao) {
      Alert.alert("Aviso", "Permissão de Localização negada!");
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      accuracy: loc.coords.accuracy,
      altitudeAccuracy: loc.coords.altitudeAccuracy,
      heading: loc.coords.heading,
      speed: loc.coords.speed,
      timestamp: loc.timestamp,
    };
  } catch (error) {
    console.warn("Erro ao obter GPS:", error);
    return null;
  }
}

export const obterLocalizacaoComTime = async (
  lote: string,
  timeoutMs = 6000,
): Promise<PontoLocalizacao> => {

  // 🛡️ BLINDAGEM 1: Se já tem alguém buscando o GPS agora, não peça de novo!
  if (buscandoGps) {
    console.log("GPS Ocupado! Reutilizando última posição para não travar o tablet...");
    return cachePosicaoReal || criarPontoLocalizacao(lote, { ...localizacaoPadrao, accuracy: 999 });
  }

  // 🛡️ BLINDAGEM 2: Se pegou o GPS faz menos de 10 segundos, reutiliza o valor!
  if (cachePosicaoReal && (Date.now() - tempoUltimoCache < 10000)) {
    return cachePosicaoReal;
  }

  buscandoGps = true; // Tranca a catraca (ninguém mais pede GPS até eu terminar)

  try {
    const temPermissao = await garantirPermissao();

    if (!temPermissao) {
      console.warn("Permissão negada, usando padrão.");
      return criarPontoLocalizacao(lote, { ...localizacaoPadrao, accuracy: 999 });
    }

    const posicaoPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao buscar localização")), timeoutMs),
    );

    const posicao: any = await Promise.race([posicaoPromise, timeoutPromise]);

    const novoPonto = criarPontoLocalizacao(lote, {
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      accuracy: posicao.coords.accuracy,
    });

    // Salva o sucesso no cache para os próximos 10 segundos
    cachePosicaoReal = novoPonto;
    tempoUltimoCache = Date.now();

    return novoPonto;

  } catch (error) {
    console.warn("Erro ou lentidão, usando Cache Antigo:", error);

    if (cachePosicaoReal) return cachePosicaoReal;

    try {
      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima && ultima.coords) {
        return criarPontoLocalizacao(lote, {
          latitude: ultima.coords.latitude,
          longitude: ultima.coords.longitude,
          accuracy: ultima.coords.accuracy ?? 0,
        });
      }
    } catch (e) { }

    return criarPontoLocalizacao(lote, { ...localizacaoPadrao, accuracy: 999 });
  } finally {
    buscandoGps = false; // Libera a catraca no final
  }
};