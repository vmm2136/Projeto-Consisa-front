// src/app/services/tarefa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarefa, TarefaResponseDTO } from '../models/tarefa.model';
import { Usuario } from '../models/usuario.model'; // Se usar para tipagem do responsável

@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private apiUrl = 'http://localhost:8080/Projeto_Consisa-1.0-SNAPSHOT/api/tarefas';

  constructor(private http: HttpClient) { }

  buscarTodasTarefas(): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(this.apiUrl);
  }

  criarTarefa(tarefa: Tarefa): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.apiUrl, tarefa);
  }

  getTarefasFilhas(tarefaPaiId: string): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(`${this.apiUrl}/${tarefaPaiId}/subtarefas`);
  }

  deleteTask(tarefaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tarefaId}`);
  }

  atualizarNomeTarefa(idTarefa: string, novoNome: string): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/nome`;
    const body = { nomeTarefa: novoNome };
    return this.http.patch<Tarefa>(url, body);
  }

  atualizarDataInicioTarefa(idTarefa: string, novaDataInicio: string | null): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/data-inicio`;
    const body = { dataInicio: novaDataInicio };
    return this.http.patch<Tarefa>(url, body);
  }

  atualizarDataFimTarefa(idTarefa: string, novaDataFim: string | null): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/data-fim`;
    const body = { dataFim: novaDataFim };
    return this.http.patch<Tarefa>(url, body);
  }

  atualizarStatusTarefa(idTarefa: string, novoStatus: string): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/status`;
    const body = { statusTarefa: novoStatus };
    return this.http.patch<Tarefa>(url, body);
  }

  atualizarUsuarioResponsavel(idTarefa: string, idUsuarioResponsavel: string | null | undefined): Observable<Tarefa> {
    const url = `${this.apiUrl}/${idTarefa}/usuario-responsavel`;
    const body = { idUsuarioResponsavel: idUsuarioResponsavel };
    return this.http.patch<Tarefa>(url, body);
  }

  buscarTarefasFilhas(tarefaPaiId: string): Observable<TarefaResponseDTO[]> {
    return this.http.get<TarefaResponseDTO[]>(`${this.apiUrl}/${tarefaPaiId}/filhas`);
  }
}