export function formatError(err) {
  if (err instanceof Error) {
    return {
      error: err.message || err.name || 'Unknown error',
      details: 'code' in err || 'stack' in err ? { code: err.code, stack: err.stack } : undefined,
    }
  }

  if (typeof err === 'string') {
    return { error: err }
  }

  if (err && typeof err === 'object') {
    const maybeMessage =
      'message' in err && typeof err.message === 'string' && err.message.trim()
        ? err.message
        : JSON.stringify(err)

    return {
      error: maybeMessage || 'Unknown error',
      details: err,
    }
  }

  return { error: 'Unknown error' }
}
