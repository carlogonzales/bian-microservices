import Joi from "joi";

export type PlainObject = Record<string, any>;

export type NamespaceKey = string;

export interface ConfigNamespace <T extends PlainObject = PlainObject> {
    key: NamespaceKey; // e.g. "db", "app"
    token: symbol; // injection token for this namespace
    factory: (src: PlainObject, env: NodeJS.ProcessEnv) => T; // Config factory
    validationSchema: Joi.ObjectSchema; // this if for validation of the config values in this namespace
    optional?: boolean;
}


type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Common configuration types
type BasicDBConfig = {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

type WithSchema = {
    schema: string;
}

export type URIDBConfig = {
    uri: string;
}

export type CommonDBPoolConfig = {
    maxPoolSize?: number;
    minPoolSize?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    maxLifetimeSeconds?: number;
}

export type DBWithSchemaConfig = BasicDBConfig & WithSchema;

export type DBConfig = (BasicDBConfig | DBWithSchemaConfig) & CommonDBPoolConfig;

export type ApiConfig = {
    port: number;
    globalPrefix: string;
}

export type AuthConfig = {
    jwtSecret: string;
    jwtExpiresIn: string;
}