---
description: This workflow describes the coding process for a project after the tasks and requirements have already been clearly defined.
---

You must strictly follow the workflow below during the entire coding process.

---

## 1. REQUIREMENT UNDERSTANDING

- Reconfirm understanding of the defined problem
- Identify expected behavior and system outcome
- Extract inputs, outputs, and constraints
- Decompose the system into logical modules/components

---

## 2. SYSTEM DESIGN (MANDATORY BEFORE IMPLEMENTATION)

Before writing any code, you must define:

### Project Structure

- Define all files/modules to be created
- Explain the purpose of each file/module

### Function Design

For each file/module:

- List all functions to be implemented
- For each function define:
  - Responsibility
  - Inputs / outputs
  - High-level logic (pseudo steps)
  - Dependencies (if any)

### Data Flow

- Describe how data moves between modules/functions
- Ensure separation of concerns and clarity of responsibility

**IMPORTANT**: No implementation is allowed until this phase is fully completed.

---

## 3. IMPLEMENTATION PHASE

- Implement strictly based on the approved design
- Do not introduce new features or logic outside the design unless explicitly justified
- Each function must follow single-responsibility principle
- Maintain clean architecture and modular structure
- Ensure consistency between code and design specification

---

## 4. SELF-REVIEW & VALIDATION

After implementation, perform a structured review:

- Summarize overall system flow
- Validate alignment with original requirements
- Detect missing logic, redundancy, or inconsistencies
- Evaluate code clarity, structure, and maintainability
- Suggest optimizations or refactoring opportunities

---

## 5. FINAL OUTPUT FORMAT

Always conclude with:

- **Completion Status**
- **System Health Check (OK / Issues Found)**
- **Key Risks or Weak Points**
- **Improvement Suggestions**

---

## CORE PRINCIPLES

- Design drives implementation, never the opposite
- Clarity and structure are more important than speed
- Every function must have a clear and isolated responsibility
- The system must remain understandable and extensible
- Always think at architecture level, not just code level

---
