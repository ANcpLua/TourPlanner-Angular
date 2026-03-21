---
name: Angular HttpTestingController method-aware expectOne
description: When two requests hit the same URL with different HTTP methods (e.g. POST api/tour then GET api/tour), use the { method, url } object form of expectOne to disambiguate
type: feedback
---

`httpTesting.expectOne(url)` matches by URL only. When the VM makes a POST and a GET to the same URL (e.g. `api/tour` for create then reload), both requests are in the queue and `expectOne` throws "found 2 requests".

**Why:** Angular's `HttpClientTestingBackend._match` supports three forms: string (URL only), function (predicate), or object `{ method?, url? }`. The object form filters by both method and URL.

**How to apply:** Always use the object form when two requests share a URL:

```ts
httpTesting.expectOne({ method: 'POST', url: `${baseUrl}api/tour` }).flush(createdTour);
httpTesting.expectOne({ method: 'GET',  url: `${baseUrl}api/tour` }).flush([createdTour]);
```

Use the plain string form only for requests that are unique by URL:
```ts
httpTesting.expectOne(`${baseUrl}api/tourlog/bytour/tour-1`).flush([sampleLog]);
```
