export class EmailAlreadyExistsError extends Error {
  constructor(cause: unknown) {
    super('Email is already registered', { cause });
    this.name = 'EmailAlreadyExistsError';
  }
}
