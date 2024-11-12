#!/bin/bash

# Prisma requires libssl-dev to build and procps to have at least ps available in the container.
apt -y update
apt -y install openssl libssl-dev procps ca-certificates
apt-get autoclean
apt-get clean
rm -rf /var/lib/apt && rm -rf /var/cache/apt
