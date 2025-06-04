/**
 * Utilitários para formatação e manipulação de datas
 * Resolve problemas de timezone ao trabalhar com datas do banco de dados
 */

/**
 * Formata uma data do banco para o formato brasileiro (dd/mm/aaaa)
 * Resolve problemas de timezone ao adicionar horário local
 * @param dataStr - String da data no formato 'YYYY-MM-DD'
 * @returns Data formatada como 'dd/mm/aaaa'
 */
export const formatarDataBR = (dataStr: string): string => {
    if (!dataStr) return '-';
    
    // Adiciona 'T00:00:00' para evitar problemas de timezone
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };
  
  /**
   * Formata uma data do banco para formato brasileiro com horário
   * @param dataStr - String da data/hora ISO
   * @returns Data formatada como 'dd/mm/aaaa HH:mm'
   */
  export const formatarDataHoraBR = (dataStr: string): string => {
    if (!dataStr) return '-';
    
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR');
  };
  
  /**
   * Converte uma data do input HTML (YYYY-MM-DD) para objeto Date seguro
   * @param dataStr - String da data no formato 'YYYY-MM-DD'
   * @returns Objeto Date com timezone local
   */
  export const converterDataInput = (dataStr: string): Date => {
    return new Date(dataStr + 'T00:00:00');
  };
  
  /**
   * Formata valor monetário para Real Brasileiro
   * @param valor - Valor numérico
   * @returns Valor formatado como 'R$ 1.234,56'
   */
  export const formatarValorBR = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  /**
   * Obtém a data atual no formato YYYY-MM-DD (para inputs date)
   * @returns Data atual no formato aceito por inputs HTML
   */
  export const obterDataHoje = (): string => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };
  
  /**
   * Calcula diferença em dias entre duas datas
   * @param dataInicio - Data inicial
   * @param dataFim - Data final
   * @returns Número de dias de diferença
   */
  export const calcularDiferencaDias = (dataInicio: string, dataFim: string): number => {
    const inicio = converterDataInput(dataInicio);
    const fim = converterDataInput(dataFim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  /**
   * Verifica se uma data está dentro de um período
   * @param data - Data a ser verificada
   * @param dataInicio - Data inicial do período (opcional)
   * @param dataFim - Data final do período (opcional)
   * @returns true se a data estiver no período
   */
  export const dataNoPeriodo = (
    data: string, 
    dataInicio?: string, 
    dataFim?: string
  ): boolean => {
    const dataVerificacao = converterDataInput(data);
    
    if (dataInicio) {
      const inicio = converterDataInput(dataInicio);
      if (dataVerificacao < inicio) return false;
    }
    
    if (dataFim) {
      const fim = converterDataInput(dataFim);
      if (dataVerificacao > fim) return false;
    }
    
    return true;
  };