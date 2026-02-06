import { User } from './user.model';
export * from './user.model';

export interface Membership {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    projectId: number;
    roleInProject: 'MANAGER' | 'MEMBER';
    joinedAt: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    ownerId: number;
    startDate?: string;
    endDate?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    type?: 'PERSONAL' | 'TEAM';
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectColumn {
    id: number;
    name: string;
    orderIndex: number;
    projectId: number;
    tasks?: Task[];
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
    columnId: number;
    blocked: boolean;  // Backend uses "blocked" not "isBlocked"
    position: number;
    assignees?: User[];
    subTasks?: SubTask[];
    comments?: Comment[];
}

export interface SubTask {
    id: number;
    title: string;
    completed: boolean;
    taskId: number;
}

export interface Comment {
    id: number;
    content: string;
    taskId: number;
    authorId: number;
    authorName?: string;
    createdAt: string;
}

export interface TaskAssignment {
    id: number;
    taskId: number;
    userId: number;
}

export * from './auth.model';
