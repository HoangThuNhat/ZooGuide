# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj files for layer caching
COPY src/Domain/ZooGuide.Domain.csproj src/Domain/
COPY src/Application/ZooGuide.Application.csproj src/Application/
COPY src/Infrastructure/ZooGuide.Infrastructure.csproj src/Infrastructure/
COPY src/API/ZooGuide.API.csproj src/API/

# Restore dependencies
RUN dotnet restore src/API/ZooGuide.API.csproj

# Copy remaining source code
COPY src/Domain/ src/Domain/
COPY src/Application/ src/Application/
COPY src/Infrastructure/ src/Infrastructure/
COPY src/API/ src/API/

# Publish
WORKDIR /app/src/API
RUN dotnet publish ZooGuide.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ZooGuide.API.dll"]
