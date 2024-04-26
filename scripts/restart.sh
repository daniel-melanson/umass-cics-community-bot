#!/bin/bash
bun install --production
bun_path=$(which bun)
cwd=$(pwd)
pm2 restart $cwd/pm2.config.js
