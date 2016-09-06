prefix = /usr/local

docker-build:
	docker build -t dbrock/dapple .
docker-install:
	install cmd/dapple-docker "$(prefix)/bin"
	install cmd/dapple-docker-shell "$(prefix)/bin"
