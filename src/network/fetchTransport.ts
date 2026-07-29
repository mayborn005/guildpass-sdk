import type { FetchLike } from '../http/http.types';
import type { HttpTransport, TransportRequest, TransportResponse } from './transport.types';
import { GuildPassConfigError } from '../errors/errorTypes';
import { GuildPassErrorCode } from '../errors/errorCodes';

export class FetchTransport implements HttpTransport {
  private readonly fetchFn?: FetchLike;

  constructor(fetchFn?: FetchLike) {
    this.fetchFn = fetchFn;
  }

  private getFetch(): FetchLike {
    return this.fetchFn ?? globalThis.fetch;
  }

  public async execute(request: TransportRequest): Promise<TransportResponse> {
    const fn = this.getFetch();
    if (typeof fn !== 'function') {
      throw new GuildPassConfigError('A fetch-compatible transport is required.', GuildPassErrorCode.INVALID_CONFIG);
    }

    const response = await fn(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: request.signal,
    });

    return {
      status: response.status,
      ok: response.ok,
      getHeader(name: string): string | null {
        return response.headers?.get ? response.headers.get(name) : null;
      },
      getHeaders(): Record<string, string> {
        const result: Record<string, string> = {};
        const h = response.headers;
        if (h?.forEach) {
          h.forEach((value, key) => { result[key] = value; });
        }
        return result;
      },
      json<T = any>(): Promise<T> {
        return response.json();
      },
    };
  }
}
