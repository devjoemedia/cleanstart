#!/usr/bin/env node
import { run } from '../src/cli.js'

run(process.argv.slice(2)).catch((error) => {
  console.error(`\n  cleanstart failed: ${error.message}\n`)
  process.exit(1)
})
