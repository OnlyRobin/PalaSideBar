"""PalaSidebar Home Assistant custom integration.

Serves versioned frontend resources from custom_components (no /www needed).
The existing frontend/set_user_data preferences remain owned by Home Assistant.
"""

from __future__ import annotations

import logging
from pathlib import Path
from shutil import copy2

from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

DOMAIN = "pala_sidebar"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
_LOGGER = logging.getLogger(__name__)
_HERE = Path(__file__).resolve().parent
_FRONTEND = _HERE / "frontend"
_ASSET_URL = "/pala_sidebar/assets"
_CONFIG_URL = "/pala_sidebar/config.json"
_LOADER_URL = f"{_ASSET_URL}/pala-sidebar-loader.js"


def _pick_config_file(legacy_path: str) -> tuple[str, bool]:
    """Preserve a legacy config once. Never overwrite an existing new config."""
    preferred = _HERE / "pala-sidebar-config.json"
    if preferred.is_file():
        return str(preferred), False
    legacy = Path(legacy_path)
    if legacy.is_file():
        try:
            copy2(legacy, preferred)
        except OSError:
            # Read-only integrations can still use the legacy config until moved.
            _LOGGER.warning(
                "Unable to copy old PalaSidebar config. Using legacy config "
                "temporarily; copy it manually into %s", preferred
            )
            return str(legacy), False
        return str(preferred), True
    return str(_FRONTEND / "default-config.json"), False


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Allow discovery and UI setup via the config flow."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Make bundled frontend files available and auto-register one loader."""
    if DOMAIN in hass.data and hass.data[DOMAIN].get("installed"):
        return True
    config_file, migrated = await hass.async_add_executor_job(
        _pick_config_file, hass.config.path("www", "pala-sidebar-config.json")
    )
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(_ASSET_URL, str(_FRONTEND), cache_headers=False),
            StaticPathConfig(_CONFIG_URL, config_file, cache_headers=False),
        ]
    )
    add_extra_js_url(hass, _LOADER_URL)
    hass.data[DOMAIN] = {"installed": True, "config_file": config_file}
    if migrated:
        _LOGGER.info(
            "PalaSidebar %s: legacy configuration copied to %s; user settings "
            "and recovery points remain untouched",
            "2.0.0-rc2",
            config_file,
        )
    _LOGGER.info(
        "PalaSidebar frontend registered at %s (automatic module injection)",
        _LOADER_URL,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Stop injecting the loader; registered HTTP paths persist until restart."""
    if hass.data.pop(DOMAIN, None):
        remove_extra_js_url(hass, _LOADER_URL)
    return True
