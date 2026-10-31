import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface Tag {
  id?: number;
  name: string;
  descricao: string;
}

export interface Task {
  id?: string;
  title: string;
  content: string;
  autor: string;
  creationDate: string;
  tags?: Tag[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 600px; margin: 40px auto; font-family: sans-serif; padding: 20px;">
      <h2>Gerenciador de Tarefas</h2>
      <p *ngIf="apiError()" role="alert">{{ apiError() }}</p>

      <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>{{ editingTask() ? 'Editar Nota' : 'Nova Nota' }}</h3>
        <input
          [(ngModel)]="newTitle"
          placeholder="Título"
          style="display:block; width:100%; margin-bottom:8px; padding:8px;"
        />
        <input
          [(ngModel)]="newContent"
          placeholder="Conteúdo"
          style="display:block; width:100%; margin-bottom:8px; padding:8px;"
        />
        <input
          [(ngModel)]="newAutor"
          placeholder="Autor"
          style="display:block; width:100%; margin-bottom:8px; padding:8px;"
        />
        <div
          *ngFor="let tag of formTags(); let i = index; trackBy: trackTagIndex"
          style="margin-bottom: 12px;"
        >
          <input
            [ngModel]="tag.name"
            (ngModelChange)="updateTag(i, 'name', $event)"
            placeholder="Nome da tag"
            style="display:block; width:100%; margin-bottom:8px; padding:8px;"
          />
          <input
            [ngModel]="tag.descricao"
            (ngModelChange)="updateTag(i, 'descricao', $event)"
            placeholder="Descrição da tag"
            style="display:block; width:100%; margin-bottom:8px; padding:8px;"
          />
          <button
            type="button"
            (click)="removeTag(i)"
            style="padding: 6px 10px; margin-bottom: 8px; cursor: pointer;"
          >
            Remover tag
          </button>
        </div>
        <button
          type="button"
          (click)="addTag()"
          style="padding: 6px 10px; margin: 0 0 12px; cursor: pointer;"
        >
          Adicionar tag
        </button>

        <button
          (click)="saveTask()"
          style="padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          {{ editingTask() ? 'Atualizar Nota' : 'Salvar Nota' }}
        </button>
        <button
          *ngIf="editingTask()"
          (click)="cancelEdit()"
          style="padding: 10px 15px; margin-left: 8px; cursor: pointer;"
        >
          Cancelar
        </button>
      </div>

      <div style="margin-bottom: 20px;">
        <input
          [(ngModel)]="searchTerm"
          placeholder="Buscar por título..."
          style="width: 70%; padding: 8px;"
        />
        <button (click)="searchTask()" style="padding: 8px 12px; margin-left: 5px;">Buscar</button>
        <button (click)="loadTasks()" style="padding: 8px 12px; margin-left: 5px;">
          Listar Todas
        </button>
      </div>

      <h3>Lista de Notas</h3>
      <div *ngIf="tasks().length === 0">Nenhuma nota encontrada.</div>

      <div
        *ngFor="let t of tasks()"
        style="border: 1px solid #ddd; padding: 12px; border-radius: 6px; margin-bottom: 10px;"
      >
        <strong>{{ t.title }}</strong> (Autor: {{ t.autor }})
        <p>{{ t.content }}</p>
        <small style="color: #666;">Criado em: {{ t.creationDate }}</small>
        <div style="margin-top: 6px;">
          <strong>Tags:</strong>
          <span
            *ngFor="let tag of t.tags"
            style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-size: 12px;"
          >
            {{ tag.name }}
          </span>
        </div>
        <button
          *ngIf="t.id"
          (click)="editTask(t)"
          style="margin: 12px 8px 0 0; padding: 6px 10px; cursor: pointer;"
        >
          Editar
        </button>
        <button
          *ngIf="t.id"
          (click)="deleteTask(t)"
          style="margin-top: 12px; padding: 6px 10px; cursor: pointer;"
        >
          Excluir
        </button>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  tasks = signal<Task[]>([]);
  apiError = signal('');
  editingTask = signal<Task | null>(null);
  formTags = signal<Tag[]>([]);

  newTitle = '';
  newContent = '';
  newAutor = '';
  searchTerm = '';

  private apiUrl = 'http://localhost:3000/task';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.apiError.set('');
    this.http.get<Task[]>(this.apiUrl).subscribe((data) => {
      this.tasks.set(data);
    }, () => {
      this.apiError.set('Não foi possível carregar as tarefas. Verifique se o backend está em execução.');
    });
  }

