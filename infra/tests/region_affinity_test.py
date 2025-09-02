#!/usr/bin/env python3
import pathlib
import yaml

root = pathlib.Path(__file__).resolve().parents[2]
kong_path = root / "infra" / "api-gateway" / "kong.yml"
with kong_path.open() as f:
    data = yaml.safe_load(f)

upstreams = {u['name']: u for u in data.get('upstreams', [])}
backend = upstreams.get('backend-upstream')
if not backend:
    raise SystemExit('backend-upstream not configured')

if backend.get('hash_on') != 'cookie':
    raise SystemExit('hash_on is not set to cookie')

cookie = backend.get('hash_on_cookie')
print('hash_on_cookie:', cookie)
print('targets:', [t['target'] for t in backend.get('targets', [])])
print('affinity configuration looks valid')
