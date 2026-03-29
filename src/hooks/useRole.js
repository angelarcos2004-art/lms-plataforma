import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../constants/roles'

export function useRole() {
  const { profile } = useAuth()

  const roleName = profile?.roles?.nombre ?? null

  return {
    role: roleName,
    isAdmin: roleName === ROLES.admin,
    isDocente: roleName === ROLES.docente,
    isEstudiante: roleName === ROLES.estudiante,
    isLoading: profile === null && roleName === null,
  }
}
