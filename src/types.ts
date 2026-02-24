export interface Notice {
  id: number;
  title: string;
  content: string;
  category: 'Academic' | 'Event' | 'Exam' | 'General' | 'Emergency';
  priority: 'Low' | 'Medium' | 'High';
  author: string;
  createdAt: string;
  expiresAt?: string;
}

export type NoticeInput = Omit<Notice, 'id' | 'createdAt'>;

export type ServerEvent = 
  | { type: 'INITIAL_STATE'; notices: Notice[] }
  | { type: 'NOTICE_ADDED'; notice: Notice }
  | { type: 'NOTICE_DELETED'; id: number };

export type ClientEvent = 
  | { type: 'ADD_NOTICE'; notice: NoticeInput }
  | { type: 'DELETE_NOTICE'; id: number };
