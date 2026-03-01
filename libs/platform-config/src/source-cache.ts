import {PlainObject} from "./types";
import {loadYamlSource} from "./yaml-source.loader";
import {Logger} from "@nestjs/common";

const logger: Logger = new Logger('YamlConfigCache', { timestamp: true });

let cached: PlainObject | null = null;

export function initSourceCache() {
    logger.log('Initialize config source cache');
    if (!cached) cached = loadYamlSource();
}

export function getSource(): PlainObject {
    if (!cached) cached = loadYamlSource();
    return cached;
}

// helpful in tests
export function resetSourceCacheForTests() {
    cached = null;
}