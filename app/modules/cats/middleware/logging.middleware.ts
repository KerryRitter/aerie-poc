import { Injectable } from '~/aerie/core/decorators/injectable.decorator';
import { Middleware, NextFunction } from '~/aerie/core/types';

@Injectable()
export class LoggingMiddleware {
  async use(request: Request, response: Response, next: NextFunction) {
    const start = performance.now();
    console.log(`[Cats] ${request.method} ${request.url} - Started`);

    const result = await next();

    const duration = performance.now() - start;
    console.log(
      `[Cats] ${request.method} ${request.url} - Completed in ${duration.toFixed(3)}ms`
    );

    return result;
  }
}
