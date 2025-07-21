import { Component, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef, Injectable, OnInit, OnChanges } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { Tarefa, Subtarefa } from '../../models/tarefa.model';
import { FormsModule } from '@angular/forms';
import { TarefaService } from '../../services/tarefa.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';

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
    @Input() tarefa: Tarefa | null = null;
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
    newSubtask: Tarefa = { nomeTarefa: '', statusTarefa: 'AGUARDANDO' };

    nomeParaAtualizar: string = '';
    dataInicioParaAtualizar: string = '';
    dataFimParaAtualizar: string = '';

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
        }

        if (this.isOpen && this.tarefa && this.tarefa.id) {
            const currentTarefaId = changes['tarefa']?.currentValue?.id;
            const previousTarefaId = changes['tarefa']?.previousValue?.id;

            if (currentTarefaId && (currentTarefaId !== previousTarefaId || (changes['isOpen'] && changes['isOpen'].currentValue === true && changes['isOpen'].previousValue === false))) {
                this.loadSubtasks(this.tarefa.id);
            }
        }
    }

    onClose(): void {
        this.close.emit();
    }

    toggleResponsibleDropdown(): void {
        this.showResponsibleDropdown = !this.showResponsibleDropdown;
    }

    toggleSubtaskCompletion(tarefa: Subtarefa): void {
        if (this.tarefa && this.tarefa.subtarefas) {
            const index = this.tarefa.subtarefas.findIndex(s => s.id === tarefa.id);
            if (index !== -1) {
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

        const subtaskToCreate: Tarefa = {
            nomeTarefa: this.newSubtaskTitle.trim(),
            statusTarefa: 'AGUARDANDO',
            tarefaPai: { id: this.tarefa.id, nomeTarefa: '' }
        };

        this.tarefaService.criarTarefa(subtaskToCreate).subscribe({
            next: (createdSubtask: Tarefa) => {
                console.log('Subtarefa criada com sucesso:', createdSubtask);
                if (this.tarefa) {
                    if (!this.tarefa.subtarefas) {
                        this.tarefa.subtarefas = [];
                    }
                    this.tarefa.subtarefas.unshift(createdSubtask);
                    if (createdSubtask.id) {
                        this.showSubtaskResponsibleDropdown[createdSubtask.id] = false;
                    }
                    this.emitUpdateTask(); // Alterado para usar o método helper
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
        if (this.tarefa) { // Adiciona a verificação aqui
            this.tarefaAtualizada.emit(this.tarefa);
        }
    }

    hasSubtasks(): boolean {
        return !!(this.tarefa?.subtarefas && this.tarefa.subtarefas.length > 0);
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
            this.selectedResponsavelId = user.id;
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
        if (!this.tarefa || !this.tarefa.id) { // Simplificando a verificação de ID
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
                this.tarefa = updatedTarefa;
                this.cdr.detectChanges();
                this.emitUpdateTask(); // Alterado para usar o método helper
            },
            error: (error) => {
                console.error('Erro ao atualizar o status da tarefa:', error);
                if (this.tarefa) {
                    this.tarefa.statusTarefa = originalStatus;
                }
                const errorMessage = error.error?.entity || error.message || 'Erro desconhecido ao atualizar o status.';
                alert(`Erro ao atualizar o status: ${errorMessage}`);
            }
        });
    }

    calculateProgress(): number {
        if (!this.tarefa?.subtarefas || this.tarefa.subtarefas.length === 0) {
            return 0;
        }
        const completedSubtasks = this.tarefa.subtarefas.filter(sub => sub.statusTarefa === 'CONCLUIDA').length;
        return (completedSubtasks / this.tarefa.subtarefas.length) * 100;
    }

    toggleSubtaskResponsibleDropdown(subtaskId: string): void {
        this.showSubtaskResponsibleDropdown[subtaskId] = !this.showSubtaskResponsibleDropdown[subtaskId];
    }

    selectSubtaskResponsible(subtask: Tarefa, user: Usuario): void {
        if (!subtask.id) {
            console.error('ID da subtarefa não disponível para atualização de responsável.');
            return;
        }
        subtask.responsavel = user.id;
        this.cdr.detectChanges();

        this.tarefaService.atualizarUsuarioResponsavel(subtask.id, user.id).subscribe({
            next: (updatedSubtask) => {
                console.log('Responsável da subtarefa atualizado com sucesso:', updatedSubtask);
                if (this.tarefa && this.tarefa.subtarefas) {
                    const index = this.tarefa.subtarefas.findIndex(s => s.id === updatedSubtask.id);
                    if (index !== -1) {
                        this.tarefa.subtarefas[index] = updatedSubtask;
                    }
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao atualizar responsável da subtarefa:', err);
                subtask.responsavel = this.tarefa?.subtarefas?.find(s => s.id === subtask.id)?.responsavel;
                this.cdr.detectChanges();
                alert('Erro ao atualizar responsável da subtarefa.');
            }
        });
        this.showSubtaskResponsibleDropdown[subtask.id] = false;
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

                if (this.tarefa && this.tarefa.subtarefas) {
                    const index = this.tarefa.subtarefas.findIndex((s: Tarefa) => s.id === updatedSubtask.id);

                    if (index !== -1) {
                        this.tarefa.subtarefas = this.tarefa.subtarefas.map((s: Tarefa) =>
                            s.id === updatedSubtask.id ? updatedSubtask : s
                        );
                        console.log('Array de subtarefas atualizado no frontend:', this.tarefa.subtarefas);
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
                subtask.statusTarefa = originalStatus;
                this.cdr.detectChanges();
                alert('Erro ao atualizar status da subtarefa.');
            }
        });
    }

    loadSubtasks(tarefaPaiId: string): void {
        console.log('Carregando subtarefas para tarefa pai ID:', tarefaPaiId);
        this.tarefaService.getTarefasFilhas(tarefaPaiId).subscribe({
            next: (subtasks: Tarefa[]) => {
                console.log('Subtarefas carregadas do backend:', subtasks);
                if (this.tarefa) {
                    this.tarefa.subtarefas = subtasks;
                    this.emitUpdateTask(); // Alterado para usar o método helper
                }
            },
            error: (err) => {
                console.error('Erro ao carregar subtarefas:', err);
                if (this.tarefa) {
                    this.tarefa.subtarefas = [];
                }
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
        this.tarefa.nomeTarefa = this.nomeParaAtualizar;

        this.tarefaService.atualizarNomeTarefa(this.tarefa.id, this.nomeParaAtualizar).subscribe({
            next: (response) => {
                console.log('Nome da tarefa atualizado com sucesso:', response);
                this.cdr.detectChanges();
                this.emitUpdateTask(); // Alterado para usar o método helper
            },
            error: (error) => {
                console.error('Erro ao atualizar o nome da tarefa:', error);
                alert('Erro ao atualizar o nome da tarefa.');
                if (this.tarefa) {
                    this.tarefa.nomeTarefa = originalNome;
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
        this.tarefa.dataInicio = dataParaEnviar || undefined;

        this.tarefaService.atualizarDataInicioTarefa(this.tarefa.id, dataParaEnviar).subscribe({
            next: (response) => {
                console.log('Data de início da tarefa atualizada com sucesso:', response);
                this.cdr.detectChanges();
                this.emitUpdateTask(); // Alterado para usar o método helper
            },
            error: (error) => {
                console.error('Erro ao atualizar a data de início da tarefa:', error);
                alert('Erro ao atualizar a data de início da tarefa.');
                if (this.tarefa) {
                    this.tarefa.dataInicio = originalDataInicio;
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
        this.tarefa.dataFim = dataParaEnviar || undefined;

        this.tarefaService.atualizarDataFimTarefa(this.tarefa.id, dataParaEnviar).subscribe({
            next: (response) => {
                console.log('Data limite da tarefa atualizada com sucesso:', response);
                this.cdr.detectChanges();
                this.emitUpdateTask(); // Alterado para usar o método helper
            },
            error: (err) => {
                console.error('Erro ao atualizar data limite da tarefa principal:', err);
                alert('Erro ao atualizar data limite da tarefa principal.');
                if (this.tarefa) {
                    this.tarefa.dataFim = originalDataFim;
                }
                this.cdr.detectChanges();
            }
        });
    }

    get selectedResponsavelId(): string | undefined {
        return this.tarefa?.responsavel;
    }

    set selectedResponsavelId(newResponsavelId: string | undefined) {
        if (!this.tarefa || !this.tarefa.id) {
            console.error('Tarefa ou ID da tarefa não disponível para atualização de responsável.');
            return;
        }

        const originalResponsavelId = this.tarefa.responsavel;

        this.tarefa.responsavel = newResponsavelId === '' ? undefined : newResponsavelId;
        this.cdr.detectChanges();

        const payloadId = newResponsavelId === '' ? null : newResponsavelId;

        this.tarefaService.atualizarUsuarioResponsavel(this.tarefa.id, payloadId).subscribe({
            next: (updatedTask) => {
                console.log('Responsável da tarefa principal atualizado com sucesso:', updatedTask);
                this.tarefa = updatedTask;
                this.cdr.detectChanges();
                this.emitUpdateTask(); // Alterado para usar o método helper
            },
            error: (err) => {
                console.error('Erro ao atualizar responsável da tarefa principal:', err);
                alert('Erro ao atualizar responsável da tarefa principal.');
                if (this.tarefa) {
                    this.tarefa.responsavel = originalResponsavelId;
                    this.cdr.detectChanges();
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