// src/app/services/usuario.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:8080/Projeto_Consisa-1.0-SNAPSHOT/api/usuarios'; 

  constructor(private http: HttpClient) { }

  getUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  createUser(nome: string): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, { nome: nome });
  }
}