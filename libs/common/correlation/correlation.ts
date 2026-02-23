import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const INTERNAL_NAMESPACE_UUID: string = '8194cb10-9e06-495d-ad45-b617a263bbf0';
const DEFAULT_NAMESPACE: string = 'bian-microservice'; // predefined namespace
const DEFAULT_NAMESPACE_UUID: string = uuidv5(DEFAULT_NAMESPACE, INTERNAL_NAMESPACE_UUID);

type DeterministicCorrelation = {
  namespace: string;
  context: string;
};

type DefaultNamepsaceContextCorrelation = {
  namespace?: undefined;
  context: string;
}

type NoCorrelationInput = {
  namespace?: undefined;
  context?: undefined;
}

type CorrelationsOpts = {
  correlationId?: string;
} & (DeterministicCorrelation | DefaultNamepsaceContextCorrelation | NoCorrelationInput);

export function getOrCreateCorrelationId({
                                           correlationId,
                                           context,
                                           namespace,
                                         }: CorrelationsOpts = {}): string {
  if (correlationId && correlationId.trim().length > 0) {
    return correlationId;
  }

  if (!context) {
    return uuidv4();
  } else {
    if (!namespace) {
      return uuidv5(context, DEFAULT_NAMESPACE_UUID);
    } else {
      return uuidv5(context, uuidv5(namespace, DEFAULT_NAMESPACE_UUID));
    }
  }
}