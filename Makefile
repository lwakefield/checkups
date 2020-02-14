migrate:
	docker-compose run app node_modules/.bin/ts-node node_modules/.bin/knex migrate:latest

rollback:
	docker-compose run app node_modules/.bin/ts-node node_modules/.bin/knex migrate:rollback

seed:
	docker-compose run app node_modules/.bin/ts-node node_modules/.bin/knex seed:run
