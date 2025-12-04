# Deploy Workshop Platform trên Dokploy

## Tổng quan Architecture

```
┌─────────────────────────────────────────┐
│              DOKPLOY                    │
│  ┌─────────────────┐  ┌──────────────┐  │
│  │   PostgreSQL    │  │  Workshop    │  │
│  │   (Database)    │  │  App + WS    │  │
│  │   :5432         │  │  :3000 :3001 │  │
│  └────────┬────────┘  └──────┬───────┘  │
│           │                   │          │
│           └───────────────────┘          │
└─────────────────────────────────────────┘
                    │
                    ▼
              Users (Internet)
```

## Bước 1: Tạo PostgreSQL Database

1. **Dokploy Dashboard** → **Create** → **Database** → **PostgreSQL**

2. **Cấu hình:**
   - **Name**: `workshop-db`
   - **Version**: `16` (hoặc latest)
   - **Database Name**: `db_workshop`
   - **Username**: `workshop`
   - **Password**: `<generate-secure-password>`

3. **Lưu lại connection string:**
   ```
   postgresql://workshop:<PASSWORD>@workshop-db:5432/db_workshop
   ```

## Bước 2: Tạo Application

1. **Create** → **Application**

2. **Source**: Connect GitHub repo hoặc Git URL

3. **Build Settings:**
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.` (root)

## Bước 3: Environment Variables

Vào tab **Environment** → Add các biến sau:

```env
# Database - thay <PASSWORD> và service name nếu khác
DATABASE_URL=postgresql://workshop:<PASSWORD>@workshop-db:5432/db_workshop?schema=public

# WebSocket URL (từ browser của user)
# Thay your-domain.com bằng domain thực
NEXT_PUBLIC_WS_URL=wss://workshop.your-domain.com:3001

# Internal WebSocket port
WS_PORT=3001

# Node environment
NODE_ENV=production
```

### Lưu ý quan trọng:

1. **`workshop-db`** là tên service PostgreSQL bạn tạo ở Bước 1
2. **`NEXT_PUBLIC_WS_URL`** phải là URL mà **browser có thể access được** (public URL)
3. Dùng `wss://` cho production (secure WebSocket)

## Bước 4: Cấu hình Ports & Domains

### Option A: 2 Ports riêng biệt (Đơn giản nhất)

Vào **Domains** tab:

| Service | Port | Domain | Protocol |
|---------|------|--------|----------|
| Web | 3000 | workshop.your-domain.com | HTTPS |
| WebSocket | 3001 | workshop.your-domain.com:3001 | WSS |

**Environment:**
```env
NEXT_PUBLIC_WS_URL=wss://workshop.your-domain.com:3001
```

> ⚠️ Cần mở port 3001 trên firewall server

### Option B: Subdomain cho WebSocket

| Service | Port | Domain | Protocol |
|---------|------|--------|----------|
| Web | 3000 | workshop.your-domain.com | HTTPS |
| WebSocket | 3001 | ws.workshop.your-domain.com | WSS |

**Environment:**
```env
NEXT_PUBLIC_WS_URL=wss://ws.workshop.your-domain.com
```

## Bước 5: Deploy

1. Click **Deploy** button
2. Xem logs để đảm bảo:
   - ✅ Database migrations chạy thành công
   - ✅ WebSocket server started
   - ✅ Next.js server started

### Logs mong đợi:
```
Running database migrations...
Starting WebSocket server...
WebSocket server running on port 3001
Starting Next.js server...
▲ Next.js 16.x
```

## Bước 6: Verify

1. Truy cập `https://workshop.your-domain.com`
2. Tạo room mới
3. Mở room ở tab khác để test WebSocket realtime

## Troubleshooting

### 1. Database connection failed
```
Error: P1001: Can't reach database server
```
**Fix:** Kiểm tra:
- Service name trong `DATABASE_URL` đúng chưa
- PostgreSQL service đã running chưa
- Cả 2 services cùng network trong Dokploy

### 2. WebSocket không connect được
```
WebSocket connection failed
```
**Fix:**
- Kiểm tra `NEXT_PUBLIC_WS_URL` đúng format `wss://...`
- Port 3001 đã được expose chưa
- SSL certificate hợp lệ

### 3. Prisma migration failed
```
Error: P3014: Prisma Migrate could not create the shadow database
```
**Fix:** Database user cần quyền `CREATEDB`. Hoặc dùng `db push` thay vì `migrate deploy`.

## Advanced: Custom Traefik Labels (Optional)

Nếu muốn WebSocket qua path `/ws` thay vì port riêng:

```yaml
# Thêm vào Dokploy custom labels
traefik.http.routers.workshop-ws.rule=Host(`workshop.your-domain.com`) && PathPrefix(`/ws`)
traefik.http.routers.workshop-ws.entrypoints=websecure
traefik.http.routers.workshop-ws.tls=true
traefik.http.services.workshop-ws.loadbalancer.server.port=3001
```

Sau đó update:
```env
NEXT_PUBLIC_WS_URL=wss://workshop.your-domain.com/ws
```

## Resource Recommendations

| Component | CPU | RAM |
|-----------|-----|-----|
| PostgreSQL | 0.5 core | 512MB |
| Workshop App | 1 core | 1GB |

**Total minimum**: 1.5 cores, 1.5GB RAM

