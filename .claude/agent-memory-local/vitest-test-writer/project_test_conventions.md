---
name: Angular Tour Planner test conventions
description: Vitest/Angular testing patterns, config, and known pre-existing failures for this project
type: project
---

## Test runner

`npx ng test --watch=false` — uses `@angular/build:unit-test` builder which integrates Vitest with globals enabled. No explicit `import { vi, describe, it, expect } from 'vitest'` needed — all Vitest globals are available automatically in spec files.

## Spec file conventions

- Spec files live next to the source file: `foo.component.spec.ts` beside `foo.component.ts`.
- All test modules use `TestBed.configureTestingModule` inside `beforeEach(async () => { ... })`.
- Standalone components are imported via `imports: [FooComponent]` in the TestBed config.
- Private/protected members are accessed in tests via `component['memberName']` (bracket notation).
- Inputs are set via `fixture.componentRef.setInput('inputName', value)`.

## TestBed re-configuration constraint

Angular's TestBed can only be configured once per test. Calling `TestBed.configureTestingModule` a second time (e.g., inside a test body) throws "Cannot configure the test module when the test module has already been instantiated."

**Pattern to override providers for a subset of tests:** use a nested `describe` block with its own `beforeEach` that calls `TestBed.configureTestingModule` with the overriding providers. The outer `beforeEach` covers the default setup; the inner `beforeEach` provides the alternative configuration for those specific tests. Each nested `describe` gets a fresh TestBed instance.

## AuthViewModel mocking pattern

`AuthViewModel` is `providedIn: 'root'` and injects `AuthApiService`, `AuthState`, and `Router`. To test auth page components without HTTP, provide a mock object via the TestBed providers:

```ts
{
  provide: AuthViewModel,
  useValue: {
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    isLoading: signal(false),
    errorMessage: signal(null),
  },
}
```

Import `signal` from `@angular/core` and `AuthViewModel` from its path.

## Form validation test pattern

- Access form group: `component['form']`
- Access individual control: `component['form'].controls['fieldName']`
- Mark touched: `control.markAsTouched()`
- Set value: `control.setValue(value)`
- Call protected helpers directly: `component['showRequiredError']('name')`, `component['showError']('comment', 'required')`
- Test cross-field validators via `form.hasError('errorKey')`

## Blob download mocking

Do NOT use `vi.stubGlobal('URL', ...)` — it replaces the entire `URL` constructor and breaks `new URL(path, base)` calls inside `buildUrl()` helpers, causing HTTP requests to never reach the testing backend.

Instead, spy on only the static methods:
```ts
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
vi.spyOn(document, 'createElement').mockReturnValue(anchorStub);
```
Clean up with `vi.restoreAllMocks()` in `afterEach`.

## Async microtask sequencing for `file.text()`

`File.prototype.text()` is a microtask even when the file is small. When a VM method calls `file.text()` before issuing an HTTP request, the sequence to flush correctly is:
1. Mock `file` as `{ text: vi.fn().mockResolvedValue('...') }`
2. Call the VM method and save the promise
3. `await file.text()` — drains the microtask so the POST is queued
4. Flush the POST: `httpTesting.expectOne(...).flush(...)`
5. `await Promise.resolve()` — drains the microtask that queues the next HTTP call (e.g. a GET inside `loadTours()` chained after the POST)
6. Flush the GET
7. `await promise`

## Pre-existing failing tests (do not investigate unless asked)

These two test files still have broken tests as of 2026-03-20 — they are unrelated to current work:

- `tour-log.viewmodel.spec.ts` — HTTP expectation mismatches in `saveLog` / `deleteLog`
- `tour.viewmodel.spec.ts` — HTTP expectation mismatches in `saveTour`

The following files were previously listed here but have been fixed: `app-navbar.component.spec.ts`, `search.component.spec.ts`, `search.viewmodel.spec.ts`, `report.viewmodel.spec.ts`.

When running the full suite, cross-file TestBed contamination from the still-broken files above can cause cascade failures in surrounding spec files. Each spec file passes cleanly in isolation (`--include` flag). The full run now shows 159 tests passing.
