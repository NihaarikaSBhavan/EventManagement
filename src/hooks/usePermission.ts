import { can, type Permission } from '@/domain/rbac';
import { PERSONAS } from '@/domain/rbac';
import { useAppStore } from '@/store/useAppStore';

export function usePersona() {
  const id = useAppStore((s) => s.personaId);
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export function useCan(permission: Permission): boolean {
  return can(usePersona().role, permission);
}
