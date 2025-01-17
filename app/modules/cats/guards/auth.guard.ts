import { Guard, ExecutionContext } from '@aerie/core/types';

export class AuthGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const url = new URL(context.request.url);
    const auth = url.searchParams.get('auth');

    // For demo purposes, just check if auth=true
    if (!auth || auth !== 'true') {
      return false;
    }

    // In a real app, you would:
    // 1. Verify the auth token/session
    // 2. Get the user from the token/session
    // 3. Check user permissions
    // 4. Store user info in request context

    return true;
  }
}
