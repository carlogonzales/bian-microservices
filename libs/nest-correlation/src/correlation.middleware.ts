import { Injectable, NestMiddleware } from '@nestjs/common';
import {
    ensureCorrelationId,
    runWithCorrelationId,
    CORRELATION_ID_HEADER,
} from '@libs/common-correlation';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
    // XXX: Don't change this, I need to make it agnostic if express or fastify
    use(req: any, res: any, next: () => void) {
        const incoming = req.headers?.[CORRELATION_ID_HEADER];
        const correlationId = ensureCorrelationId(incoming);

        res.setHeader?.(CORRELATION_ID_HEADER, correlationId);

        runWithCorrelationId(correlationId, () => {
            next();
        });
    }
}