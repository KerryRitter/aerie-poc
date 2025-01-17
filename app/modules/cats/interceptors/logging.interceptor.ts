import { Interceptor, ExecutionContext, CallHandler } from '@aerie/core/types';

export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    console.log('Before...');
    const start = Date.now();

    try {
      const result = await next.handle();
      const duration = Date.now() - start;
      console.log(`After... ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`Error after ${duration}ms:`, error);
      throw error;
    }
  }
}
