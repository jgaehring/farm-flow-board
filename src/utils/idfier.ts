import { validate } from 'uuid';
import { always, both, ifElse, pick, propIs, propSatisfies } from 'ramda';

export const isIdfier = both(
  propSatisfies(validate, 'id'),
  propIs(String, 'type'),
);

export const toIdfier = pick(['id', 'type']);

export const toOptionalIdfier = ifElse(
  isIdfier,
  toIdfier,
  always(null),
);