  saveTask() {
    if (!this.newTitle.trim()) return;

    const taskBeingEdited = this.editingTask();
    const tags = this.formTags()
      .filter((tag) => tag.name.trim())
      .map((tag) => ({ ...tag, name: tag.name.trim() }));

    const task: Task = {
      ...(taskBeingEdited?.id ? { id: taskBeingEdited.id } : {}),
      title: this.newTitle,
      content: this.newContent,
      autor: this.newAutor,
      creationDate: taskBeingEdited?.creationDate ?? new Date().toISOString().split('T')[0],
      tags,
    };

    this.apiError.set('');
    if (taskBeingEdited?.id) {
      this.http.put<Task>(`${this.apiUrl}/${taskBeingEdited.id}`, task).subscribe({
        next: (updatedTask) => {
          this.tasks.update((currentTasks) =>
            currentTasks.map((currentTask) =>
              currentTask.id === taskBeingEdited.id
                ? { ...currentTask, ...updatedTask, id: taskBeingEdited.id }
                : currentTask,
            ),
          );
          this.cancelEdit();
          this.loadTasks();
        },
        error: () => {
          this.apiError.set('Não foi possível atualizar a nota. Verifique se o backend está em execução.');
        },
      });
      return;
    }

    this.http.post<Task>(this.apiUrl, task).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadTasks();
      },
      error: () => {
        this.apiError.set('Não foi possível salvar a nota. Verifique se o backend está em execução.');
      },
    });
  }

  editTask(task: Task) {
    this.editingTask.set(task);
    this.newTitle = task.title;
    this.newContent = task.content;
    this.newAutor = task.autor;
    this.formTags.set((task.tags ?? []).map((tag) => ({ ...tag })));
    this.apiError.set('');
  }

  addTag() {
    this.formTags.update((tags) => [...tags, { name: '', descricao: '' }]);
  }

  trackTagIndex(index: number, _tag: Tag): number {
    return index;
  }

  updateTag(index: number, field: 'name' | 'descricao', value: string) {
    this.formTags.update((tags) =>
      tags.map((tag, currentIndex) =>
        currentIndex === index ? { ...tag, [field]: value } : tag,
      ),
    );
  }

  removeTag(index: number) {
    this.formTags.update((tags) => tags.filter((_, currentIndex) => currentIndex !== index));
  }

  cancelEdit() {
    this.editingTask.set(null);
    this.newTitle = '';
    this.newContent = '';
    this.newAutor = '';
    this.formTags.set([]);
  }

  deleteTask(task: Task) {
    if (!task.id || !window.confirm(`Deseja excluir a nota "${task.title}"?`)) return;

    this.apiError.set('');
    this.http.delete<void>(`${this.apiUrl}/${task.id}`).subscribe({
      next: () => {
        if (this.editingTask()?.id === task.id) this.cancelEdit();
        this.loadTasks();
      },
      error: () => {
        this.apiError.set('Não foi possível excluir a nota. Verifique se o backend está em execução.');
      },
    });
  }

  searchTask() {
    if (!this.searchTerm) {
      this.loadTasks();
      return;
    }

    this.apiError.set('');
    this.http.get<Task[]>(`${this.apiUrl}/search/${this.searchTerm}`).subscribe((data) => {
      this.tasks.set(data);
    }, () => {
      this.apiError.set('Não foi possível buscar as tarefas. Verifique se o backend está em execução.');
    });
  }
}
