import {ConfigNamespace, PlainObject} from "./types";
import Joi from "joi";
import {DynamicModule, Logger, Module, Provider, ValueProvider} from "@nestjs/common";
import {getSource, initSourceCache} from "./source-cache";

const logger: Logger = new Logger('PlatformConfigModule', {timestamp: true});

export const ALL_CONFIG: unique symbol = Symbol('ALL_CONFIG');

export interface PlatformConfigModuleOptions {
    namespaces: ConfigNamespace[];
    validationOptions?: Joi.ValidationOptions;
}

@Module({})
export class PlatformConfigModule {
    static forRoot(options: PlatformConfigModuleOptions): DynamicModule {
        logger.log('Initializing PlatformConfigModule with namespaces: ' + options.namespaces.map(ns => ns.key).join(', '));
        initSourceCache();

        const src: PlainObject = getSource();

        const effectiveByKey: PlainObject = {};
        const providers: Provider[] = [];

        // Process each namespace
        for (const ns of options.namespaces) {
            logger.verbose(`Processing config namespace: ${ns.key}`);
            const effectiveConfig: PlainObject = ns.factory(src, process.env);
            effectiveByKey[ns.key] = effectiveConfig;

            providers.push({
                provide: ns.token,
                useValue: effectiveConfig
            });
        }

        logger.log('Starting config validation for namespaces: ' + options.namespaces.map(ns => ns.key).join(', '));
        const schemaShape: Record<string, Joi.ObjectSchema> = {};
        for (const ns of options.namespaces) {
            schemaShape[ns.key] = ns.validationSchema;
        }

        const rootSchema: Joi.ObjectSchema = Joi.object(schemaShape)
            .required()
            .unknown(false); // Prevent unknown keys at the root level

        // Validate the effective config
        const {error, value: validatedConfig} = rootSchema.validate(effectiveByKey, {
            abortEarly: false,
            allowUnknown: false,
            ...options.validationOptions
        });

        if (error) {
            logger.error(`Config validation failed with ${error?.details?.length} error(s)`);
            // Fail fast with actionable message
            const details = error.details.map((d) => `- ${d.path.join('.')}: ${d.message}`).join('\n');
            throw new Error(`Config validation error:\n${details}`);
        }

        // Provide the whole config as well.
        providers.push({
            provide: ALL_CONFIG,
            useValue: validatedConfig
        });

        logger.log(`Config validation succeeded for namespaces: ${options.namespaces.map(ns => ns.key).join(', ')}`);
        logger.log(`PlatformConfigModule initialized with ${providers.length} providers: ${providers.map(p => (p as ValueProvider).provide.toString()).join(', ')}`);
        return {
            module: PlatformConfigModule,
            global: true,
            providers,
            exports: providers.map((p: Provider) => (p as ValueProvider).provide),
        };
    }
}