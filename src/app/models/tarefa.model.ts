import { Usuario } from "./usuario.model";

export interface Tarefa {
  id?: string;
  nomeTarefa: string;
  statusTarefa?: string;
  dataInicio?: string;
  dataFim?: string;
  Usuario?: Usuario | null | undefined; 
  tarefaPai?: Tarefa; 
  tarefasFilhas?: Tarefa[];
}

export interface Subtarefa {
  id?: string;
  nomeTarefa: string;
  statusTarefa?: string;
  responsavel?: string;
}

export interface TarefaResponseDTO {
  id: string;
  nomeTarefa: string;
  statusTarefa: string;
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string; 
  responsavelId?: string; 
  idTarefaPai?: string; 
  subtarefas?: TarefaResponseDTO[]; 
}