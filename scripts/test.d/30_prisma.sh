#!/bin/bash

set -e

# generate prisma client
yarn prisma:generate

export PRISMA_ENV_PATH=./resources/prisma/.test.env

# generate prisma environment file
yarn tsx src/database/prisma/scripts/bootstrap.ts

. $PRISMA_ENV_PATH

# inject .env into next command to override the default .env file
export $(cat $PRISMA_ENV_PATH | xargs)

# migrate database
yarn prisma migrate reset --force
