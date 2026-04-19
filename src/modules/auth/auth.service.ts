import { LoginResponse } from './auth.types';

export class AuthService {
  async login(_identifier: string, _password: string): Promise<LoginResponse> {
    // TODO: validate credentials against database, hash password comparison
    // Never return detailed error messages to the client on login failure
    throw new Error('Not implemented');
  }

  async logout(_token: string): Promise<void> {
    // TODO: invalidate session / token blacklist
    throw new Error('Not implemented');
  }
}
