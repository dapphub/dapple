prefix = /usr/local

all:
	docker build -t dbrock/dapple .
install:
	install cmd/dapple-docker "$(prefix)/bin"
	install cmd/dapple-docker-shell "$(prefix)/bin"
