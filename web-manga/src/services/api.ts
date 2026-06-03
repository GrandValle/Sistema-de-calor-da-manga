import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.253.18:3005/api",
});

export const getSessoes = async () => {
  try {
    const response = await api.get("/listar");
    console.log("getSessoes - dados recebidos:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dados do backend:", error);
    return [];
  }
};

export const enviarPacote = async (pacote: any) => {
  try {
    console.log("enviarPacote - pacote recebido:", pacote);
    const response = await api.post("/sincronizar-pacote", [pacote]);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar registro:", error);
    throw error;
  }
};
