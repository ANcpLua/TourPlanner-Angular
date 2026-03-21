## UI Template Baseline

- The `UI` project is a `net10.0` standalone Blazor WebAssembly PWA built with `Microsoft.NET.Sdk.BlazorWebAssembly`.
- It is not the newer `.NET 10` default `dotnet new blazor` "Blazor Web App" template.
- Template indicators: `UI/wwwroot/index.html`, `UI/wwwroot/manifest.webmanifest`, `UI/wwwroot/service-worker.js`, `UI/wwwroot/service-worker.published.js`, and `WebAssemblyHostBuilder.CreateDefault(args)` in `UI/Program.cs`.

## Angular Frontend Recovery

- The current Angular frontend expects Node `22.21.1` from [`.nvmrc`](/Users/ancplua/swen2-tourplanner-angular/.nvmrc). Running installs under Node `25.x` can leave `node_modules` physically incomplete even when `npm install` reports success.
- The concrete failure mode was Angular CLI crashing on missing files like `node_modules/listr2/dist/index.cjs` and `node_modules/ajv/dist/ajv.js`. `npm ci` restored a healthy dependency tree.
- `dotnet run --project API/API.csproj` must not hard-fail when PostgreSQL is absent. Runtime schema initialization was removed; database availability now belongs in `/health` instead of process startup.
- Local development currently works with `docker compose up -d postgres`, `dotnet run --project API/API.csproj`, and `npm start`.
- The compose `api` build path is stale: the current `Dockerfile` still expects `UI/*.csproj`, so `docker compose up api` fails in this repo state.

## Memory Files

- [user_role.md](memory/user_role.md) -- User role and context
- [project_dual_frontend.md](memory/project_dual_frontend.md) -- Dual frontend architecture (Blazor = source of truth)
- [reference_openapi_generator.md](memory/reference_openapi_generator.md) -- Unified Java+C# OpenAPI code generation strategy
