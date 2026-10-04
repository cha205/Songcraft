export const MODELS: string[]
export function buildRequest(task: string, payload: unknown): unknown
export function readResult(task: string, response: unknown, model: string): unknown
export function callBest(
  task: string,
  payload: unknown,
  run: (model: string, body: unknown) => Promise<{ ok: boolean; status: number; json: unknown }>,
): Promise<unknown>
