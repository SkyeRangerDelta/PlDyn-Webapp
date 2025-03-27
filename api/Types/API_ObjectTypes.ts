import { IPicture } from "npm:music-metadata@10.7.0/lib/type.d.ts";

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
