import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarefa } from '../models/tarefa.model';

@Injectable({
    providedIn: 'root'
})
export class TarefaService {
    private apiUrl = 'http://localhost:8080/Projeto_Consisa-1.0-SNAPSHOT/api/tarefas';

    constructor(private http: HttpClient) { }

    buscarTodasTarefas(): Observable<Tarefa[]> {
        return this.http.get<Tarefa[]>(this.apiUrl);
    }

    criarTarefa(novaTarefa: Tarefa): Observable<Tarefa> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<Tarefa>(this.apiUrl, novaTarefa, { headers });
    }

    updateTarefaPartial(id: string, partialData: any): Observable<Tarefa> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.patch<Tarefa>(`${this.apiUrl}/${id}`, partialData, { headers });
    }

    getTarefaById(id: string): Observable<Tarefa> {
        return this.http.get<Tarefa>(`${this.apiUrl}/${id}`);
    }

    getTarefasFilhas(tarefaPaiId: string): Observable<Tarefa[]> {
        return this.http.get<Tarefa[]>(`${this.apiUrl}/${tarefaPaiId}/filhas`);
    }

    deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}