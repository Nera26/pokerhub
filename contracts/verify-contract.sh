#!/usr/bin/env bash
set -euo pipefail

# Ensure OpenAPI contract matches backend schemas via contract tests
npm test --prefix backend -- "test/contracts/.*\\.contract\\.spec\\.ts"
