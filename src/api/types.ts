import type { NoteCategory } from '../data/notes';

export interface ApiEnvelope<T = undefined> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

export interface LoggedInUser extends RegisteredUser {
  token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  category: NoteCategory;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Wraps every API call's raw HTTP status alongside the already-parsed JSON
// body, so tests can assert on both without re-touching the APIResponse.
export interface ApiResult<T> {
  status: number;
  ok: boolean;
  body: ApiEnvelope<T>;
}
