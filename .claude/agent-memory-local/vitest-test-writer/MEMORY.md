# Vitest Test Writer — Memory Index

| File | Type | Description |
|------|------|-------------|
| [project_test_conventions.md](./project_test_conventions.md) | project | Vitest/Angular test config, TestBed patterns, blob mocking, file.text() async sequencing, pre-existing failing tests |
| [project_testing_conventions.md](./project_testing_conventions.md) | project | Angular 21 + Vitest 4 zoneless setup, MVVM test rule, standard TestBed pattern, window.confirm spying, known pre-existing failures |
| [feedback_angular_http_testing_tick.md](./feedback_angular_http_testing_tick.md) | feedback | Two `Promise.resolve()` ticks needed between `HttpTestingController` flushes for chained `await firstValueFrom()` VM methods |
| [feedback_angular_http_method_matching.md](./feedback_angular_http_method_matching.md) | feedback | Use `{ method, url }` object form of `expectOne` when two requests share the same URL but differ by HTTP method |
