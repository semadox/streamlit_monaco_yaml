# Streamlit Monaco Yaml

## Installation

```
poetry add streamlit-monaco-yaml
# or
pip install streamlit-monaco-yaml
```

## Getting started

```python
result = monaco_editor(
    initial_text,
    schema=json_schema,
    height=1000,
    # a unique key avoids to reload the editor each time the content changed
    key=f"monaco_editor",
)
```

## Development

Install [Node.js](https://nodejs.org/en/) and [pnpm](https://pnpm.io/).
Then modify `streamlit_monaco_yaml/__init__.py` and replace:

```python
__release__ = True
```

with

```python
__release__ = False
```

Then install the package from the local folder, go to `frontend/` and run
these commands:

```sh
pnpm install
pnpm start
```
