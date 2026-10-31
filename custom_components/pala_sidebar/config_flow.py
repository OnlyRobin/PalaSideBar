"""Simple single-instance UI setup for PalaSidebar."""

from homeassistant import config_entries
import voluptuous as vol

DOMAIN = "pala_sidebar"


class PalaSidebarConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Install PalaSidebar from Settings > Devices & services."""

    VERSION = 1

    async def async_step_user(self, user_input: dict | None = None):
        """Install once. No credentials or external connections required."""
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")
        if user_input is not None:
            return self.async_create_entry(title="PalaSidebar", data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))
