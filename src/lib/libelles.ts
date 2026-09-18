import type { ModeTransport, TypeLigne } from './types';

export const LIBELLE_MODE: Record<ModeTransport, string> = {
  bus_standard: 'Bus standard',
};

export const LIBELLE_TYPE: Record<TypeLigne, string> = {
  bus: 'Bus',
};

export function libelleMode(mode: ModeTransport): string {
  return LIBELLE_MODE[mode];
}

export function libelleType(type: TypeLigne): string {
  return LIBELLE_TYPE[type];
}
