import { toast } from 'sonner';
import type { ActionResult } from '@/store/useAppStore';

/** Runs a store action and surfaces its result. Returns whether it succeeded. */
export function notify(result: ActionResult): boolean {
  if (!result.message) return result.ok;
  if (!result.ok || result.tone === 'error') toast.error(result.message);
  else if (result.tone === 'warning') toast.warning(result.message);
  else toast.success(result.message);
  return result.ok;
}
