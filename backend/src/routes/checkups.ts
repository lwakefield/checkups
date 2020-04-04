import { assertAuthenticated } from '../session';
import { BadRequest, Unauthorized, } from '../errors';
import { getAllCheckupsForUser, getCheckupById, createCheckup } from '../repos/checkups';

function assertIndexQuery (query): asserts query is {
    type: 'inbound' | 'outbound';
} {
    const conditions = [
        ['inbound', 'outbound'].includes(query['type'])
    ];

    if (false === conditions.every(Boolean)) throw new BadRequest();
}

export async function index () {
    assertAuthenticated();
    assertIndexQuery(req.query);

    const checkups = await getAllCheckupsForUser(req.userId);

    res.send({ json: checkups });
}

function assertCreatePayload (payload): asserts payload is {
    url?: string;
    description?: string;
    crontab: string;
    type: 'outbound';
} {
    const outboundConditions = [
        typeof payload['url'] === 'string',
        typeof payload['crontab'] === 'string',
        payload['type'] === 'outbound',
    ];
    const inboundConditions = [
        typeof payload['description'] === 'string',
        typeof payload['crontab'] === 'string',
        payload['type'] === 'inbound',
    ];

    if (outboundConditions.every(Boolean) || inboundConditions.every(Boolean)) {
        return;
    }

    throw new BadRequest();
}

export async function create () {
    assertAuthenticated();
    assertCreatePayload(req.json);

    if (req.json.type === 'outbound') {
        const checkup = await createCheckup({ ...req.json, userId: req.userId })
        res.send({ status: 201, json: checkup });
    } else {
        throw new Error('Not Implemented');
    }
};


export async function show (id : string) {
    assertAuthenticated();

    const checkup = await getCheckupById(Number(id));

    if (checkup.userId !== req.userId) throw new Unauthorized();

    res.send({ json: checkup });
};
