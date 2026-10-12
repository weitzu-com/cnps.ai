export class GatewayError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function requireValue(condition, status, code) {
  if (!condition) throw new GatewayError(status, code);
}
