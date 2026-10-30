# ========================================================
# Giai đoạn 1: Build source code bằng .NET 10 SDK
# ========================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy file .csproj và restore dependencies trước (tối ưu cache Docker)
COPY smart-marketplace-new.csproj ./
RUN dotnet restore smart-marketplace-new.csproj

# Copy toàn bộ mã nguồn và biên dịch Release
COPY . ./
RUN dotnet publish smart-marketplace-new.csproj -c Release -o /app/publish --no-restore

# ========================================================
# Giai đoạn 2: Runtime image tối ưu dung lượng nhỏ gọn
# ========================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "smart-marketplace-new.dll"]
