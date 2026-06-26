FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:ea8bde36c11b6e7eec2656d0e59101d4462f6bd630730f2c8201ed0572b295d5 AS api-build
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

FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS ui-build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/src/ src/
COPY frontend/public/ public/
COPY frontend/angular.json frontend/tsconfig.json frontend/tsconfig.app.json ./

RUN npx ng build --configuration production

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:7644f992230d35cf230017189d4038c0ae0f7388b13f4f7ae1900a155bafb597 AS api
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
