# Stage 1: Build the Next.js static frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Set empty API URL so frontend uses relative paths in production
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Stage 2: Serve the application using Python & FastAPI
FROM python:3.11-slim
WORKDIR /app

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend

# Copy static frontend build from builder stage
COPY --from=builder /app/out ./out

# Railway assigns PORT dynamically
ENV PORT=8000
EXPOSE ${PORT}

CMD ["sh", "-c", "cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
