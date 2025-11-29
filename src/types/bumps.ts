export interface BumpMutationErrorDetails {
  error?: string;
  nextAvailableAt?: number | null;
  raw?: string;
  [key: string]: unknown;
}

export interface BumpMutationError extends Error {
  status?: number;
  details?: BumpMutationErrorDetails;
}

export interface BumpMutationSuccess {
  success: boolean;
  nextAvailableAt?: number;
  source?: string;
}

export type BumpMutationResponse = BumpMutationSuccess;
