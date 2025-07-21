// src/app/components/detalhes-tarefa/detalhes-tarefa.ts

import { Component, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef, Injectable, OnInit, OnChanges } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { Tarefa, Subtarefa } from '../../models/tarefa.model'; // Assumindo que Tarefa tem 'subtarefas?: Tarefa[]'
import { FormsModule } from '@angular/forms';
import { TarefaService } from '../../services/tarefa.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { catchError, of } from 'rxjs'; // Importar para tratamento de erros em Observables

@Injectable({
    providedIn: 'root'
})
@Component({
    selector: 'app-detalhes-tarefa',
    standalone: true,
    imports: [NgIf, NgFor, FormsModule, NgClass, DecimalPipe],
    templateUrl: './detalhes-tarefa.html',
    styleUrl: './detalhes-tarefa.css'
})
export class DetalhesTarefa implements OnInit, OnChanges {
    @Input() tarefa: Tarefa | null = null; // Este input receberá o objeto da tarefa principal
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();
    @Output() tarefaAtualizada = new EventEmitter<Tarefa>();
    @Output() tarefaDeletada = new EventEmitter<string>();

    status = [
        { value: 'AGUARDANDO', label: 'Aguardando', class: 'status-aguardando' },
        { value: 'INICIADA', label: 'Iniciada', class: 'status-iniciada' },
        { value: 'ENCERRADA', label: 'Encerrada', class: 'status-encerrada' },
        { value: 'ATRASADA', label: 'Atrasada', class: 'status-atrasada' }
    ];

    showResponsibleDropdown: boolean = false;
    usuarios: Usuario[] = [];
    addingSubtask: boolean = false;
    newSubtaskTitle: string = '';
    showSubtaskResponsibleDropdown: { [key: string]: boolean } = {};
    showSubtaskStatusDropdown: { [key: string]: boolean } = {}; // Para o dropdown de status da subtarefa

    nomeParaAtualizar: string = '';
    dataInicioParaAtualizar: string = '';
    dataFimParaAtualizar: string = '';

    newSubtask: Tarefa = { nomeTarefa: '', statusTarefa: 'AGUARDANDO' };


    constructor(
        private tarefaService: TarefaService,
        private cdr: ChangeDetectorRef,
        private usuarioService: UsuarioService
    ) { }

