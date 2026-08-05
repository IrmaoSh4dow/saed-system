export interface IApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface IApiErrorResponse {
  success: false;
  message: string;
  errors: unknown[];
}

export type IApiResponse<T = unknown> = IApiSuccessResponse<T> | IApiErrorResponse;
