/**
 * Error handling utilities
 */

export class ApiError extends Error {
  statusCode?: number
  endpoint?: string

  constructor(message: string, statusCode?: number, endpoint?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.endpoint = endpoint
  }
}

export function handleApiError(error: unknown, context: string): never {
  if (error instanceof ApiError) {
    console.error(`API Error in ${context}:`, {
      message: error.message,
      statusCode: error.statusCode,
      endpoint: error.endpoint,
    })
    throw error
  }

  if (error instanceof Error) {
    console.error(`Error in ${context}:`, error.message)
    throw new ApiError(`${context}: ${error.message}`)
  }

  console.error(`Unknown error in ${context}:`, error)
  throw new ApiError(`${context}: Unknown error occurred`)
}

export function logError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, error.stack)
  } else {
    console.error(`[${context}]`, error)
  }
}
