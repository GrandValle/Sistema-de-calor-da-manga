# Monitoramento de Pragas e Doenças

GrandValle Monitor é uma aplicação móvel desenvolvida em React Native (Expo) para auxiliar agrônomos e técnicos no monitoramento fitossanitário de pomares de manga. O aplicativo permite coleta offline, cálculo automático de infestação e sincronização inteligente com a base de dados central.

## Funcionalidades Principais

### Coleta de Dados (Offline-First)
- Seleção de Centros de custos e pontos georreferenciados.  
- Suporte a múltiplas pragas/doenças por planta  
- Captura automática do GPS  
- Indicadores visuais de status da planta  

### Inteligência e Cálculos

- Análise separada para cada doença registrada  

### Sincronização Inteligente (Smart Sync)
- Divisão automática de registros complexos em múltiplos pacotes simples  
- Conversão ID → Nome da doença  
- Sanitização de dados antes do envio  

### Relatórios e Histórico
- Edição de registros antigos  
- Geração de PDF com:
  - resumo de infestação por válvula  
  - detalhamento por planta  
  - assinatura do responsável técnico  
- Envio automático por e-mail  

## Tecnologias Utilizadas
- React Native, Expo  
- TypeScript  
- AsyncStorage (offline)  
- Expo Location (GPS)  
- Expo Print (PDF)  
- Expo Mail Composer  
- StyleSheet e DropDownPicker  

## Estrutura de Dados (Core)

```ts
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
}

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
};
```
## Como Funciona o fluxo de dados
1. Identificação do Evento: O app registra a observação única pela chave: Planta + Órgão + Doença + CentroCusto. <br></br>
2.Criação do Pacote: O aplicativo coleta uma lista de Registros (dados da sessão) no formato JSON.<br></br>
3.Arquivamento Local: A função salvarAvaliacoes ADICIONA a nova lista de registros aos dados antigos no armazenamento local.<br></br>
4.Sincronização Final: O servidor recebe o pacote, e cada Registro se torna uma linha separada e completa na base de dados(1 observação = 1 linha).

## Instalação e Execução

### Clonar o repositório
```bash
# Baixar o projeto
$ git clone https://github.com/eduGrandV/fitosanitarioApp_Manga

# Entrar no diretório
cd ....
````
Instalar dependências:
```bash
# Instalação das dependências
$ npm install
```


