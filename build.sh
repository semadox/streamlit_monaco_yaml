#!/bin/bash

# https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -Eeuxo pipefail

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "$HERE"

rm -rf $HERE/dist
rm -rf $HERE/streamlit_monaco_yaml/frontend-build

cd $HERE/frontend
pnpm install
pnpm run build
cp public/index.html $HERE/streamlit_monaco_yaml/frontend-build/

cd $HERE
poetry build
