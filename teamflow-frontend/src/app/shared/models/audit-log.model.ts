export interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    details: string;
    userEmail: string;
    projectId?: number;
    createdAt: string;
}
