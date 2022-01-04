"""Monaco component for Streamlit."""

from pathlib import Path
from typing import Optional

import streamlit.components.v1 as components
from streamlit.components.v1.components import CustomComponent

# Change to `False` when using webpack dev server
__release__ = True

if __release__:
    _source = {"path": (Path(__file__).parent / "frontend-build").resolve()}
else:
    _source = {"url": "http://localhost:3001"}

_monaco_editor = components.declare_component("monaco_editor", **_source)


def monaco_editor(
    value: str = "", schema: Optional[dict] = None, height: int = 600, key: str = None
) -> CustomComponent:
    """Render a Monaco Editor component."""
    return _monaco_editor(value=value, schema=schema or {}, height=height, key=key)
