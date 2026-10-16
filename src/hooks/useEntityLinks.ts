import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Events open their workspace page; job orders open a detail dialog addressed
 * by URL (?job=…) so it is deep-linkable from any screen.
 */
export function useEntityLinks() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const set = useCallback(
    (key: 'event' | 'job', value: string | null) =>
      setParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('event');
        next.delete('job');
        if (value) next.set(key, value);
        return next;
      }),
    [setParams],
  );
  return {
    jobNo: params.get('job'),
    openEvent: (code: string, tab?: string) => navigate(`/events/${code}${tab ? `?tab=${tab}` : ''}`),
    openJob: (no: string) => set('job', no),
    close: () => set('event', null),
  };
}
