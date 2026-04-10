export const REPRODUCTIVE_STATES = [
  'cycle',
  'planning',
  'pregnant',
  'postpartum',
] as const;

export type ReproductiveState = (typeof REPRODUCTIVE_STATES)[number];

export function toPrismaReproductiveState(state: ReproductiveState) {
  return state.toUpperCase() as 'CYCLE' | 'PLANNING' | 'PREGNANT' | 'POSTPARTUM';
}

export function fromPrismaReproductiveState(state: string): ReproductiveState {
  return state.toLowerCase() as ReproductiveState;
}
