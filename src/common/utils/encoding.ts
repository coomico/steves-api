export function encodeToBase64URL(data: any) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeFromBase64URL(s: string): any {
  return JSON.parse(Buffer.from(s, 'base64url').toString());
}
