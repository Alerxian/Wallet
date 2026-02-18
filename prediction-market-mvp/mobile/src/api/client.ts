import ky, { type Options } from "ky";
import { z } from "zod";

type ApiOptions = {
  baseUrl: string;
  tokenProvider: () => string;
  onUnauthorized: () => void;
};

type ErrorLike = {
  message?: string;
};

function parseBody(raw: string): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

export class ApiClient {
  private readonly instance;
  private readonly onUnauthorized;

  constructor(options: ApiOptions) {
    this.instance = ky.create({
      prefixUrl: options.baseUrl,
      timeout: 20000,
      hooks: {
        beforeRequest: [
          (request) => {
            const token = options.tokenProvider();
            if (token) {
              request.headers.set("Authorization", `Bearer ${token}`);
            }
          },
        ],
      },
    });
    this.onUnauthorized = options.onUnauthorized;
  }

  async get<T>(path: string, schema: z.ZodSchema<T>, options?: Options): Promise<T> {
    return this.request("GET", path, schema, options);
  }

  async post<T>(path: string, schema: z.ZodSchema<T>, options?: Options): Promise<T> {
    return this.request("POST", path, schema, options);
  }

  private async request<T>(method: "GET" | "POST", path: string, schema: z.ZodSchema<T>, options?: Options): Promise<T> {
    const response = await this.instance(path, { ...options, method, throwHttpErrors: false });
    const raw = await response.text();
    const parsed = parseBody(raw) as ErrorLike;

    if (response.status === 401) {
      this.onUnauthorized();
      throw new Error(parsed.message || "Session expired");
    }

    if (!response.ok) {
      throw new Error(parsed.message || response.statusText || `HTTP ${response.status}`);
    }

    return schema.parse(parsed);
  }
}
