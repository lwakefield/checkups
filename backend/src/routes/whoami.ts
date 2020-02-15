import { query } from '../db';

export async function index () {
    if (!req.isAuthenticated) throw new Error('Unauthorized'); 

    const [ user ] = await query`
        select id, email from users
        where id=${req.userId}
    `;

    res.send({ json: user });
}
