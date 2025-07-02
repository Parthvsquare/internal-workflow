.PHONY: up down

up:
	docker-compose up -d

down:
	docker-compose down

add-debezium-connector:
	curl -X POST -H "Content-Type: application/json" --data @postgres-connector-config.json http://localhost:8083/connectors
