import { UserProfile } from '../../../types';

export interface FileManagerState {
  selectedUser: UserProfile | null;
  currentPath: string;
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'grid';
}

export interface FilePathSegment {
  label: string;
  path: string;
}

export type FileViewMode = 'list' | 'grid';