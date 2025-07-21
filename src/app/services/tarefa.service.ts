// src/app/services/tarefa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarefa } from '../models/tarefa.model';
import { Usuario } from '../models/usuario.model'; // Se usar para tipagem do responsável

@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private apiUrl = 'http://localhost:8080/Projeto_Consisa-1.0-SNAPSHOT/api/tarefas';

  constructor(private http: HttpClient) { }

  // Exemplo de busca de todas as tarefas (se você tiver)
  buscarTodasTarefas(): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(this.apiUrl);
  }

  // Método para criar uma nova tarefa (ou subtarefa)
  criarTarefa(tarefa: Tarefa): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.apiUrl, tarefa);
  }

  // Método para buscar subtarefas de uma tarefa pai
  getTarefasFilhas(tarefaPaiId: string): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(`${this.apiUrl}/${tarefaPaiId}/subtarefas`);
  }

  // Método para deletar uma tarefa
  deleteTask(tarefaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tarefaId}`);
  }

  // --- MÉTODOS PATCH ESPECÍFICOS ---

  // PATCH para atualizar o nome da tarefa
  atualizarNomeTarefa(idTarefa: string, novoNome: string): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/nome`;
    const body = { nomeTarefa: novoNome };
    return this.http.patch<Tarefa>(url, body);
  }

  // PATCH para atualizar a data de início da tarefa
  atualizarDataInicioTarefa(idTarefa: string, novaDataInicio: string | null): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/data-inicio`;
    const body = { dataInicio: novaDataInicio };
    return this.http.patch<Tarefa>(url, body);
  }

  // PATCH para atualizar a data de fim da tarefa
  atualizarDataFimTarefa(idTarefa: string, novaDataFim: string | null): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/data-fim`;
    const body = { dataFim: novaDataFim };
    return this.http.patch<Tarefa>(url, body);
  }

  // PATCH para atualizar o status da tarefa
  atualizarStatusTarefa(idTarefa: string, novoStatus: string): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/status`;
    const body = { statusTarefa: novoStatus };
    return this.http.patch<Tarefa>(url, body);
  }

  // PATCH para atualizar o usuário responsável da tarefa
  atualizarUsuarioResponsavel(idTarefa: string, idUsuarioResponsavel: string | null | undefined): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/usuario-responsavel`;
    // O backend espera um UsuarioResponseDTO com o ID, então prepare o payload:
    const body = { idUsuarioResponsavel: idUsuarioResponsavel };
    return this.http.patch<Tarefa>(url, body);
  }

  // Se você ainda tiver um updateTarefaPartial genérico, ele pode ser assim:
  // updateTarefaPartial(idTarefa: string, payload: any): Observable<Tarefa> {
  //   const url = `${this.apiUrl}/${idTarefa}`;
  //   return this.http.patch<Tarefa>(url, payload);
  // }
}