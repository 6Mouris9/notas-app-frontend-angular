import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/task';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  searchByTitle(title: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/search/${title}`);
  }
}
