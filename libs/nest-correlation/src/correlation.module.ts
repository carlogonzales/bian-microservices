import { Module } from '@nestjs/common';
import { CorrelationMiddleware } from './correlation.middleware.js';


@Module({
    providers: [CorrelationMiddleware],
    exports: [CorrelationMiddleware],
})
export class CorrelationModule {}