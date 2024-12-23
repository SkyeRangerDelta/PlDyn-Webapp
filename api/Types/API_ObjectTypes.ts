export interface JellyfinAuthenticateRequest {
  status: number;
  message: string;
  data?: any;
}

export interface JellyfinContributionsResponse {
  message: string;
  data: {
    contributions: JellyfinContribution[];
    errorMessage: string;
  }
}

export interface JellyfinContribution {
  title: string;
  description: string;
  recordId: string;
}