// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'MODERATOR';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// News types
export interface News {
  id: string;
  titleRu: string;
  titleEn?: string;
  contentRu: string;
  contentEn?: string;
  excerptRu?: string;
  excerptEn?: string;
  featuredImage?: string;
  published: boolean;
  publishedAt?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
  };
  tags?: NewsTag[];
  categories?: NewsCategory[];
  comments?: Comment[];
  commentsCount?: number;
}

// News Tag types
export interface NewsTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// News Category types
export interface NewsCategory {
  id: string;
  nameRu: string;
  nameEn?: string;
  slug: string;
  description?: string;
  color?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface Comment {
  id: string;
  newsId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  moderatedBy?: string;
  moderatedAt?: string;
  parentId?: string;
  replies?: Comment[];
}

// Page types
export interface Page {
  id: string;
  slug: string;
  titleRu: string;
  titleEn?: string;
  contentRu: string;
  contentEn?: string;
  metaTitleRu?: string;
  metaTitleEn?: string;
  metaDescriptionRu?: string;
  metaDescriptionEn?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
  };
}

// Department types
export interface Department {
  id: string;
  nameRu: string;
  nameEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  parentId?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    nameRu: string;
    nameEn?: string;
  };
  children: Department[];
  employees: Employee[];
  contacts: Contact[];
}

// Employee types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  positionRu: string;
  positionEn?: string;
  photo?: string;
  email?: string;
  phone?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    nameRu: string;
    nameEn?: string;
  };
}

// Contact types
export interface Contact {
  id: string;
  type: 'PHONE' | 'EMAIL' | 'ADDRESS' | 'WEBSITE' | 'FAX';
  value: string;
  label?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appeal types
export interface Appeal {
  id: string;
  ticketNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachments: string[];
  status: 'NEW' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
  responder?: {
    id: string;
    name: string;
  };
}

// Banner types
export interface Banner {
  id: string;
  titleRu: string;
  titleEn?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  image?: string;
  link?: string;
  position: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// File types
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  scanned: boolean;
  safe: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface NewsFormData {
  titleRu: string;
  titleEn?: string;
  contentRu: string;
  contentEn?: string;
  excerptRu?: string;
  excerptEn?: string;
  featuredImage?: string;
  published: boolean;
  tagIds?: string[];
  categoryIds?: string[];
}

export interface CommentFormData {
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string;
}

export interface TagFormData {
  name: string;
  slug: string;
  color?: string;
}

export interface CategoryFormData {
  nameRu: string;
  nameEn?: string;
  slug: string;
  description?: string;
  color?: string;
  order: number;
  active: boolean;
}

export interface PageFormData {
  slug: string;
  titleRu: string;
  titleEn?: string;
  contentRu: string;
  contentEn?: string;
  metaTitleRu?: string;
  metaTitleEn?: string;
  metaDescriptionRu?: string;
  metaDescriptionEn?: string;
  published: boolean;
}

export interface AppealFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachments?: File[];
}

// Notification types
export interface Notification {
  id: string;
  type: 'NEW_APPEAL' | 'APPEAL_UPDATED' | 'NEW_COMMENT' | 'SYSTEM_ALERT' | 'BACKUP_SUCCESS' | 'BACKUP_FAILED' | 'SECURITY_ALERT' | 'NEWS_PUBLISHED';
  title: string;
  message: string;
  data?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface AnalyticsStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: Array<{ page: string; views: number }>;
  visitsByDay: Array<{ date: string; visits: number }>;
  visitsByHour: Array<{ hour: number; visits: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
}

export interface RealTimeStats {
  visitsLastHour: number;
  visitsToday: number;
  activePages: Array<{ page: string; visits: number }>;
}

export interface DashboardAnalytics {
  today: AnalyticsStats;
  week: AnalyticsStats;
  month: AnalyticsStats;
  realTime: RealTimeStats;
  growth: {
    daily: number;
  };
}