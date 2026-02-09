import { Match } from '@/types';

type MatchUpdateData = Partial<Match> & { id: string };
type Listener = (data: MatchUpdateData) => void;

const listeners = new Set<Listener>();

export const matchUpdateEmitter = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  emit(data: MatchUpdateData) {
    listeners.forEach(fn => fn(data));
  },
};
