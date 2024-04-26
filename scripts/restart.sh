#!/bin/bash
bun install --production
bun_path=$(which bun)
cwd=$(pwd)
pm2 restart --interpreter $bun_path $cwd/src/index.ts
