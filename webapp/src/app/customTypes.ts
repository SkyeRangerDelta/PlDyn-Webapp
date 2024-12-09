/**
 * Custom types for the application
 */

export interface AuthResult {
  status: number;
  message: string;
  success: boolean;
}

export interface ContributionTile {
  thumbnailUrl: string;
  title: string;
  status: string;
}

export interface NewUserRes {
  inserted: number;
  success: boolean;
}

export interface UpdatedUserRes {
  modified: number;
  success: boolean;
}

export interface DB_UserSettingRecord {
  jfId: string;
  clientSettings: ClientSettings;
}

export interface ClientSettings {
  lastUsedEditor: string;
}
