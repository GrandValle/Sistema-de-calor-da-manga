const BASE_URL_EMULADOR = "http://10.0.2.2:3004/api";

//const BASE_URL_FISICO = "http://localhost:3005/api"; minha maquinha.
const BASE_URL_FISICO = "http://192.168.253.18:3005/api";


const BASE_URL = BASE_URL_FISICO;

const post = async (endpoint: string, dados: any) => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`📡 Enviando para: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const erroTexto = await response.text();
      throw new Error(`Erro ${response.status}: ${erroTexto}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const ApiService = {
  sincronizarPacote: async (listaPacotes: any[]) => {
    return await post("/sincronizar-pacote", listaPacotes);
  },

  sincronizarRelatorio: async (dados: any) => {
    return await post("/sincronizar-relatorio", dados);
  },

  sincronizarAvaliacoes: async (dados: any) => {
    return await post("/sincronizar", dados);
  },
};
