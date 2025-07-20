export interface Tarefa {
  id?: string;
  nomeTarefa: string;
  statusTarefa?: string;
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string; 
  subtarefas?: Subtarefa[]; 
  tarefaPai?: Tarefa; 
}

export interface Subtarefa {
  id?: string;
  nomeTarefa: string;
  statusTarefa?: string;
  responsavel?: string;
}