import { query } from '../db';
import { assertAuthenticated } from '../session';

export async function index () {
    assertAuthenticated();

    const [ user ] = await query`
        select id, email from users
        where id=${req.userId}
    `;

    res.send({ json: user });
}
