FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src

COPY Directory.Packages.props Directory.Build.props Version.props ./
COPY API/*.csproj API/
COPY BL/*.csproj BL/
COPY DAL/*.csproj DAL/
COPY Contracts/*.csproj Contracts/

RUN dotnet restore "API/API.csproj"

COPY API/ API/
COPY BL/ BL/
COPY DAL/ DAL/
COPY Contracts/ Contracts/

RUN dotnet publish "API/API.csproj" -c Release -o /app/api/publish

FROM node:22-alpine AS ui-build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src/ src/
COPY public/ public/
COPY angular.json tsconfig.json tsconfig.app.json ./

RUN npx ng build --configuration production

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS api
WORKDIR /app

COPY --from=api-build /app/api/publish ./

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "API.dll"]

FROM nginx:alpine AS ui
WORKDIR /usr/share/nginx/html

COPY --from=ui-build /app/dist/swen2-tourplanner-angular/browser ./
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
