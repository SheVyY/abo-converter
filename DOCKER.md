# Docker Deployment Guide 🐳

This guide covers Docker deployment for the CSV to ABO Converter web application.

## 🚀 Quick Start

### Build and Run

```bash
# Navigate to web app directory
cd web-app

# Build the Docker image
./docker-build.sh

# Run the container
./docker-run.sh
```

Application will be available at: http://localhost:3001

### Docker Compose

```bash
# Start with docker-compose
docker compose up -d

# Application available at: http://localhost:3002

# Stop the application
docker compose down
```

## 🔧 Docker Configuration

### Dockerfile

Multi-stage build optimized for production:

- **deps**: Install dependencies with Alpine Linux
- **builder**: Build Next.js application 
- **runner**: Production runtime with minimal footprint

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` |
| `PORT` | Server port | `3000` |
| `HOSTNAME` | Server hostname | `0.0.0.0` |

### Docker Compose Features

- Health checks
- Restart policies
- Environment configuration
- Optional nginx reverse proxy
- Volume mounts for sample files

## 📊 Container Info

- **Base Image**: node:18-alpine
- **Final Size**: ~150MB
- **Memory Usage**: ~50MB
- **Startup Time**: < 60ms
- **Security**: Non-root user (nextjs:nodejs)

## 🔍 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001

# Container logs
docker logs -f abo-converter

# Container status
docker ps -f name=abo-converter
```

### Sample File Testing

Upload the included sample CSV file from `/public/sample_payments.csv` to verify functionality.

## 🚨 Troubleshooting

### Port Conflicts

```bash
# Check port usage
lsof -i :3000

# Use different port
docker run -p 3001:3000 abo-converter:latest
```

### Build Issues

```bash
# Clean Docker cache
docker builder prune

# Rebuild from scratch
docker build --no-cache -t abo-converter:latest .
```

### Container Issues

```bash
# View logs
docker logs abo-converter

# Execute into container
docker exec -it abo-converter sh

# Restart container
docker restart abo-converter
```

## 🏭 Production Deployment

### With Nginx Reverse Proxy

```bash
# Enable production profile
docker compose --profile production up -d
```

### Custom Configuration

```yaml
# docker-compose.override.yml
services:
  abo-converter:
    ports:
      - "80:3000"
    environment:
      - HOSTNAME=your-domain.com
```

### Health Monitoring

The container includes health checks that verify the application is responding:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' abo-converter
```

## 📝 Scripts Reference

### docker-build.sh
- Builds the Docker image with tag `abo-converter:latest`
- Shows build progress and final instructions

### docker-run.sh  
- Stops and removes existing container
- Starts new container with proper configuration
- Shows status and management commands

### docker-compose.yml
- Defines service configuration
- Includes health checks and restart policies
- Supports production nginx profile

---

For more information, see the main [README.md](./README.md) or contact Sebastian Hozak <hozaksebastian@gmail.com>.