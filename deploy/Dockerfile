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

FROM node:24-alpine@sha256:156b55f92e98ccd5ef49578a8cea0df4679826564bad1c9d4ef04462b9f0ded6 AS ui-build
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

FROM nginx:alpine@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa AS ui
WORKDIR /usr/share/nginx/html

COPY --from=ui-build /app/dist/swen2-tourplanner-angular/browser ./
COPY deploy/nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
