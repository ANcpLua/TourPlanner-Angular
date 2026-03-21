---
name: Tour Planner Angular testing conventions
description: Project-specific testing setup, conventions, and MVVM test architecture rules
type: project
---

## Framework and globals

- Angular 21, Vitest 4, no Zone.js (zoneless app)
- `tsconfig.spec.json` has `"types": ["vitest/globals"]` — so `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are all globals; no import needed
- Test command: `npx ng test --watch=false`
- Builder: `@angular/build:unit-test`

## MVVM rule (critical)

All tests go through the ViewModel. Never test models or services directly. The ViewModel is the only interface.

## Test file locations

- `src/app/features/tours/viewmodels/tour.viewmodel.spec.ts`
- `src/app/features/tour-logs/viewmodels/tour-log.viewmodel.spec.ts`
- Pattern: co-located `.spec.ts` next to the source file

## Standard test setup

```ts
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'http://localhost:7102/' },
    ],
  });
  vm = TestBed.inject(MyViewModel);
  httpTesting = TestBed.inject(HttpTestingController);
});
afterEach(() => httpTesting.verify());
```

## window.confirm spying

```ts
vi.spyOn(window, 'confirm').mockReturnValue(true);
// ... test body ...
vi.restoreAllMocks(); // at end of test, NOT in afterEach
```

## Pre-existing failing tests (not caused by us)

`src/app/features/tours/services/tours-api.service.spec.ts` — all tests fail with "Cannot configure the test module when the test module has already been instantiated" due to `inject` being called before `TestBed.configureTestingModule`. Pre-existing issue, do not touch.
