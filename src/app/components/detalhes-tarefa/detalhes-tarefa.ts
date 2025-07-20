import { Component, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe} from '@angular/common';
import { Tarefa, Subtarefa } from '../../models/tarefa.model';
import { FormsModule } from '@angular/forms';
import { TarefaService } from '../../services/tarefa.service';

@Component({
  selector: 'app-detalhes-tarefa',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass, DecimalPipe],
  templateUrl: './detalhes-tarefa.html',
  styleUrl: './detalhes-tarefa.css'
})
export class DetalhesTarefa {
  @Input() tarefa: Tarefa | null = null; 
  @Input() isOpen: boolean = false;    
  @Output() close = new EventEmitter<void>();
  @Output() tarefaAtualizada = new EventEmitter<Tarefa>();
  @Output() tarefaDeletada = new EventEmitter<string>();
  
  status = [
    { value: 'AGUARDANDO', label: 'Aguardando', class: 'status-aguardando' },
    { value: 'INICIADA', label: 'Iniciada', class: 'status-iniciada' },
    { value: 'ENCERRADA', label: 'Encerrada', class: 'status-encerrada' },
    {  value: 'ATRASADA', label: 'Atrasada', class: 'status-atrasada' }
  ];

  showResponsibleDropdown: boolean = false;
  availableUsers = [ 
    { id: '1', name: 'Victor Mariani' },
    { id: '2', name: 'Ana Souza' },
    { id: '3', name: 'Carlos Silva' }
  ];

  addingSubtask: boolean = false;
  newSubtaskTitle: string = '';
  showSubtaskResponsibleDropdown: { [key: string]: boolean } = {};
  newSubtask: Tarefa = { nomeTarefa: '', statusTarefa: 'AGUARDANDO'};


  constructor(private tarefaService: TarefaService, private cdr: ChangeDetectorRef) { }

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
            tarefaPai: { id: this.tarefa.id, nomeTarefa: ''}
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
                    this.tarefaAtualizada.emit(this.tarefa); 
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

  selectResponsible(userName: string): void {
    if (this.tarefa) {
      this.tarefa.responsavel = userName;
      this.emitUpdateTask();
      this.showResponsibleDropdown = false;
    }
  }

  promptNewResponsible(): void {
    const newName = prompt('Digite o nome do novo responsável:');
    if (newName && newName.trim() !== '') {
      this.selectResponsible(newName.trim());
    }
  }

  onStatusChange(newStatus: string): void {
        if (!this.tarefa || this.tarefa.id === undefined || this.tarefa.id === null) {
            console.error('ID da tarefa não disponível para atualização de status.');
            alert('Não foi possível atualizar o status: ID da tarefa não encontrado.');
            return;
        }

        const taskId = this.tarefa.id;
        const patchData = {
            statusTarefa: newStatus
        };

        const originalStatus = this.tarefa.statusTarefa;
        this.tarefa.statusTarefa = newStatus;

        this.tarefaService.updateTarefaPartial(taskId, patchData).subscribe({
            next: (updatedTarefa) => {
                console.log('Status da tarefa atualizado com sucesso:', updatedTarefa);
                this.tarefa = updatedTarefa;
                this.cdr.detectChanges();
                this.tarefaAtualizada.emit(this.tarefa); 
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

    selectSubtaskResponsible(subtask: Tarefa, user: any): void {
        if (!subtask.id) {
            console.error('ID da subtarefa não disponível para atualização de responsável.');
            return;
        }
      }

    updateSubtaskStatus(subtask: Tarefa, newStatus: string): void {
    if (!subtask.id) {
        console.error('ID da subtarefa não disponível para atualização de status.');
        return;
    }

    const originalStatus = subtask.statusTarefa;
    console.log('Tentando atualizar subtarefa:', subtask.id, 'para status:', newStatus); // Log 1

    this.tarefaService.updateTarefaPartial(subtask.id, { statusTarefa: newStatus }).subscribe({
        next: (updatedSubtask) => {
            console.log('Status da subtarefa atualizado com sucesso no backend. Resposta do backend:', updatedSubtask); // Log 2

            if (this.tarefa && this.tarefa.subtarefas) {
                const index = this.tarefa.subtarefas.findIndex((s: Tarefa) => s.id === updatedSubtask.id);

                if (index !== -1) {
                    this.tarefa.subtarefas = this.tarefa.subtarefas.map((s: Tarefa) =>
                        s.id === updatedSubtask.id ? updatedSubtask : s
                    );
                    console.log('Array de subtarefas atualizado no frontend:', this.tarefa.subtarefas); // Log 3
                } else {
                    console.warn('Subtarefa atualizada do backend não encontrada no array local.');
                }
            } else {
                console.warn('Tarefa principal ou array de subtarefas é nulo/undefined ao tentar atualizar sub-tarefa.');
            }
            this.cdr.detectChanges();
            console.log('Detecção de mudanças forçada após atualização da subtarefa.'); // Log 4
        },
        error: (error) => {
            console.error('Erro ao atualizar status da subtarefa. Revertendo UI:', error); // Log 5
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
                    this.tarefaAtualizada.emit(this.tarefa);
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

        ngOnChanges(changes: SimpleChanges): void {
        if (this.isOpen && this.tarefa && this.tarefa.id) {
            const currentTarefaId = changes['tarefa']?.currentValue?.id;
            const previousTarefaId = changes['tarefa']?.previousValue?.id;

            if (currentTarefaId && (currentTarefaId !== previousTarefaId || changes['isOpen']?.currentValue === true && changes['isOpen']?.previousValue === false)) {
                this.loadSubtasks(this.tarefa.id);
            }
        }
    }

    deleteCurrentTask(): void {
        if (!this.tarefa || !this.tarefa.id) {
            console.warn('Nenhuma tarefa selecionada para exclusão.');
            return;
        }

        // Confirmação com o usuário
        const confirmDelete = confirm(`Tem certeza que deseja excluir a tarefa "${this.tarefa.nomeTarefa}"?
        ATENÇÃO: Todas as subtarefas associadas também serão excluídas.`);

        if (confirmDelete) {
            this.tarefaService.deleteTask(this.tarefa.id).subscribe({
                next: () => {
                    console.log('Tarefa excluída com sucesso:', this.tarefa!.id);
                    alert('Tarefa e suas subtarefas excluídas com sucesso!');
                    this.tarefaDeletada.emit(this.tarefa!.id); // Emite evento para o componente pai
                    this.onClose(); // Fecha o modal
                },
                error: (err) => {
                    console.error('Erro ao excluir tarefa:', err);
                    alert('Erro ao excluir tarefa. Verifique o console.');
                }
            });
        }
    }

        onDateLimitChange(newDateString: string | null): void {
        if (this.tarefa && this.tarefa.id) {
            // Se newDateString for vazio ou null, enviar null
            const payloadDate = newDateString ? newDateString : null; // Garante que string vazia vira null

            const updatePayload = { dataFim: payloadDate };
            this.tarefaService.updateTarefaPartial(this.tarefa.id, updatePayload).subscribe({
                next: (updatedTask: Tarefa) => {
                    this.tarefa!.dataFim = updatedTask.dataFim;
                    this.tarefa!.statusTarefa = updatedTask.statusTarefa; // Importante: Atualizar status também!
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Erro ao atualizar data limite da tarefa principal:', err);
                    alert('Erro ao atualizar data limite da tarefa principal.');
                }
            });
        }
    }

}
