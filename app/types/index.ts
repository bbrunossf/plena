export interface Pessoa {
    id: Int16Array;
    nome: string;
    email: string;
    funcao: string;
    ativo: number;
    //hourlyRate: number;
  }
  
  export interface Obra {
    id: Int16Array;
    codigo: string;
    nome: string;
    cliente: string;    
  }
  
  export interface Categoria {
    id: Int16Array;
    projectId: string;    
    nome: 'execução' | 'revisão' | 'conferência'| 'orçamento'| 'planejamento';
  }
  
  export interface TipoTarefa {
    id: Int16Array;    
    nome: 'modelo de cálculo' | 'desenho 2d executivo' | 'desenho 2d detalhamento'| 'desenho 3d executivo'| 'desenho 3d detalhamento'| 'reunião'| 'visita técnica'| 'Análise preliminar de documentos'| 'planejamento';
  }

  