const EMAIL_RGX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmail (val): boolean {
    if (typeof val !== 'string') return false;

    return EMAIL_RGX.test(val);
}

export function groupBy (vals, predicate) {
    const res = {};

    for (const val of vals) {
        const id = predicate(val);

        if (res[id] === undefined) res[id] = [];

        res[id].push(val);
    }

    return res;
}

export function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

