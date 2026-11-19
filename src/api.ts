const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
export const apiBase = () => BASE;
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('bestin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(`${BASE}${path}`, { ...options, headers }); }
  catch { throw new ApiError('Cannot reach Bestin. Check that the backend is running.', 0); }
  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try { const data: {detail?: unknown} = await response.json(); message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || message); } catch { /* retain status */ }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const json = (body: unknown): string => JSON.stringify(body);
export function upload(path: string, body: FormData, onProgress: (n: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('POST', `${BASE}${path}`);
    const token = localStorage.getItem('bestin_token'); if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else { try { reject(new Error(JSON.parse(xhr.responseText).detail || 'Upload failed')); } catch { reject(new Error('Upload failed')); } } };
    xhr.send(body);
  });
}
