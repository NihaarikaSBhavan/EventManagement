import { Lock } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { minimumRoleFor, type Permission } from '@/domain/rbac';
import { useCan } from '@/hooks/usePermission';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';

/**
 * Permission-aware action. When the current role lacks the permission the
 * control stays visible but disabled, with a tooltip naming the required role,
 * so the hierarchy is discoverable instead of silently hidden.
 */
export function GatedButton({ permission, allowed, children, ...props }: ButtonProps & { permission: Permission; allowed?: boolean }) {
  const permitted = useCan(permission) && allowed !== false;
  if (permitted) return <Button {...props}>{children}</Button>;
  return (
    <Tooltip content={`Requires ${minimumRoleFor(permission)} or above`}>
      <span tabIndex={0} className="inline-flex rounded-md">
        <Button {...props} onClick={undefined} disabled aria-disabled>
          <Lock aria-hidden />
          {children}
        </Button>
      </span>
    </Tooltip>
  );
}

export function IfCan({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactElement | null }) {
  return useCan(permission) ? <>{children}</> : fallback;
}
