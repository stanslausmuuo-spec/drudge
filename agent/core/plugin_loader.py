import os
import importlib.util
import logging

logger = logging.getLogger("jarvis-plugin-loader")

class PluginLoader:
    def __init__(self, plugins_dir: str):
        self.plugins_dir = plugins_dir
        self.loaded_plugins = {}
        self.broken_plugins = {}

    def discover_and_load(self):
        if not os.path.exists(self.plugins_dir):
            os.makedirs(self.plugins_dir, exist_ok=True)
            return self.loaded_plugins

        for filename in os.listdir(self.plugins_dir):
            if filename.endswith(".py") and not filename.startswith("_"):
                plugin_path = os.path.join(self.plugins_dir, filename)
                plugin_name = filename[:-3]
                try:
                    spec = importlib.util.spec_from_file_location(plugin_name, plugin_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        if hasattr(module, "PLUGIN") and hasattr(module, "run") and hasattr(module, "SCHEMA"):
                            p_info = module.PLUGIN
                            if p_info.get("enabled", True):
                                self.loaded_plugins[plugin_name] = {
                                    "info": p_info,
                                    "schema": module.SCHEMA,
                                    "run": module.run,
                                    "module": module
                                }
                                logger.info("Successfully loaded plugin: %s", plugin_name)
                            else:
                                logger.info("Plugin %s is disabled in config.", plugin_name)
                        else:
                            self.broken_plugins[plugin_name] = "Missing PLUGIN dict, SCHEMA, or run function."
                            logger.warning("Plugin %s is missing required components.", plugin_name)
                except Exception as e:
                    self.broken_plugins[plugin_name] = str(e)
                    logger.error("Error loading plugin %s: %s", plugin_name, str(e))

        return self.loaded_plugins
