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