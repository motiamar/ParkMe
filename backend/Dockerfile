# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore dependencies as a separate layer for better cache reuse
COPY ParkMeBackend.csproj .
RUN dotnet restore ParkMeBackend.csproj

COPY . .
RUN dotnet publish ParkMeBackend.csproj -c Release -o /app/publish --no-restore

# Runtime stage — smaller image, no SDK tools
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 10000

# Use shell form so ${PORT} is expanded at container start time.
# Render injects PORT at runtime; fallback to 10000 (Render's default).
CMD ASPNETCORE_URLS="http://+:${PORT:-10000}" dotnet ParkMeBackend.dll
