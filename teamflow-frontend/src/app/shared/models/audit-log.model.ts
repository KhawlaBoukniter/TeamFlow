export interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId: number;
    details: string;
    performedByEmail: string;
    createdAt: string;
}
