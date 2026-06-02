import os
import logging
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

@tool
def get_user_guide() -> str:
    """
    Use this tool when the user asks for the user guide, manual, instructions, or documentation for the TradingAgents system.
    """
    try:
        # Locate the README.md from the root directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # app/agent_core/tools/ -> app/agent_core/ -> app/ -> trading-be/ -> root
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
        readme_path = os.path.join(root_dir, "README.md")
        
        if os.path.exists(readme_path):
            with open(readme_path, "r", encoding="utf-8") as f:
                return f.read()
        else:
            return "User guide not found on the server."
    except Exception as e:
        logger.error(f"Failed to read user guide: {e}")
        return "Failed to load the user guide."
