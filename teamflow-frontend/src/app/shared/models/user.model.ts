export interface User {
    id: number;
    fullName: string;
    email: string;
    isActive: boolean;
    lastLogin?: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt?: string;
}
