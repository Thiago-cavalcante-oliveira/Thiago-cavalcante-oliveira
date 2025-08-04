// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

// Manual types
export interface Manual {
  id: string;
  title: string;
  description?: string;
  url: string;
  status: ManualStatus;
  content?: string;
  htmlContent?: string;
  screenshotPath?: string;
  metadata?: Record<string, any>;
  authorId: string;
  author: User;
  sections: ManualSection[];
  tags: ManualTag[];
  generations: Generation[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ManualStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ManualSection {
  id: string;
  title: string;
  content: string;
  type: SectionType;
  order: number;
  manualId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SectionType {
  INTRODUCTION = 'INTRODUCTION',
  STEP_BY_STEP = 'STEP_BY_STEP',
  FEATURES = 'FEATURES',
  TROUBLESHOOTING = 'TROUBLESHOOTING',
  FAQ = 'FAQ',
  CONCLUSION = 'CONCLUSION'
}

// Generation types
export interface Generation {
  id: string;
  status: GenerationStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  manualId: string;
  manual: Manual;
  createdAt: Date;
  updatedAt: Date;
}

export enum GenerationStatus {
  PENDING = 'PENDING',
  CRAWLING = 'CRAWLING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualTag {
  id: string;
  manualId: string;
  tagId: string;
  tag: Tag;
  createdAt: Date;
}

// Configuration types
export interface Configuration {
  id: string;
  key: string;
  value: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface CreateManualForm {
  title: string;
  description?: string;
  url: string;
  tags?: string[];
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export interface UpdateManualForm {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
}

export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Socket types
export interface SocketEvents {
  // Generation events
  'generation:progress': (data: GenerationProgressData) => void;
  'generation:completed': (data: GenerationCompletedData) => void;
  'generation:error': (data: GenerationErrorData) => void;
  
  // Manual events
  'manual:updated': (data: Manual) => void;
  'manual:deleted': (data: { id: string }) => void;
  
  // System events
  'notification': (data: NotificationData) => void;
  'user:connected': (data: { userId: string; timestamp: Date }) => void;
  'user:disconnected': (data: { userId: string; timestamp: Date }) => void;
}

export interface GenerationProgressData {
  generationId: string;
  manualId: string;
  status: GenerationStatus;
  progress: number;
  message?: string;
  timestamp: Date;
}

export interface GenerationCompletedData {
  generationId: string;
  manualId: string;
  manual: Manual;
  timestamp: Date;
}

export interface GenerationErrorData {
  generationId: string;
  manualId: string;
  error: string;
  timestamp: Date;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
}

// Search and Filter types
export interface SearchFilters {
  query?: string;
  status?: ManualStatus[];
  tags?: string[];
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  status: ManualStatus;
  author: {
    id: string;
    name: string;
  };
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  _score?: number;
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: NotificationData[];
  loading: boolean;
  error?: string;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'delete' | 'view';
  data?: any;
}

// Editor types
export interface EditorState {
  content: string;
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSaved?: Date;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

// Analytics types
export interface AnalyticsData {
  totalManuais: number;
  manuaisThisMonth: number;
  averageGenerationTime: number;
  successRate: number;
  topTags: Array<{
    name: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'updated' | 'deleted';
    manualTitle: string;
    authorName: string;
    timestamp: Date;
  }>;
}

// All types are already exported above