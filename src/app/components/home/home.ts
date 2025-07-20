import { Component, OnInit  } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Tarefa } from '../../models/tarefa.model';
import { Usuario} from '../../models/usuario.model';
import { DetalhesTarefa } from '../detalhes-tarefa/detalhes-tarefa';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { TarefaService } from '../../services/tarefa.service';
import { UsuarioService } from '../../services/usuario.service';



@Component({
  selector: 'app-home',
  imports: [NgFor, NgIf, DetalhesTarefa, FormsModule, NgClass],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  arrayTarefas: Tarefa[] = []
  isModalOpen: boolean = false;
  tarefaSelecionada: Tarefa | null = null;
  adicionarStatusTarefa: string | null = null;
  newTaskTitle: string = '';

constructor(
  private http: HttpClient, 
  private cdr: ChangeDetectorRef,
  private tarefaService: TarefaService,
  private usuarioService: UsuarioService ){}


  ngOnInit(): void{
    this.buscarTarefas();
  }

  buscarTarefas(): void {
        this.tarefaService.buscarTodasTarefas().subscribe({
            next: (res) => {
                this.arrayTarefas = res;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Erro ao buscar tarefas: ", err);
                alert('Erro ao carregar tarefas.');
            }
        });
  }
  onTarefaUpdated(updatedTarefa: Tarefa): void {
        const index = this.arrayTarefas.findIndex(t => t.id === updatedTarefa.id);
        if (index !== -1) {
            this.arrayTarefas[index] = updatedTarefa;
            this.arrayTarefas = [...this.arrayTarefas]; 
        } else {
            this.buscarTarefas();
        }
        this.cdr.detectChanges();
  }

  isTaskOverdue(tarefa: Tarefa): boolean {
    if (!tarefa.dataFim) {
      return false; 
    }

    if (tarefa.statusTarefa === 'CONCLUIDA' || tarefa.statusTarefa === 'CANCELADA') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const dueDate = new Date(tarefa.dataFim + 'T00:00:00'); 
    dueDate.setHours(0, 0, 0, 0); 

    return dueDate < today; 
  }

  filtrarTarefas(statusColuna: string): Tarefa[] {
    return this.arrayTarefas.filter(tarefa => {
        return tarefa.statusTarefa === statusColuna;
    });
  }

  getTaskCardClass(tarefa: Tarefa): string {
    let classes = 'task-card';
    if (tarefa.statusTarefa) {
      classes += ` status-tag-${tarefa.statusTarefa.toLowerCase().replace(/_/g, '-')}`;
    }
    if (this.isTaskOverdue(tarefa)) {
        classes += ' task-atrasada';
    }
    return classes.trim();
  }

  openTaskDetails(task: Tarefa): void {
    this.tarefaSelecionada = task;
    this.isModalOpen = true;
  }

  closeTaskDetails(): void {
    this.isModalOpen = false;
    this.tarefaSelecionada = null; 
    this.cdr.detectChanges();
  }

  openQuickAddTask(status: string): void {
    this.adicionarStatusTarefa = status;
    this.newTaskTitle = ''; 
  }

  cancelQuickAddTask(): void {
    this.adicionarStatusTarefa = null;
    this.newTaskTitle = '';
  }

   addNewTask(): void {
    if (this.newTaskTitle.trim() === '' || !this.adicionarStatusTarefa) {
      alert('Por favor, insira um título para a tarefa.');
      return;
    }

    const newTask: Tarefa = {
      nomeTarefa: this.newTaskTitle.trim(),
    };

  this.tarefaService.criarTarefa(newTask).subscribe({
            next: (res) => {
                this.arrayTarefas.push(res);
                this.arrayTarefas = [...this.arrayTarefas];
                this.cancelQuickAddTask();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao criar tarefa:', err);
                alert('Erro ao criar tarefa. Verifique o console.');
            }
  });
  }

   addNewUser(): void {
    const userName = prompt('Digite o nome do novo usuário:');

    if (userName && userName.trim() !== '') {
      this.usuarioService.createUser(userName.trim()).subscribe({
        next: (user: Usuario) => {
          alert(`Usuário "${user.nome}" criado com sucesso!`);
          console.log('Novo usuário criado:', user);

        },
        error: (error) => {
          console.error('Erro ao criar usuário:', error);
          alert('Erro ao criar usuário. Verifique o console para mais detalhes.');
        }
      });
    } else if (userName !== null) { 
      alert('Nome do usuário não pode ser vazio.');
    }
  }

  handleTarefaDeletada(deletedTaskId: string): void {
      console.log(`Tarefa com ID ${deletedTaskId} foi deletada.`);
      this.buscarTarefas(); 
  }
  
}
