#!/bin/sh
set -e
npm run db:setup
exec npm start
