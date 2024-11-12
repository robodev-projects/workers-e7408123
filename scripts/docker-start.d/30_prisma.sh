#!/bin/bash

. resources/prisma/.env

if [ "$DATABASE_AUTO_MIGRATE" = "true" ]; then
  # migrate prisma database
  yarn prisma migrate deploy
fi

