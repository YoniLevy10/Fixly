export class NotFoundError extends Error {
  readonly status = 404

  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  readonly status = 409

  constructor(message = 'Conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends Error {
  readonly status = 400

  constructor(message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}