    ngOnInit(): void {
        this.loadUsuarios();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tarefa'] && this.tarefa) {
            this.nomeParaAtualizar = this.tarefa.nomeTarefa || '';
            this.dataInicioParaAtualizar = this.tarefa.dataInicio || '';
            this.dataFimParaAtualizar = this.tarefa.dataFim || '';

        } else if (changes['isOpen'] && !this.isOpen) {
            this.resetModalState();
        }
    }

    private resetModalState(): void {
        this.tarefa = null; 
        this.nomeParaAtualizar = '';
        this.dataInicioParaAtualizar = '';
        this.dataFimParaAtualizar = '';
        this.showSubtaskResponsibleDropdown = {};
        this.showSubtaskStatusDropdown = {};
        this.addingSubtask = false;
        this.newSubtaskTitle = '';

    }

    onClose(): void {
        this.close.emit();
    }

    toggleResponsibleDropdown(): void {
        this.showResponsibleDropdown = !this.showResponsibleDropdown;
    }

    toggleSubtaskCompletion(tarefa: Subtarefa): void {
        if (this.tarefa && this.tarefa.tarefasFilhas) {
            const index = this.tarefa.tarefasFilhas.findIndex(s => s.id === tarefa.id);
            if (index !== -1) {
                // Se esta função era para alternar um checkbox de conclusão,
                // você precisaria chamar um serviço para atualizar o status da subtarefa.
                // Exemplo:
                // const newStatus = tarefa.statusTarefa === 'CONCLUIDA' ? 'AGUARDANDO' : 'CONCLUIDA';
                // this.updateSubtaskStatus(tarefa, newStatus); // Chamaria o método de atualização de status
                this.emitUpdateTask();
            }
        }
    }

    addNewSubtask(): void {
        if (!this.newSubtaskTitle || this.newSubtaskTitle.trim() === '') {
            alert('Por favor, insira um título para a subtarefa.');
            return;
        }
        if (!this.tarefa || !this.tarefa.id) {
            console.error('ID da tarefa pai não disponível para adicionar subtarefa.');
            alert('Não foi possível adicionar a subtarefa: ID da tarefa pai não encontrado.');
            return;
        }

        // O payload para criar uma subtarefa deve corresponder ao DTO que seu backend espera.
        // Se o backend espera um objeto com 'nomeTarefa', 'statusTarefa' e 'tarefaPai' (com 'id'),
        // o payload abaixo está correto.
        const subtaskToCreate: Tarefa = {
            nomeTarefa: this.newSubtaskTitle.trim(),
            statusTarefa: 'AGUARDANDO',
            tarefaPai: { id: this.tarefa.id, nomeTarefa: '' } // Assumindo que TarefaPaiDTO tem id e nomeTarefa
        };

        this.tarefaService.criarTarefa(subtaskToCreate).subscribe({ // Assumindo que criarTarefa lida com subtarefas
            next: (createdSubtask: Tarefa) => {
                console.log('Subtarefa criada com sucesso:', createdSubtask);
                if (this.tarefa) {
                    if (!this.tarefa.tarefasFilhas) {
                        this.tarefa.tarefasFilhas = [];
                    }
                    this.tarefa.tarefasFilhas.unshift(createdSubtask); // Adiciona ao início da lista
                    if (createdSubtask.id) {
                        this.showSubtaskResponsibleDropdown[createdSubtask.id] = false;
                    }
                    this.emitUpdateTask();
                }
                this.cancelAddSubtask();
            },
            error: (err) => {
                console.error('Erro ao adicionar subtarefa:', err);
                alert('Erro ao adicionar subtarefa. Verifique o console.');
            }
        });
    }

    private emitUpdateTask(): void {
        if (this.tarefa) {
            this.tarefaAtualizada.emit(this.tarefa);
        }
    }

    hasSubtasks(): boolean {
        return !!(this.tarefa?.tarefasFilhas && this.tarefa.tarefasFilhas.length > 0);
    }

    openAddSubtask(): void {
        this.addingSubtask = true;
        this.newSubtaskTitle = '';
    }

    cancelAddSubtask(): void {
        this.addingSubtask = false;
        this.newSubtaskTitle = '';
    }

    getStatusClass(status: string | undefined): string {
        return this.status.find(s => s.value === status)?.class || '';
    }

    getStatusLabel(status: string | undefined): string {
        return this.status.find(s => s.value === status)?.label || 'Status Desconhecido';
    }

    selectResponsible(user: Usuario): void {
        if (this.tarefa) {
            this.selectedResponsavelId = user.id; // Chama o setter, que faz a chamada ao serviço
            this.showResponsibleDropdown = false;
        }
    }

    promptNewResponsible(): void {
        const newName = prompt('Digite o nome do novo responsável:');
        if (newName && newName.trim() !== '') {
            console.warn('Função promptNewResponsible precisa ser revisada para usar IDs de usuário.');
        }
    }

    onStatusChange(newStatus: string): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('ID da tarefa não disponível para atualização de status.');
            alert('Não foi possível atualizar o status: ID da tarefa não encontrado.');
            return;
        }

        const taskId = this.tarefa.id;
        const originalStatus = this.tarefa.statusTarefa;
        this.tarefa.statusTarefa = newStatus; 

        this.tarefaService.atualizarStatusTarefa(taskId, newStatus).subscribe({
            next: (updatedTarefa) => {
                console.log('Status da tarefa atualizado com sucesso:', updatedTarefa);
                this.tarefa = updatedTarefa; // Sincroniza com a resposta do backend
                this.cdr.detectChanges();
                this.emitUpdateTask();
            },
            error: (error) => {
                console.error('Erro ao atualizar o status da tarefa:', error);
                if (this.tarefa) {
                    this.tarefa.statusTarefa = originalStatus; // Reverte
                }
                const errorMessage = error.error?.entity || error.message || 'Erro desconhecido ao atualizar o status.';
                alert(`Erro ao atualizar o status: ${errorMessage}`);
            }
        });
    }

    toggleSubtaskResponsibleDropdown(subtaskId: string): void {
        // Fecha outros dropdowns de responsável de subtarefa
        Object.keys(this.showSubtaskResponsibleDropdown).forEach(key => {
            if (key !== subtaskId) {
                this.showSubtaskResponsibleDropdown[key] = false;
            }
        });
        this.showSubtaskResponsibleDropdown[subtaskId] = !this.showSubtaskResponsibleDropdown[subtaskId];
    }

    selectSubtaskResponsible(subtask: Tarefa, user: Usuario): void {
        if (!subtask.id) {
            console.error('ID da subtarefa não disponível para atualização de responsável.');
            return;
        }
        // Atualização otimista
        //subtask.Usuario.id = user.id; // Assumindo que 'responsavel' armazena o ID do usuário
        this.cdr.detectChanges();

        this.tarefaService.atualizarUsuarioResponsavel(subtask.id, user.id).subscribe({
            next: (updatedSubtask) => {
                console.log('Responsável da subtarefa atualizado com sucesso:', updatedSubtask);
                if (this.tarefa && this.tarefa.tarefasFilhas) {
                    const index = this.tarefa.tarefasFilhas.findIndex(s => s.id === updatedSubtask.id);
                    if (index !== -1) {
                        this.tarefa.tarefasFilhas[index] = updatedSubtask;
                    }
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao atualizar responsável da subtarefa:', err);
                // Reverte em caso de erro
                subtask.Usuario = this.tarefa?.tarefasFilhas?.find(s => s.id === subtask.id)?.Usuario;
                this.cdr.detectChanges();
                alert('Erro ao atualizar responsável da subtarefa.');
            }
        });
        this.showSubtaskResponsibleDropdown[subtask.id] = false; // Fecha o dropdown
    }

    // Método para alternar a visibilidade do dropdown de status da subtarefa (se for customizado)
    toggleSubtaskStatusDropdown(subtaskId: string): void {
        Object.keys(this.showSubtaskStatusDropdown).forEach(key => {
            if (key !== subtaskId) {
                this.showSubtaskStatusDropdown[key] = false;
            }
        });
        this.showSubtaskStatusDropdown[subtaskId] = !this.showSubtaskStatusDropdown[subtaskId];
    }

    updateSubtaskStatus(subtask: Tarefa, newStatus: string): void {
        if (!subtask.id) {
            console.error('ID da subtarefa não disponível para atualização de status.');
            return;
        }

        const originalStatus = subtask.statusTarefa;
        console.log('Tentando atualizar subtarefa:', subtask.id, 'para status:', newStatus);

        this.tarefaService.atualizarStatusTarefa(subtask.id, newStatus).subscribe({
            next: (updatedSubtask) => {
                console.log('Status da subtarefa atualizado com sucesso no backend. Resposta do backend:', updatedSubtask);

                if (this.tarefa && this.tarefa.tarefasFilhas) {
                    const index = this.tarefa.tarefasFilhas.findIndex((s: Tarefa) => s.id === updatedSubtask.id);

                    if (index !== -1) {
                        // Substitui a subtarefa antiga pela atualizada na lista local
                        this.tarefa.tarefasFilhas = this.tarefa.tarefasFilhas.map((s: Tarefa) =>
                            s.id === updatedSubtask.id ? updatedSubtask : s
                        );
                        console.log('Array de subtarefas atualizado no frontend:', this.tarefa.tarefasFilhas);
                    } else {
                        console.warn('Subtarefa atualizada do backend não encontrada no array local.');
                    }
                } else {
                    console.warn('Tarefa principal ou array de subtarefas é nulo/undefined ao tentar atualizar sub-tarefa.');
                }
                this.cdr.detectChanges();
                console.log('Detecção de mudanças forçada após atualização da subtarefa.');
            },
            error: (error) => {
                console.error('Erro ao atualizar status da subtarefa. Revertendo UI:', error);
                subtask.statusTarefa = originalStatus; // Reverte o status na UI
                this.cdr.detectChanges();
                alert('Erro ao atualizar status da subtarefa.');
            }
        });
    }

    deleteCurrentTask(): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.warn('Nenhuma tarefa selecionada para exclusão.');
            return;
        }

        const confirmDelete = confirm(`Tem certeza que deseja excluir a tarefa "${this.tarefa.nomeTarefa}"?
        ATENÇÃO: Todas as subtarefas associadas também serão excluídas.`);

        if (confirmDelete) {
            this.tarefaService.deleteTask(this.tarefa.id).subscribe({
                next: () => {
                    console.log('Tarefa excluída com sucesso:', this.tarefa!.id);
                    alert('Tarefa e suas subtarefas excluídas com sucesso!');
                    this.tarefaDeletada.emit(this.tarefa!.id);
                    this.onClose();
                },
                error: (err) => {
                    console.error('Erro ao excluir tarefa:', err);
                    alert('Erro ao excluir tarefa. Verifique o console.');
                }
            });
        }
        this.onClose;
    }

    atualizarNomeDaTarefa(): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('Tarefa ou ID da tarefa não disponível para atualização de nome.');
            return;
        }
        if (this.nomeParaAtualizar.trim() === '') {
            alert('O nome da tarefa não pode ser vazio.');
            this.nomeParaAtualizar = this.tarefa.nomeTarefa || '';
            return;
        }

        const originalNome = this.tarefa.nomeTarefa;
        this.tarefa.nomeTarefa = this.nomeParaAtualizar; // Atualização otimista

        this.tarefaService.atualizarNomeTarefa(this.tarefa.id, this.nomeParaAtualizar).subscribe({
            next: (response) => {
                console.log('Nome da tarefa atualizado com sucesso:', response);
                // Se o backend retorna a Tarefa completa atualizada, você pode atribuir:
                // this.tarefa = response;
                this.cdr.detectChanges();
                this.emitUpdateTask();
            },
            error: (error) => {
                console.error('Erro ao atualizar o nome da tarefa:', error);
                alert('Erro ao atualizar o nome da tarefa.');
                if (this.tarefa) {
                    this.tarefa.nomeTarefa = originalNome; // Reverte
                }
                this.cdr.detectChanges();
            }
        });
    }

    atualizarDataInicioDaTarefa(): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('Tarefa ou ID da tarefa não disponível para atualização de data de início.');
            return;
        }
        const dataParaEnviar = this.dataInicioParaAtualizar.trim() === '' ? null : this.dataInicioParaAtualizar;

        const originalDataInicio = this.tarefa.dataInicio;
        this.tarefa.dataInicio = dataParaEnviar || undefined; // Atualização otimista

        this.tarefaService.atualizarDataInicioTarefa(this.tarefa.id, dataParaEnviar).subscribe({
            next: (response) => {
                console.log('Data de início da tarefa atualizada com sucesso:', response);
                // Se o backend retorna a Tarefa completa atualizada, você pode atribuir:
                // this.tarefa = response;
                this.cdr.detectChanges();
                this.emitUpdateTask();
            },
            error: (error) => {
                console.error('Erro ao atualizar a data de início da tarefa:', error);
                alert('Erro ao atualizar a data de início da tarefa.');
                if (this.tarefa) {
                    this.tarefa.dataInicio = originalDataInicio; // Reverte
                }
                this.cdr.detectChanges();
            }
        });
    }

    atualizarDataFimDaTarefa(): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('Tarefa ou ID da tarefa não disponível para atualização de data limite.');
            return;
        }
        const dataParaEnviar = this.dataFimParaAtualizar.trim() === '' ? null : this.dataFimParaAtualizar;

        const originalDataFim = this.tarefa.dataFim;
        this.tarefa.dataFim = dataParaEnviar || undefined; // Atualização otimista

        this.tarefaService.atualizarDataFimTarefa(this.tarefa.id, dataParaEnviar).subscribe({
            next: (response) => {
                console.log('Data limite da tarefa atualizada com sucesso:', response);
                // Se o backend retorna a Tarefa completa atualizada, você pode atribuir:
                // this.tarefa = response;
                this.cdr.detectChanges();
                this.emitUpdateTask();
            },
            error: (err) => {
                console.error('Erro ao atualizar data limite da tarefa principal:', err);
                alert('Erro ao atualizar data limite da tarefa principal.');
                if (this.tarefa) {
                    this.tarefa.dataFim = originalDataFim; // Reverte
                }
                this.cdr.detectChanges();
            }
        });
    }

    get selectedResponsavelId(): Usuario | undefined | null {
        // Retorna o ID do responsável da tarefa, ou undefined se não houver
        return this.tarefa?.Usuario;
    }

    set selectedResponsavelId(newResponsavelId: string | undefined) {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('Tarefa ou ID da tarefa não disponível para atualização de responsável.');
            return;
        }

        const originalResponsavelId = this.tarefa.Usuario;

        // Atualiza o ID do responsável localmente (otimista)
        //this.tarefa?.Usuario?.id = newResponsavelId === '' ? undefined : newResponsavelId;
        this.cdr.detectChanges(); // Força a UI a refletir a mudança imediatamente

        const payloadId = newResponsavelId === '' ? null : newResponsavelId;

        this.tarefaService.atualizarUsuarioResponsavel(this.tarefa.id, payloadId).subscribe({
            next: (updatedTask) => {
                console.log('Responsável da tarefa principal atualizado com sucesso:', updatedTask);
                this.tarefa = updatedTask; // Sincroniza o objeto completo retornado pelo backend
                this.cdr.detectChanges();
                this.emitUpdateTask();
            },
            error: (err) => {
                console.error('Erro ao atualizar responsável da tarefa principal:', err);
                alert('Erro ao atualizar responsável da tarefa principal.');
                // Reverte o estado local em caso de erro
                if (this.tarefa) {
                    this.tarefa.Usuario = originalResponsavelId; // Reverte o ID
                    this.cdr.detectChanges(); // Força a UI a refletir a reversão
                }
            }
        });
    }

    loadUsuarios(): void {
        this.usuarioService.getUsers().subscribe({
            next: (users: Usuario[]) => {
                this.usuarios = users;
            },
            error: (err) => {
                console.error('Erro ao carregar usuários:', err);
            }
        });
    }
}