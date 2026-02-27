import { IPicture } from "music-metadata";

export interface JellyfinAuthenticateRequest {
  status: number;
  message: string;
  data?: any;
  username?: string;
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
  fileName: string;
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
    format: string | null;
    data: string | null;
  }
}

export interface RawAudioFile {
  filePath: string;
  fileName: string;
  title: string;
  artist: string;
  album: string;
  genre: string | string[];
  year: number;
  track: number;
  albumArtist: string;
  composer: string | string[];
  discNumber: number;
  cover: {
    format: string | null;
    data: string | null;
  }
}

export interface AudioUploadResponse {
  message: string;
  status: number;
  error: boolean;
  uploadData: AudioFile[];
}

export interface DeleteResponse {
  message: string;
  status: number;
  error: boolean;
}

export interface FinalizeUploadResponse {
  status: number;
  message: string;
  error: boolean;
  processedCount: number;
  failedFiles: FileProcessingError[];
}

export interface FileProcessingError {
  fileName: string;
  errorType: 'metadata_write' | 'file_move' | 'ffmpeg_not_found';
  errorMessage: string;
}
