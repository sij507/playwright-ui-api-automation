import { ApiClient } from './ApiClient';
import type { ApiResult, LoggedInUser, RegisteredUser, UserProfile } from './types';

export class UsersApiClient extends ApiClient {
  register(name: string, email: string, password: string): Promise<ApiResult<RegisteredUser>> {
    return this.send('POST', 'users/register', { form: { name, email, password } });
  }

  login(email: string, password: string): Promise<ApiResult<LoggedInUser>> {
    return this.send('POST', 'users/login', { form: { email, password } });
  }

  getProfile(token: string): Promise<ApiResult<UserProfile>> {
    return this.send('GET', 'users/profile', { headers: { 'x-auth-token': token } });
  }

  updateProfile(
    token: string,
    fields: { name: string; phone?: string; company?: string },
  ): Promise<ApiResult<UserProfile>> {
    return this.send('PATCH', 'users/profile', {
      form: { name: fields.name, phone: fields.phone ?? '', company: fields.company ?? '' },
      headers: { 'x-auth-token': token },
    });
  }

  changePassword(token: string, currentPassword: string, newPassword: string): Promise<ApiResult<undefined>> {
    return this.send('POST', 'users/change-password', {
      form: { currentPassword, newPassword },
      headers: { 'x-auth-token': token },
    });
  }

  logout(token: string): Promise<ApiResult<undefined>> {
    return this.send('DELETE', 'users/logout', { headers: { 'x-auth-token': token } });
  }

  deleteAccount(token: string): Promise<ApiResult<undefined>> {
    return this.send('DELETE', 'users/delete-account', { headers: { 'x-auth-token': token } });
  }
}
