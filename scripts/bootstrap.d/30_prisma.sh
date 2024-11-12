#!/bin/bash

# generate prisma environment file
if [ -f dist/database/prisma/scripts/bootstrap.js ]; then
  yarn node dist/database/prisma/scripts/bootstrap.js
else
  yarn tsx src/database/prisma/scripts/bootstrap.ts
fi
