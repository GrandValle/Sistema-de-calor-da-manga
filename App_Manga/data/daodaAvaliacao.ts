// Tipos de Dados
export type Registro = {
  id: number;
  planta: number;
  doencaOuPraga: string;
  orgao: string;
  quadrante?: string;
  ramo?: string;
  local?: string | PontoLocalizacao;
  numeroLocal?: number | null;
  nota?: number;
  lote: string;
  centroCusto: string;
  criadoEm: string;
  localId?: number;
  identificadorDeLocal?: string | null;
  nomeAvaliador?: string;
};

export type Orgao = {
  nome: string;
  notaMax: number;
  precisaRamo?: boolean;
};

export type DoencaPraga = {
  nome: string;
  tipo: "doenca" | "praga";
  orgaos: Orgao[];
  locais?: string[];
  avaliacoesExtras?: string[];
  observacoes?: boolean;
};

export interface LocalPlantaItem {
  id: number | string;
  name: string;
  centroCusto: string;
}

export interface Orgao2 {
  nome: string;
  totalNotas?: number;
  porcentagem?: number;
  totalBordadura?: number;
  totalArea?: number;
  porcentagemBordadura?: number;
  porcentagemArea?: number;
  porcentagemMedia?: number;
  grupoPorLocal?: Record<string, Record<string, Record<string, number[]>>>;
}

export interface ItemResumo {
  nome: string;
  tipo: "doenca" | "praga";
  percentualComposto?: number;
  orgaos?: Orgao2[];
}

export type PontoLocalizacao = {
  id: number;
  lote: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | undefined;
};

// Dados Constantes
export const bordadura = Array.from({ length: 4 }, (_, i) => i + 1);
export const areaInterna = Array.from({ length: 6 }, (_, i) => i + 1);
export const ramos = ["R1", "R2"];
export const quadrantes = ["Q1", "Q2", "Q3", "Q4"];

export const LISTA_FAZENDAS = [
  { label: "Fortaleza 1 (F1)", valor: "GV-F1" },
  { label: "Fortaleza 2 (F2)", valor: "GV-F2" },
  { label: "Fortaleza 3 (F3)", valor: "GV-F3" },
  { label: "Fortaleza 5 (F5)", valor: "GV-F5" },
  { label: "Boa Esperança", valor: "GV-BE" },
  { label: "Vale Serra", valor: "GV-VS" },
];

