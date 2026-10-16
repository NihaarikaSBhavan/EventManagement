import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Event and job-order detail dialogs are addressed by URL (?event=…, ?job=…)
 * so they are deep-linkable and open from any module without prop drilling.
 */
export function useEntityLinks() {
  const [params, setParams] = useSearchParams();
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
    eventCode: params.get('event'),
    jobNo: params.get('job'),
    openEvent: (code: string) => set('event', code),
    openJob: (no: string) => set('job', no),
    close: () => set('event', null),
  };
}
