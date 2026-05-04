FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:8a90a473da5205a16979de99d2fc20975e922c68304f5c79d564e666dc3982fc AS api-build
WORKDIR /src

COPY backend/Directory.Packages.props backend/Directory.Build.props backend/Version.props backend/global.json ./
COPY backend/API/*.csproj API/
COPY backend/BL/*.csproj BL/
COPY backend/DAL/*.csproj DAL/
COPY backend/Contracts/*.csproj Contracts/

RUN dotnet restore "API/API.csproj"

COPY backend/API/ API/
COPY backend/BL/ BL/
COPY backend/DAL/ DAL/
COPY backend/Contracts/ Contracts/

RUN dotnet publish "API/API.csproj" -c Release -o /app/api/publish

FROM node:24-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS ui-build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/src/ src/
COPY frontend/public/ public/
COPY frontend/angular.json frontend/tsconfig.json frontend/tsconfig.app.json ./

RUN npx ng build --configuration production

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:55e37c7795bfaf6b9cc5d77c155811d9569f529d86e20647704bc1d7dd9741d4 AS api
WORKDIR /app

COPY --from=api-build /app/api/publish ./

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "API.dll"]

FROM nginx:alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS ui
WORKDIR /usr/share/nginx/html

COPY --from=ui-build /app/dist/swen2-tourplanner-angular/browser ./
COPY deploy/nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
