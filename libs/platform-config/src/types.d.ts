import Joi from "joi";
export type PlainObject = Record<string, any>;
export type NamespaceKey = string;
export interface ConfigNamespace<T extends PlainObject = PlainObject> {
    key: NamespaceKey;
    token: symbol;
    factory: (src: PlainObject, env: NodeJS.ProcessEnv) => T;
    validationSchema: Joi.ObjectSchema;
    optional?: boolean;
}
type BasicDBConfig = {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
};
type WithSchema = {
    schema: string;
};
export type URIDBConfig = {
    uri: string;
};
export type CommonDBPoolConfig = {
    maxPoolSize?: number;
    minPoolSize?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    maxLifetimeSeconds?: number;
};
export type DBWithSchemaConfig = BasicDBConfig & WithSchema;
export type DBConfig = (BasicDBConfig | DBWithSchemaConfig) & CommonDBPoolConfig;
export type ApiConfig = {
    port: number;
    globalPrefix: string;
};
export type AuthConfig = {
    jwtSecret: string;
    jwtExpiresIn: string;
};
export {};
