import type { ErrorRequestHandler, RequestHandler } from 'express'

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message)
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'This API route does not exist.'))
}

export const handleError: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }
  let failure = new HttpError(500, 'INTERNAL_ERROR', 'Something went wrong.')
  if (error instanceof HttpError) {
    failure = error
  } else if (typeof error === 'object' && error && 'type' in error) {
    if (error.type === 'entity.parse.failed') failure = new HttpError(400, 'INVALID_JSON', 'The request body is invalid JSON.')
    if (error.type === 'entity.too.large') failure = new HttpError(413, 'BODY_TOO_LARGE', 'The request body exceeds the limit.')
  }
  if (failure.status >= 500) req.log?.error({ errorType: error instanceof Error ? error.name : typeof error }, 'Unhandled request error')
  res.status(failure.status).json({
    error: { code: failure.code, message: failure.message, requestId: req.id },
  })
}
