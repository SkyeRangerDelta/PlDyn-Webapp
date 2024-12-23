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

export interface ContributionObject {
  title: string;
  description: string;
  recordId: string;
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

export interface ClientSettingsResult {
  status: number;
  message: string;
  settings: ClientSettings;
  success: boolean;
}

export interface ClientContributionResult {
  message: string,
  data: {
    contributions: ContributionObject[],
    errorMessage: string
  }
}
