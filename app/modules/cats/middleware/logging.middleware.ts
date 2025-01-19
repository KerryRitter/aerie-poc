import {
  Dependencies,
  Injectable,
  Middleware,
  NextFunction,
} from '@aerie/core';
import { LoggerService } from '@aerie/logging/logger.service';
import type { Logger } from 'pino';

@Injectable()
@Dependencies(LoggerService)
export class LoggingMiddleware implements Middleware {
  private logger: Logger;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.getLogger('CatsMiddleware');
  }

  async use(request: Request, response: Response, next: NextFunction) {
    const start = performance.now();
    this.logger.info(`${request.method} ${request.url} - Started`);

    const result = await next();

    const duration = performance.now() - start;
    this.logger.info(
      `${request.method} ${request.url} - Completed in ${duration.toFixed(3)}ms`
    );

    return result;
  }
}
