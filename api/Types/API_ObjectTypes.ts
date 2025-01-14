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

export interface AudioFile {
  filePath: string;
  title: string;
  artist: string;
  album: string;
  genre: string[];
  year: number;
  track: number;
  albumArtist: string;
  composer: string[];
  discNumber: number;
  cover: {
    format: string;
    data: Uint8Array;
  }
}

export interface AudioUploadResponse {
  message: string;
  status: number;
  error: boolean;
  uploadData: AudioFile[];
}
