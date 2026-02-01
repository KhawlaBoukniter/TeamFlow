export interface User {
    id: number;
    email: string;
    fullName: string;
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
    isBlocked: boolean;
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
    createdAt: string;
}

export interface TaskAssignment {
    id: number;
    taskId: number;
    userId: number;
}

export * from './auth.model';
