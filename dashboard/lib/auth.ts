export function validateApiSecret(request: Request): boolean {
  return request.headers.get('x-laura-secret') === process.env.LAURA_API_SECRET
}
