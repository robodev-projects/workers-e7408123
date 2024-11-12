import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import { TraceService } from 'nestjs-otel';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class OtelInterceptor implements NestInterceptor {
  constructor(private readonly traceService: TraceService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const span = this.traceService.getSpan();

    return next.handle().pipe(
      catchError((err) => {
        if (span) {
          span.recordException(err);
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        }
        return throwError(() => err);
      }),
    );
  }
}
