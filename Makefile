install:
	docker-compose run --no-deps backend yarn install
	docker-compose run --no-deps frontend yarn install
	docker-compose run --no-deps test-service yarn install

migrate:
	docker-compose run backend node_modules/.bin/ts-node node_modules/.bin/knex migrate:latest

rollback:
	docker-compose run backend node_modules/.bin/ts-node node_modules/.bin/knex migrate:rollback

seed:
	docker-compose run backend node_modules/.bin/ts-node node_modules/.bin/knex seed:run

start:
	docker-compose up

setup: install migrate seed

