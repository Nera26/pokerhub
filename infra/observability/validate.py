#!/usr/bin/env python3
import json
import pathlib
import sys

try:
    import yaml
except Exception as e:
    yaml = None

ROOT = pathlib.Path(__file__).parent

def validate_json(path: pathlib.Path):
    with path.open() as f:
        json.load(f)

def validate_yaml(path: pathlib.Path):
    if yaml is None:
        raise RuntimeError("PyYAML not installed")
    with path.open() as f:
        yaml.safe_load(f)

def main():
    for p in ROOT.glob('*.json'):
        validate_json(p)
    for p in ROOT.glob('*.yml'):
        validate_yaml(p)
    print('observability configs valid')

if __name__ == '__main__':
    main()
