import re
from app.agent_core.tools.datetime_tool import get_current_datetime

ISO_DATETIME_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")

def test_get_current_datetime_returns_iso_utc_string():
    value = get_current_datetime.invoke({})
    assert isinstance(value, str)
    assert ISO_DATETIME_REGEX.match(value)
