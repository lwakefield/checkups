export class BadRequest extends Error {
    constructor() { super('Bad Request'); }
}

export class Unauthorized extends Error {
    constructor() { super('Unauthorized'); }
}

export class NotFound extends Error {
    constructor() { super('Not Found'); }
}
