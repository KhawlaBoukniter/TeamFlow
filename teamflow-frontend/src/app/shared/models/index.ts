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
    ownerEmail?: string;
    startDate?: string;
    endDate?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    type?: 'PERSONAL' | 'TEAM';
    createdAt?: string;
    updatedAt?: string;
    totalTasks?: number;
    completedTasks?: number;
    progress?: number;
    team?: { id: number; userName: string; userEmail: string; }[];
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


export interface TaskAssignment {
    id: number;
    taskId: number;
    userId: number;
    userName?: string; // Enriched from User if needed
    userEmail?: string;
    roleInTask: 'RESPONSABLE' | 'CONTRIBUTOR' | 'OBSERVER';
    assignedAt: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
    columnId: number;
    blocked: boolean;
    position: number;
    assignments?: TaskAssignment[];
    assignees?: User[];
    subTasks?: SubTask[];
    comments?: Comment[];
    blockingTasks?: TaskSummary[];
    blockedTasks?: TaskSummary[];
}

export interface TaskSummary {
    id: number;
    title: string;
    priority: TaskPriority;
    blocked: boolean;
    columnId?: number;
    assignee?: User;
}

export interface SubTask {
    id: number;
    title: string;
    isDone: boolean;
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

export * from './auth.model';