export const locaPlanta: LocalPlantaItem[] = [
  //  FORTALEZA F1
  { id: 1, name: "GV-F1 MANGA TOMMY 01", centroCusto: "1.5.1.01.01" },
  { id: 2, name: "GV-F1 MANGA PALMER 02", centroCusto: "1.5.1.01.02" },
  { id: 3, name: "GV-F1 MANGA PALMER 03", centroCusto: "1.5.1.01.03" },
  { id: 4, name: "GV-F1 MANGA PALMER 04.1", centroCusto: "1.5.1.01.04" },
  { id: 5, name: "GV-F1 MANGA KEITT 04.2", centroCusto: "1.5.1.01.05" },
  { id: 6, name: "GV-F1 MANGA PALMER 05", centroCusto: "1.5.1.01.06" },
  { id: 7, name: "GV-F1 MANGA TOMMY 06", centroCusto: "1.5.1.01.07" },
  { id: 8, name: "GV-F1 MANGA PALMER 07", centroCusto: "1.5.1.01.08" },
  { id: 9, name: "GV-F1 MANGA TOMMY 08", centroCusto: "1.5.1.01.09" },
  { id: 10, name: "GV-F1 MANGA TOMMY 09", centroCusto: "1.5.1.01.10" },
  { id: 11, name: "GV-F1 MANGA KEITT 10", centroCusto: "1.5.1.01.11" },
  { id: 12, name: "GV-F1 MANGA PALMER 11", centroCusto: "1.5.1.01.12" },
  { id: 13, name: "GV-F1 MANGA PALMER 12", centroCusto: "1.5.1.01.13" },
  { id: 14, name: "GV-F1 MANGA PALMER 13", centroCusto: "1.5.1.01.14" },
  { id: 15, name: "GV-F1 MANGA PALMER 14", centroCusto: "1.5.1.01.15" },
  { id: 16, name: "GV-F1 MANGA PALMER 15.1", centroCusto: "1.5.1.01.16" },
  { id: 17, name: "GV-F1 MANGA KEITT 15.2", centroCusto: "1.5.1.01.17" },
  { id: 18, name: "GV-F1 MANGA PALMER 16", centroCusto: "1.5.1.01.18" },
  { id: 19, name: "GV-F1 MANGA PALMER 17.1", centroCusto: "1.5.1.01.19" },
  { id: 20, name: "GV-F1 MANGA PALMER 17.2", centroCusto: "1.5.1.01.20" },
  { id: 21, name: "GV-F1 MANGA PALMER 18", centroCusto: "1.5.1.01.21" },
  { id: 22, name: "GV-F1 MANGA PALMER 19", centroCusto: "1.5.1.01.22" },
  { id: 23, name: "GV-F1 MANGA KENT 27", centroCusto: "1.5.1.01.23" },
  { id: 24, name: "GV-F1 MANGA KENT 31", centroCusto: "1.5.1.01.24" },
  { id: 25, name: "GV-F1 MANGA KENT 32", centroCusto: "1.5.1.01.25" },
  { id: 26, name: "GV-F1 MANGA KENT 33", centroCusto: "1.5.1.01.26" },
  { id: 27, name: "GV-F1 MANGA KENT 34", centroCusto: "1.5.1.01.27" },

  //  FORTALEZA F2
  { id: 28, name: "GV-F2 MANGA TOMMY 22.1", centroCusto: "1.5.1.02.01" },
  { id: 29, name: "GV-F2 MANGA PALMER 22.2", centroCusto: "1.5.1.02.02" },
  { id: 30, name: "GV-F2 MANGA TOMMY 23", centroCusto: "1.5.1.02.03" },
  { id: 31, name: "GV-F2 MANGA TOMMY 24", centroCusto: "1.5.1.02.04" },
  { id: 32, name: "GV-F2 MANGA PALMER 25", centroCusto: "1.5.1.02.05" },
  { id: 33, name: "GV-F2 MANGA TOMMY 26", centroCusto: "1.5.1.02.06" },
  { id: 34, name: "GV-F2 MANGA KEITT 28", centroCusto: "1.5.1.02.07" },
  { id: 35, name: "GV-F2 MANGA KEITT 29", centroCusto: "1.5.1.02.08" },
  { id: 36, name: "GV-F2 MANGA KEITT 30", centroCusto: "1.5.1.02.09" },

  //  FORTALEZA F3
  { id: 37, name: "GV-F3 MANGA KEITT 20", centroCusto: "1.5.1.03.01" },
  { id: 38, name: "GV-F3 MANGA PALMER 21", centroCusto: "1.5.1.03.02" },

  // --- FORTALEZA F5 ---
  { id: 39, name: "GV-F5.MANGA.KEITT.01.2", centroCusto: "1.5.1.05.01" },
  { id: 40, name: "GV-F5.MANGA.KEITT.02.4", centroCusto: "1.5.1.05.02" },
  { id: 41, name: "GV-F5.MANGA.KEITT.03.3", centroCusto: "1.5.1.05.03" },
  { id: 42, name: "GV-F5.MANGA.KENT.01.3", centroCusto: "1.5.1.05.04" },
  { id: 43, name: "GV-F5.MANGA.PALMER.01.6", centroCusto: "1.5.1.05.05" },

  //  BOA ESPERANÇA
  { id: 44, name: "GV-BE.PALMER.01", centroCusto: "8.4.1.01.01" },
  { id: 45, name: "GV-BE.PALMER.02", centroCusto: "8.4.1.01.02" },
  { id: 46, name: "GV-BE.PALMER.03", centroCusto: "8.4.1.01.03" },
  { id: 47, name: "GV-BE.PALMER.04", centroCusto: "8.4.1.01.04" },
  { id: 48, name: "GV-BE.PALMER.05", centroCusto: "8.4.1.01.05" },
  { id: 49, name: "GV-BE.PALMER.06", centroCusto: "8.4.1.01.06" },
  { id: 50, name: "GV-BE.PALMER.07", centroCusto: "8.4.1.01.07" },
  { id: 51, name: "GV-BE.PALMER.08", centroCusto: "8.4.1.01.08" },
  { id: 52, name: "GV-BE.PALMER.09", centroCusto: "8.4.1.01.09" },
  { id: 53, name: "GV-BE.PALMER.10", centroCusto: "8.4.1.01.10" },
  { id: 54, name: "GV-BE.PALMER.11", centroCusto: "8.4.1.01.11" },
  { id: 55, name: "GV-BE.PALMER.12", centroCusto: "8.4.1.01.12" },
  { id: 56, name: "GV-BE.PALMER.13", centroCusto: "8.4.1.01.13" },
  { id: 57, name: "GV-BE.PALMER.14", centroCusto: "8.4.1.01.14" },
  { id: 58, name: "GV-BE.PALMER.15", centroCusto: "8.4.1.01.15" },
  { id: 59, name: "GV-BE.PALMER.16", centroCusto: "8.4.1.01.16" },
  { id: 60, name: "GV-BE.PALMER.17", centroCusto: "8.4.1.01.17" },
  { id: 61, name: "GV-BE.MANGA.PRODUTIVA", centroCusto: "8.4.1.02.01" },

  // VALE SERRA

  // Manga Palmer
  { id: 62, name: "GV-VS.MANGA.PALMER.01", centroCusto: "9.4.1.01.01" },
  { id: 63, name: "GV-VS.MANGA.PALMER.02", centroCusto: "9.4.1.01.02" },
  { id: 64, name: "GV-VS.MANGA.PALMER.03", centroCusto: "9.4.1.01.03" },
  { id: 65, name: "GV-VS.MANGA.PALMER.04", centroCusto: "9.4.1.01.04" },
  // Manga Keitt 01
  { id: 66, name: "GV-VS.MANGA.KEITT.01", centroCusto: "9.4.1.01.05" },
  // Manga Tommy
  { id: 67, name: "GV-VS.MANGA.TOMMY.01", centroCusto: "9.4.1.01.06" },
  { id: 68, name: "GV-VS.MANGA.TOMMY.02", centroCusto: "9.4.1.01.07" },
  // Manga Kent
  { id: 69, name: "GV-VS.MANGA.KENT.01", centroCusto: "9.4.1.01.08" },
  { id: 70, name: "GV-VS.MANGA.KENT.02", centroCusto: "9.4.1.01.09" },
  { id: 71, name: "GV-VS.MANGA.KENT.03", centroCusto: "9.4.1.01.10" },
  { id: 72, name: "GV-VS.MANGA.KENT.04", centroCusto: "9.4.1.01.11" },
  { id: 73, name: "GV-VS.MANGA.KENT.05", centroCusto: "9.4.1.01.12" },
  { id: 74, name: "GV-VS.MANGA.KENT.06", centroCusto: "9.4.1.01.13" },
  { id: 75, name: "GV-VS.MANGA.KENT.07", centroCusto: "9.4.1.01.14" },
  { id: 76, name: "GV-VS.MANGA.KENT.08", centroCusto: "9.4.1.01.15" },
  { id: 77, name: "GV-VS.MANGA.KENT.09", centroCusto: "9.4.1.01.16" },
  { id: 78, name: "GV-VS.MANGA.KENT.10", centroCusto: "9.4.1.01.17" },
  { id: 79, name: "GV-VS.MANGA.KENT.11", centroCusto: "9.4.1.01.18" },
  { id: 80, name: "GV-VS.MANGA.KENT.12", centroCusto: "9.4.1.01.19" },
  { id: 81, name: "GV-VS.MANGA.KENT.13", centroCusto: "9.4.1.01.20" },
  { id: 82, name: "GV-VS.MANGA.KENT.14", centroCusto: "9.4.1.01.21" },
  // Manga Keitt 02-09
  { id: 83, name: "GV-VS.MANGA.KEITT.02", centroCusto: "9.4.1.01.22" },
  { id: 84, name: "GV-VS.MANGA.KEITT.03", centroCusto: "9.4.1.01.23" },
  { id: 85, name: "GV-VS.MANGA.KEITT.04", centroCusto: "9.4.1.01.24" },
  { id: 86, name: "GV-VS.MANGA.KEITT.05", centroCusto: "9.4.1.01.25" },
  { id: 87, name: "GV-VS.MANGA.KEITT.06", centroCusto: "9.4.1.01.26" },
  { id: 88, name: "GV-VS.MANGA.KEITT.07", centroCusto: "9.4.1.01.27" },
  { id: 89, name: "GV-VS.MANGA.KEITT.08", centroCusto: "9.4.1.01.28" },
  { id: 90, name: "GV-VS.MANGA.KEITT.09", centroCusto: "9.4.1.01.29" },
  // Goiaba
  { id: 91, name: "GV-VS.GOIABA.PALUMA.01", centroCusto: "9.4.1.02.01" },
  { id: 92, name: "GV-VS.GOIABA.PALUMA.02", centroCusto: "9.4.1.02.02" },
  { id: 93, name: "GV-VS.GOIABA.PALUMA.03", centroCusto: "9.4.1.02.03" },
  { id: 94, name: "GV-VS.GOIABA.PALUMA.04", centroCusto: "9.4.1.02.04" },
  { id: 95, name: "GV-VS.GOIABA.PALUMA.05", centroCusto: "9.4.1.02.05" },
  { id: 96, name: "GV-VS.GOIABA.PALUMA.06", centroCusto: "9.4.1.02.06" },
  // Abacate Serra I
  { id: 97, name: "GV-VS.ABACATE.HASS.01", centroCusto: "9.4.1.03.01" },
  { id: 98, name: "GV-VS.ABACATE.QUINTAL.01", centroCusto: "9.4.1.03.02" },
  { id: 99, name: "GV-VS.ABACATE.GEADA.01", centroCusto: "9.4.1.03.03" },
  { id: 100, name: "GV-VS.ABACATE.HASS.02", centroCusto: "9.4.1.03.04" },
  { id: 101, name: "GV-VS.ABACATE.HASS.03", centroCusto: "9.4.1.03.05" },
  { id: 102, name: "GV-VS.ABACATE.HASS.04", centroCusto: "9.4.1.03.06" },

  // Produtiva Geral
  { id: 103, name: "GV-VS.MANGA.PRODUTIVA", centroCusto: "9.4.1.04.01" },
];

