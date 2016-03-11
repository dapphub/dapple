prefix = /usr/local
docker-install:
	install cmd/dapple-docker "$(prefix)/bin"
	install cmd/dapple-docker-shell "$(prefix)/bin"
