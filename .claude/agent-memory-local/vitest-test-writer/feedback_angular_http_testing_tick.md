---
name: Angular HTTP testing tick pattern for chained firstValueFrom
description: Two Promise.resolve() ticks are needed between sequential HttpTestingController flushes when the VM chains multiple await firstValueFrom() calls
type: feedback
---

When testing Angular ViewModels that chain multiple `await firstValueFrom(httpCall)` calls (e.g. `saveTour` does resolveRoute → createTour → loadTours), a single `await Promise.resolve()` between flushes is NOT enough to advance the VM to the next HTTP call.

**Why:** `firstValueFrom` wraps an observable in a Promise. When `flush()` is called on an HttpTestingController request, RxJS processes the completion synchronously through `take(1)`, but the Promise resolution is queued as a microtask. The `await firstValueFrom(...)` continuation (which makes the next HTTP call) is itself a second microtask. So two microtask ticks are required.

**How to apply:** Use this pattern for any test that steps through chained `await firstValueFrom()` HTTP calls:

```ts
const tick = () => Promise.resolve().then(() => Promise.resolve());

const promise = vm.saveTour(formValue);

await tick();
httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/routes/resolve` }).flush(routeResponse);
await tick();
httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tour` }).flush(createdTour);
await tick();
httpTesting.expectOne({ method: 'GET', url: `${baseUrl}api/tour` }).flush([createdTour]);
await promise;
```

A single `const tick = () => Promise.resolve()` is sufficient when there is only ONE `firstValueFrom` call (e.g. `loadTours`, `selectTour`). Use the double-tick only when two or more `firstValueFrom` calls are chained sequentially inside the VM method under test.
