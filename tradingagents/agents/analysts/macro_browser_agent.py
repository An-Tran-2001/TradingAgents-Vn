import os
import asyncio
import logging
from typing import Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import tool, StructuredTool
from pydantic import BaseModel, Field
from langgraph.prebuilt import create_react_agent
from tradingagents.dataflows.config import get_config
import json

logger = logging.getLogger(__name__)


async def stream_browser_research(
    query: str, start_url: str = "https://www.google.com", config: dict = None, browser_id: str = None
):
    """
    Spins up a headless browser, creates a LangGraph ReAct Agent with Playwright tools,
    and commands the agent to navigate the website to find the requested data.
    """
    if not browser_id:
        import uuid
        browser_id = str(uuid.uuid4())[:8]

    try:
        from langchain_community.agent_toolkits.playwright.toolkit import (
            PlayWrightBrowserToolkit,
        )
        from playwright.async_api import async_playwright
        from tradingagents.llm_clients.factory import create_llm_client
    except ImportError as e:
        logger.error(f"Missing required packages: {e}")
        yield {
            "type": "final_result",
            "content": "Lỗi: Không tìm thấy thư viện Playwright. Cần chạy `pip install playwright lxml` và `playwright install`.",
        }
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        toolkit = PlayWrightBrowserToolkit.from_browser(async_browser=browser)
        tools = toolkit.get_tools()

        # Add custom tools for form interaction
        async def get_page():
            from langchain_community.tools.playwright.utils import aget_current_page
            return await aget_current_page(browser)

        class FillToolInput(BaseModel):
            selector: str = Field(..., description="CSS selector for the input element")
            text: str = Field(..., description="Text to fill")

        async def fill_element(selector: str, text: str) -> str:
            """Fill an input element with text."""
            page = await get_page()
            try:
                await page.fill(selector, text, timeout=3000)
                return f"Filled element '{selector}' with '{text}'"
            except Exception as e:
                return f"Failed to fill element: {e}"

        class SelectOptionToolInput(BaseModel):
            selector: str = Field(..., description="CSS selector for the <select> element")
            value: str = Field(..., description="Value or label of the option to select")

        async def select_option(selector: str, value: str) -> str:
            """Select an option in a <select> element by value or label."""
            page = await get_page()
            try:
                await page.select_option(selector, value, timeout=3000)
                return f"Selected option '{value}' for element '{selector}'"
            except Exception as e:
                return f"Failed to select option: {e}"

        class CheckboxToolInput(BaseModel):
            selector: str = Field(..., description="CSS selector for the checkbox element")

        async def check_checkbox(selector: str) -> str:
            """Check a checkbox element."""
            page = await get_page()
            try:
                await page.check(selector, timeout=3000)
                return f"Checked element '{selector}'"
            except Exception as e:
                return f"Failed to check element: {e}"

        class GetSelectOptionsInput(BaseModel):
            selector: str = Field(..., description="CSS selector for the <select> element")

        async def get_select_options(selector: str) -> str:
            """Get all available options for a <select> element."""
            page = await get_page()
            try:
                options = await page.eval_on_selector(
                    selector,
                    "el => Array.from(el.options).map(o => ({text: o.text, value: o.value}))"
                )
                return f"Options for '{selector}': {json.dumps(options, ensure_ascii=False)}"
            except Exception as e:
                return f"Failed to get options: {e}"

        class GetDOMSnippetInput(BaseModel):
            selector: str = Field(..., description="CSS selector to get the inner HTML of")

        async def get_dom_snippet(selector: str) -> str:
            """Get the inner HTML of an element to understand its structure, useful for complex forms."""
            page = await get_page()
            try:
                html = await page.inner_html(selector, timeout=3000)
                return html[:3000] # truncate to avoid huge context
            except Exception as e:
                return f"Failed to get DOM snippet: {e}"

        class ScrollToolInput(BaseModel):
            direction: str = Field(..., description="Direction to scroll: 'down' or 'up'")
            amount: int = Field(default=500, description="Amount in pixels to scroll")

        async def scroll_browser(direction: str, amount: int) -> str:
            """Scroll the current web page up or down to see more content or load lazy elements."""
            page = await get_page()
            try:
                if direction == "down":
                    await page.evaluate(f"window.scrollBy(0, {amount})")
                else:
                    await page.evaluate(f"window.scrollBy(0, -{amount})")
                import asyncio
                await asyncio.sleep(1) # Wait for lazy content
                return f"Scrolled {direction} by {amount} pixels"
            except Exception as e:
                return f"Failed to scroll: {e}"

        class HoverToolInput(BaseModel):
            selector: str = Field(..., description="CSS selector for the element to hover over")

        async def hover_element(selector: str) -> str:
            """Hover the mouse over an element. Useful for opening dropdown menus or tooltips."""
            page = await get_page()
            try:
                await page.hover(selector, timeout=3000)
                import asyncio
                await asyncio.sleep(0.5)
                return f"Hovered over element '{selector}'"
            except Exception as e:
                return f"Failed to hover: {e}"

        fill_tool = StructuredTool.from_function(
            coroutine=fill_element,
            name="fill_element",
            description="Fill a text input field with the specified text.",
            args_schema=FillToolInput,
        )
        select_tool = StructuredTool.from_function(
            coroutine=select_option,
            name="select_option",
            description="Select an option from a dropdown (<select>) element by its value or text label.",
            args_schema=SelectOptionToolInput,
        )
        check_tool = StructuredTool.from_function(
            coroutine=check_checkbox,
            name="check_checkbox",
            description="Check a checkbox element.",
            args_schema=CheckboxToolInput,
        )
        get_options_tool = StructuredTool.from_function(
            coroutine=get_select_options,
            name="get_select_options",
            description="Get all available options (text and value) for a dropdown (<select>) element to help you decide what to select.",
            args_schema=GetSelectOptionsInput,
        )
        get_dom_tool = StructuredTool.from_function(
            coroutine=get_dom_snippet,
            name="get_dom_snippet",
            description="Get the inner HTML of an element to understand its structure. Use this on a form or complex widget to see how to interact with it.",
            args_schema=GetDOMSnippetInput,
        )
        scroll_tool = StructuredTool.from_function(
            coroutine=scroll_browser,
            name="scroll_browser",
            description="Scroll the page up or down to reveal hidden or lazy-loaded content.",
            args_schema=ScrollToolInput,
        )
        hover_tool = StructuredTool.from_function(
            coroutine=hover_element,
            name="hover_element",
            description="Hover over an element to reveal tooltips or hidden dropdown menus.",
            args_schema=HoverToolInput,
        )

        tools.extend([fill_tool, select_tool, check_tool, get_options_tool, get_dom_tool, scroll_tool, hover_tool])

        configurable = config.get("configurable", {}) if config else {}
        global_config = get_config()

        provider = configurable.get("provider") or global_config.get(
            "llm_provider", "openai"
        )
        model = configurable.get("model") or global_config.get(
            "quick_think_llm", "gpt-4o"
        )
        api_key = (
            configurable.get("api_key")
            or global_config.get("api_key")
            or os.environ.get("OPENAI_API_KEY", "")
        )

        # We use the current driving brain
        try:
            client = create_llm_client(
                provider=provider, model=model, api_key=api_key, temperature=0.0
            )
            llm = client.get_llm()
        except Exception as e:
            logger.warning(
                f"Failed to create LLM from config: {e}. Falling back to default."
            )
            llm = ChatOpenAI(model="gpt-4o", temperature=0.0, api_key=api_key)

        system_prompt = SystemMessage(
            content="""You are an autonomous Web Browser Agent. Your primary goal is to find, extract, and summarize macroeconomic data accurately.
You have access to a real headless browser and various tools to interact with web pages.

### CORE STRATEGY & AUTONOMY:
- **Be Proactive & Exploratory**: You are not bound by a strict sequence. When you navigate to a page, observe the content. If you see a search bar, use it. If you see navigation menus, explore them. If you cannot see the content, try using 'scroll_browser' to scroll down.
- **Start at the Source**: Begin by navigating to the user's requested URL.
- **Intelligent Fallback**: If the starting URL does not yield the required data, is unresponsive, or you feel stuck, YOU HAVE FULL AUTHORITY to abandon it and use 'navigate_browser' to search on Google: `https://www.google.com/search?q=<your_query>`. Use Google to find alternative authoritative sources (e.g., CafeF, VnEconomy, GSO).

### HANDLING FORMS & COMPLEX UI:
- **Understand Before Acting**: If you encounter a complex form or dropdown, do not guess. Use 'get_dom_snippet' or 'get_select_options' to inspect the available fields, IDs, and options before making a selection.
- **Hidden Menus**: Use 'hover_element' if a navigation menu requires a hover to display its options.
- **Interact Accurately**: Use 'fill_element', 'select_option', and 'check_checkbox' to set the filters, then use 'click_element' to submit.

### TOOL GUIDELINES:
- **CSS Selectors**: The 'click_element' tool uses standard 'querySelectorAll'. NEVER use pseudo-selectors like ':contains()', ':has-text()', or xpath. Only use strict CSS selectors like 'a.btn', 'button#submit', 'select[name="year"]'.
- **Hyperlink Navigation**: If you need to click a specific link but lack a good CSS selector, use 'extract_hyperlinks' or 'get_elements' to find the exact URL, then use 'navigate_browser' directly to that URL instead of clicking.
- **Extraction**: Do not dump the entire raw HTML. Use 'get_dom_snippet' for targeted areas (e.g., tables, specific divs) or 'extract_text' to pull the required info.

Once you find the data, synthesize it clearly, provide the exact numbers, and cite the source URL. Be resourceful and persistent.
"""
        )

        agent = create_react_agent(llm, tools)

        # We construct the message with the system prompt first
        messages = [
            system_prompt,
            HumanMessage(
                content=f"Please go to {start_url} and find the following information: {query}\n\nIf you cannot find the information on {start_url}, remember your FALLBACK strategy and navigate to Google to search for it."
            ),
        ]

        final_output = "No result found."
        try:
            # Run the agent asynchronously, pass config
            async for event in agent.astream(
                {"messages": messages}, config=config, stream_mode="values"
            ):
                message = event["messages"][-1]
                if isinstance(message, HumanMessage):
                    continue
                if hasattr(message, "tool_calls") and message.tool_calls:
                    for tc in message.tool_calls:
                        yield {
                            "type": "orchestrator_tool_start",
                            "tool": f"browser_{tc['name']}",
                            "args": tc["args"],
                            "browser_id": browser_id
                        }
                else:
                    final_output = message.content
        except Exception as e:
            logger.error(f"Error during browser execution: {e}")
            final_output = f"Lỗi trong quá trình chạy Browser Agent: {e}"

        yield {"type": "final_result", "content": final_output}
