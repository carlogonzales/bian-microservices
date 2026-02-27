import {ConfigNamespace} from "../platform-config/types";
import Joi from "joi";


export const GLOBAL_CONFIG: unique symbol = Symbol.for('GLOBAL_CONFIG');

const ENVIRONMENTS = ['dev', 'prod'] as const;
type Environment = typeof ENVIRONMENTS[number];

export interface GlobalConfig {
    appEnv: Environment;
    nodeEnv: Environment;
}

export const globalConfigNamespace: ConfigNamespace<GlobalConfig> = {
    key: 'global',
    token: GLOBAL_CONFIG,
    factory: (source, env): GlobalConfig => {
        return {
            appEnv: env.APP_ENV as Environment || 'dev',
            nodeEnv: env.NODE_ENV as Environment || 'dev',
        };
    },
    validationSchema: Joi.object<GlobalConfig>({
        appEnv: Joi.string().valid(...ENVIRONMENTS).required().message(`APP_ENV must be one of ${ENVIRONMENTS.join(', ')}`),
        nodeEnv: Joi.string().valid(...ENVIRONMENTS).required().message(`NODE_ENV must be one of ${ENVIRONMENTS.join(', ')}`),
    }).required(),
}