FROM ubuntu:15.10
ENV TIMESTAMP 2016-07-06

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash
RUN apt-get update && apt-get install -y nodejs

# Install Solidity
RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN add-apt-repository ppa:ethereum/ethereum-qt
RUN apt-get update && apt-get install -y cpp-ethereum

# Avoid su(1) and sudo(1) due to signal and TTY weirdness
RUN curl -fsSL https://github.com/tianon/gosu/releases/download/1.7/\
gosu-`dpkg --print-architecture` -o /bin/gosu && chmod +x /bin/gosu

# Install editors for convenience
RUN apt-get update && apt-get install -y emacs vim

# Install Dapple
RUN apt-get update && apt-get install -y git build-essential python
ENV TIMESTAMP 2016-07-19T20
COPY package.json /dapple/package.json
RUN cd dapple && npm install
ENTRYPOINT ["/dapple/docker-entrypoint"]
COPY . /dapple
RUN cd dapple && npm link
