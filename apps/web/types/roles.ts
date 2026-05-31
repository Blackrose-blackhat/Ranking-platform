export enum Role {
  SUPER_ADMIN = 'super_admin',
  INSTITUTION_ADMIN = 'institution_admin',
  DEPARTMENT_COORDINATOR = 'department_coordinator',
  FACULTY = 'faculty',
  AUDITOR = 'auditor',
}

export const formatRole = (role: string) => {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
