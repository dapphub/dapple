FROM ubuntu:15.10

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash
RUN apt-get update && apt-get install -y nodejs

# Install Solidity
RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN add-apt-repository ppa:ethereum/ethereum-qt
RUN apt-get update && apt-get install -y cpp-ethereum

# Install Dapple
RUN apt-get update && apt-get install -y git build-essential python
ENTRYPOINT ["dapple"]
COPY package.json /dapple/package.json
RUN cd dapple && npm install
COPY . /dapple
RUN cd dapple && npm link