export const doencasPragas: DoencaPraga[] = [
  {
    nome: "MORTE DESCENDENTE",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "RAMO", notaMax: 2, precisaRamo: false },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "OÍDIO",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MALFORMAÇÃO E MICROÁCARO",
    tipo: "doenca",
    orgaos: [
      { nome: "VEGETATIVA", notaMax: 2, precisaRamo: false },
      { nome: "FLORAL", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MANCHA ANGULAR",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "ANTRACNOSE",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MANCHA DE ALTERNARIA",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "TRIPES",
    tipo: "praga",
    orgaos: [
      { nome: "RAMO", notaMax: 2 },
      { nome: "INFLORESC.", notaMax: 1 },
      { nome: "FRUTO", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "PULGÃO",
    tipo: "praga",
    orgaos: [
      { nome: "BROTAÇÃO", notaMax: 2 },
      { nome: "INFLORESC.", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "CIGARRINHA",
    tipo: "praga",
    orgaos: [
      { nome: "FOLHA NOVA", notaMax: 2 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "LEPIDÓPTEROS",
    tipo: "praga",
    orgaos: [{ nome: "INFLORESC.", notaMax: 1 }],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "MOSQUINHA DA MANGA",
    tipo: "praga",
    orgaos: [
      { nome: "BROTAÇÃO", notaMax: 2 },
      { nome: "FOLHAS NOVAS", notaMax: 2 },
      { nome: "RAMO", notaMax: 2 },
      { nome: "INFLORESC.", notaMax: 1 },
      { nome: "FRUTO (chumbinho)", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
    avaliacoesExtras: ["1ª Av.", "2ª Av."],
  },

  {
    nome: "COCHONILHA",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA (Aulacaspis e Pseudaonidia)",
        notaMax: 1,
        precisaRamo: true,
      },
      { nome: "FRUTO (Pseudococus sp.)", notaMax: 1, precisaRamo: true },
      { nome: "FRUTO (Pseudaonidia tribitiformis)", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "COCHONILHA CARAPAÇA",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA",
        notaMax: 1,
        precisaRamo: true,
      },
      { nome: "FRUTO", notaMax: 1, precisaRamo: true },
      { nome: "RAMO", notaMax: 2 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "COCHONILHA CABEÇA DE PREGO",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA",
        notaMax: 1,
        precisaRamo: true,
      },
      { nome: "FRUTO", notaMax: 1, precisaRamo: true },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },

  {
    nome: "COCHONILHA ESTRELA",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA",
        notaMax: 1,
        precisaRamo: true,
      },
      { nome: "FRUTO", notaMax: 1, precisaRamo: true },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "Acaro Rajado",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA (Aulacaspis e Pseudaonidia)",
        notaMax: 2,
        precisaRamo: true,
      },
      { nome: "FRUTO", notaMax: 1, precisaRamo: true },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "Acaro Vermelho",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA (Aulacaspis e Pseudaonidia)",
        notaMax: 2,
        precisaRamo: true,
      },
      { nome: "FRUTO", notaMax: 1, precisaRamo: true },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "INIMIGOS NATURAIS",
    tipo: "praga",
    orgaos: [
      {
        nome: "BICHO LIXEIRO (Ovo)",
        notaMax: 0,
      },
      {
        nome: "BICHO LIXEIRO (Larva)",
        notaMax: 0,
      },
      {
        nome: "BICHO LIXEIRO (Adulto)",
        notaMax: 0,
      },
      {
        nome: "JOANINHA (Larva)",
        notaMax: 0,
      },
      {
        nome: "JOANINHA (Adulto)",
        notaMax: 0,
      },
      {
        nome: "ÁCARO PREDADOR",
        notaMax: 0,
      },
      {
        nome: "ARANHA",
        notaMax: 0,
      },
    ],
    observacoes: true,
  },
];
