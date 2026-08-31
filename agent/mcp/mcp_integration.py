import os
import logging

logger = logging.getLogger("jarvis-mcp")

try:
    from mcp_client import MCPServerSse
    from mcp_client.agent_tools import MCPToolsIntegration
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

async def integrate_mcp_tools(agent_class, agent_kwargs, mcp_url: str = None):
    """Integrate MCP server tools dynamically if MCP client is installed and URL provided."""
    url = mcp_url or os.environ.get("N8N_MCP_SERVER_URL")
    if not MCP_AVAILABLE or not url:
        logger.info("MCP client not available or N8N_MCP_SERVER_URL not set. Skipping MCP integration.")
        return agent_class(**agent_kwargs)

    try:
        mcp_server = MCPServerSse(
            params={"url": url},
            cache_tools_list=True,
            name="SSE MCP Server"
        )
        agent = await MCPToolsIntegration.create_agent_with_tools(
            agent_class=agent_class,
            agent_kwargs=agent_kwargs,
            mcp_servers=[mcp_server]
        )
        logger.info("Successfully integrated MCP server tools from %s", url)
        return agent
    except Exception as e:
        logger.warning("Failed to connect to MCP server at %s: %s. Using default agent.", url, e)
        return agent_class(**agent_kwargs)
