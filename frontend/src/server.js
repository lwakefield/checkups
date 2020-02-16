import sirv from 'sirv';
import polka from 'polka';
import fetch from 'node-fetch';
import compression from 'compression';
import * as sapper from '@sapper/server';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

async function authMiddleware (req, res, next) {
	console.log(req.headers.cookie);
	const auth = await fetch(
		`${process.env.BACKEND_API_URL}/whoami`,
		{
			credentials: 'include',
			headers: { cookie: req.headers.cookie }
		}
	);

	req.user = await (auth.ok ? auth.json() : null);

	next();
}

polka() // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		authMiddleware,
		sapper.middleware({
			session: (req, res) => ({ user: req.user })
		})
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
