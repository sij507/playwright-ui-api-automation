import { ApiClient } from './ApiClient';
import type { NoteCategory } from '../data/notes';
import type { ApiResult, Note } from './types';

export class NotesApiClient extends ApiClient {
  create(
    token: string,
    note: { title: string; description: string; category: NoteCategory },
  ): Promise<ApiResult<Note>> {
    return this.send('POST', 'notes', { form: { ...note }, headers: { 'x-auth-token': token } });
  }

  getAll(token: string): Promise<ApiResult<Note[]>> {
    return this.send('GET', 'notes', { headers: { 'x-auth-token': token } });
  }

  getById(token: string, id: string): Promise<ApiResult<Note>> {
    return this.send('GET', `notes/${id}`, { headers: { 'x-auth-token': token } });
  }

  update(
    token: string,
    id: string,
    note: { title: string; description: string; category: NoteCategory; completed: boolean },
  ): Promise<ApiResult<Note>> {
    return this.send('PUT', `notes/${id}`, { form: { ...note }, headers: { 'x-auth-token': token } });
  }

  updateCompletedStatus(token: string, id: string, completed: boolean): Promise<ApiResult<Note>> {
    return this.send('PATCH', `notes/${id}`, { form: { completed }, headers: { 'x-auth-token': token } });
  }

  delete(token: string, id: string): Promise<ApiResult<undefined>> {
    return this.send('DELETE', `notes/${id}`, { headers: { 'x-auth-token': token } });
  }
}
