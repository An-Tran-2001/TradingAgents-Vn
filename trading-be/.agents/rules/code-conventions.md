---
trigger: always_on
---

# Code Conventions & Engineering Standards

_This document defines the strict, non-negotiable coding standards for this project, serving as the master prompt for all code generation and review. It enforces modern Python practices based on PEP 8, PEP 257, and PEP 484._

## 0. The Unified Tooling Pipeline

We enforce a strict and modern tooling pipeline.

- **Ruff** (Primary Linter):
  _Note on Flake8:_ While traditional standards relied on Flake8, this project **requires Ruff** as the primary linter. Ruff enforces the same PEP 8 and Flake8 rule sets but is orders of magnitude faster because it is written in Rust. It consolidates Flake8, isort, and dozens of plugins into a single, high-performance tool, making it the superior choice for modern Python applications.
- **Black** (Auto Formatter): Non-negotiable. Code must be `black`-compliant. It provides a deterministic, standard layout.
- **Mypy** (Type Checker): Strict-mode type checking is mandatory for all modules.

**How they work together:** `Black` ensures consistent layout and line length, `Ruff` catches logical, structural, and import-order errors (acting as an `isort` and `flake8` replacement), and `Mypy` guarantees strict type-safety across the codebase.

## 1. Naming Conventions

Enforce strict semantic naming.

- **Variables, Functions, Methods**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private/Internal**: Prefix with a single underscore (e.g., `_internal_method`)

**DO:**

```python
def calculate_discount(base_price: float) -> float: ...
MAX_RETRIES = 5
class DatabaseConnector: ...
```

**DON'T:**

```python
def CalculateDiscount(BasePrice): ... # Mixed cases
max_retries = 5 # Should be uppercase
class databaseConnector: ... # Incorrect casing
```

## 2. Project Structure & File Limitations

Build for scalability and maintainability.

- **Domain-Driven Design**: Group files by feature/domain.
- **File Length Rule**: Files **MUST NOT exceed 600-700 lines**. If a file hits this limit, break it down logically by dividing responsibilities into smaller files and grouping them into the appropriate project directories.
- **Sub-Moduling**: Move generic helper functions to `utils/` or `core/` modules. Separate interfaces from concrete implementations.

## 3. Import Rules

Imports must be explicitly declared and structurally sorted.

- **Ordering**:
  1. Standard library imports
  2. Third-party library imports
  3. Local internal imports
- **Rules**:
  - Managed automatically by `ruff` (isort compatible).
  - No wildcard imports (`from module import *`).
  - Avoid relative imports (`from .x import y`); prefer absolute project imports.

**DO:**

```python
import os
from datetime import datetime

from fastapi import APIRouter
from sqlalchemy.orm import Session

from myapp.core.config import settings
```

## 4. Formatting Rules

- **Black-compliant**: Always use Black.
- **Line Length**: 88 characters (Black's default).
- **Whitespace**: No trailing whitespace. Proper blank lines (two before top-level functions/classes, one before methods).

## 5. Type System Rules

Ensure robust execution through strict static typing (`mypy --strict`).

- Every function/method must have signature typing for arguments and return types.
- **Handling `Any`**: The `Any` type is strictly forbidden unless wrapping unknown/untyped external legacy code. Use Generics (`TypeVar`) instead.
- **Nullability**: When a variable or parameter can be Null, explicitly use `Optional[Type]` (or `Type | None` in Python 3.10+). Never assume implicit optionals.

**DO:**

```python
from typing import Optional

def find_user(username: str) -> Optional[User]:
    ...
```

**DON'T:**

```python
def find_user(username): # Missing typing entirely
    ...
```

## 6. Docstring Standards

Adhere strictly to PEP 257 using Google-style docstrings.

- Mandatory for all public modules, classes, and functions.
- Must explain the _intent_, arguments (`Args:`), return values (`Returns:`), and expected errors (`Raises:`).

**DO:**

```python
def sync_user_data(user_id: int) -> bool:
    """
    Synchronizes local user data with the remote CRM system.

    Args:
        user_id: The unique identifier of the user.

    Returns:
        True if synchronization succeeds, False otherwise.

    Raises:
        CRMConnectionError: If the CRM API is unreachabe.
    """
```

## 7. Error Handling Rules

Never swallow errors silently. Define clear boundaries for failing gracefully.

- **No Silent Failures**: `except Exception: pass` is strictly forbidden.
- Catch ONLY specific exceptions where a recovery path exists.
- Define custom application exceptions extending basic domain-specific exceptions.

**DO:**

```python
try:
    data = parse_json(payload)
except JSONDecodeError as exc:
    logger.error("Malformed payload received", exc_info=True)
    raise InvalidRequestError("Invalid JSON payload") from exc
```

## 8. Logging Rules

Do not use `print()` statements for application logs.

- **Structured Logging**: Emit logs that conceptually map to JSON objects to include structured business context.
- **Levels**:
  - `DEBUG`: Dev diagnostics and deep tracing.
  - `INFO`: State changes/business events.
  - `WARNING`: Recoverable anomalies.
  - `ERROR`: Operations that failed and require monitoring.
  - `CRITICAL`: System failures causing application down-time.
- **Anti-pattern**: Never log Personal Identifiable Information (PII) or secrets.

**DO:**

```python
logger.info("Payment success", extra={"user_id": user.id, "amount": amount})
```

## 9. Testing Conventions

- **Framework**: `pytest`.
- **Structure**: Tests mirror the `src/` directory (e.g., tests for `src/core.py` go in `tests/test_core.py`).
- **Naming**: Files start with `test_*.py`, functions start with `test_*`.
- **Coverage Expectation**: Expectation is a branch coverage > 85%. Test happy paths along with negative/edge cases comprehensively.
