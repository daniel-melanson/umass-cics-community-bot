#!/bin/bash
bun install --production
bun_path=$(which bun)
pm2 restart --interpreter $bun_path ./src/index.ts
