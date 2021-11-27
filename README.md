# Our own docker

## Setup

Start fresh, clear `tmp`.

> npm run clean

## Deamon

Start the deamon - an express server executing commands in child process.

> npm run daemon

### Ignored

- Acting as DHCP for containers assigning ips
- No host to run daemon (or images/container)

## Docker CLI

### Build iamge

> npm run cli build .

Build the local `OurDockerfile` into images based off overlay2 storage driver. Run instructions 1 at a time, create new image layer.

#### Ignored

- Commit result of each instruction to new image layer.
- Use build cache
- image layer unique id is sha256 hash of image contents

### Run

> npm run cli run middle-layer

1. Creates a writeable container layer over the specified image (`tmp`).
2. Starts our container (virtualized runtime environment) using the specified command

#### Ignored

- Deleting container layer when stopped
- Container layer using stackable "copy-on-write" strategy
- Allow mounting volume
- Container not using DNS settings of the host (no host)

## Objects

- Daemon
- Images
- Containers
- Networks
- Storage
