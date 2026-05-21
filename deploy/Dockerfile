FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:c0790639332692a0d56cdd81ed581cfd24d040d9839764c138994866df89a3b6 AS api-build
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

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:8c0b6857eab7b2aa57884c839bf4678414606bd7d17370f18a842ac5cf414711 AS api
WORKDIR /app

COPY --from=api-build /app/api/publish ./

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "API.dll"]

FROM nginx:alpine@sha256:2f07d83bf561b506400dc183b1b2003803e39efbd22451f848adaba14d28c7c7 AS ui
WORKDIR /usr/share/nginx/html

COPY --from=ui-build /app/dist/swen2-tourplanner-angular/browser ./
COPY deploy/nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
