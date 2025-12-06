// Host speaker notes for System Design 101 workshop
// Based on Martin Joo's blog: https://martinjoo.dev/system-design-101

export const systemDesign101Notes: Record<number, string> = {
  // Slide 0: Title
  0: `- Chào mừng mọi người đến workshop System Design 101
- Workshop này dựa trên blog của Martin Joo
- Mục tiêu: Hiểu cách scale hệ thống từ 10 đến 10,000 users
- **Quan trọng**: System design là kỹ năng quan trọng nhất để đi từ Junior lên Senior`,

  // Slide 1: Tại sao cần System Design?
  1: `- Hỏi: "Ai đã từng scale ứng dụng? Gặp vấn đề gì?"
- System design xuất hiện ở khắp nơi:
  - Extract services từ monolith
  - Cải thiện performance
  - Scale application
- Quote: "System design is one of the things that differentiate a senior from a junior"
- 💡 **Tip**: Không cần là Netflix mới cần system design`,

  // Slide 2: Phase 0 - Basic
  2: `- Đây là kiến trúc cơ bản nhất mà ai cũng bắt đầu
- Frontend → API → Database
- **Ưu điểm**: Đơn giản, dễ setup, deploy nhanh
- **Nhược điểm**: Không scale được
- ⚠️ Phù hợp cho: MVP, internal tools, side projects
- Hỏi: "App hiện tại của bạn đang ở phase nào?"`,

  // Slide 3: Quiz Phase 0
  3: `- Câu hỏi warm-up đơn giản
- Đáp án: Startup nhỏ, vài chục users
- Giải thích: Phase 0 chỉ phù hợp traffic thấp`,

  // Slide 4: Phase 1 - Job Queue
  4: `- **Khi nào cần?** Tasks chạy lâu hơn 200-300ms
- Ví dụ thực tế:
  - Upload ảnh → Resize trong nền
  - Gửi email/OTP
  - Generate PDF report
- **Lợi ích**: User không phải chờ!
- 💡 Queue có thể dùng: Redis (phổ biến), RabbitMQ, Kafka, hoặc DB table`,

  // Slide 5: Job Queue giải thích
  5: `- Giải thích đơn giản cho người mới:
- API = Nhân viên tiếp tân (nhanh)
- Worker = Nhân viên kho (làm việc nặng)
- Queue = Danh sách công việc chờ xử lý
- **Demo**: User upload ảnh 5MB
  - Không queue: Chờ 30 giây
  - Có queue: "Upload OK!" ngay lập tức`,

  // Slide 6: Quiz Job Queue
  6: `- Đáp án: "Để API không bị chậm hoặc timeout"
- Giải thích thêm: Long-running tasks block user requests
- ⚠️ Nếu API bị block → User experience tệ`,

  // Slide 7: Retry & Dead Letter Queue
  7: `- **Job có thể FAIL!** → Cần retry mechanism
- Retry thường 3-5 lần với exponential backoff
- Dead Letter Queue (DLQ):
  - Job fail quá nhiều → Chuyển vào DLQ
  - Admin review và xử lý thủ công
- 💡 Đây là best practice trong production`,

  // Slide 8: Quiz Retry
  8: `- Đáp án: "Chuyển vào Dead-letter Queue"
- Giải thích: Retry mãi mãi = nghẽn queue
- DLQ giúp isolate failed jobs để debug sau`,

  // Slide 9: Phase 1 Tradeoffs
  9: `- Setup đơn giản: 1 server chạy 2 processes
- **Ưu điểm**: 
  - Không block user requests
  - Setup cực kỳ đơn giản
- **Nhược điểm**: 
  - Worker vẫn chiếm resources của API
  - Video transcoding → Homepage chậm!
- ⚠️ Chỉ phù hợp: Vài chục jobs nhẹ mỗi ngày`,

  // Slide 10: Quiz Worker Resources
  10: `- Đáp án: "API bị chậm"
- Giải thích: CPU/RAM bị worker chiếm
- Hỏi: "Ai đã gặp case này chưa?"`,

  // Slide 11: Phase 2 - Tách Worker
  11: `- **Giải pháp**: Tách API và Worker ra máy riêng
- Tình huống Black Friday:
  - 10x orders → 10x emails
  - Worker riêng → Thêm 3 workers
  - API vẫn nhanh!
- 💡 **Key insight**: Scale độc lập từng phần`,

  // Slide 12: Scale độc lập
  12: `- Lợi ích quan trọng nhất: **Scale độc lập!**
- Cần xử lý video nhiều hơn → Thêm workers
- Cần handle requests nhiều hơn → Thêm API servers
- Chi phí ước tính:
  - 1 server chung: $20/month
  - API + Worker riêng: $40/month
  - Đắt hơn nhưng **stable hơn nhiều**`,

  // Slide 13: Quiz Tách Worker
  13: `- Đáp án: "API và Worker scale độc lập"
- Nhấn mạnh: Đây là foundation của horizontal scaling`,

  // Slide 14: Phase 3 - Horizontal Scaling
  14: `- **Vertical**: Nâng cấp 1 server (có giới hạn)
- **Horizontal**: Thêm nhiều servers (không giới hạn)
- Cùng capacity 6 cores + 12GB:
  - Vertical: 1 server mạnh → Die = chết hết
  - Horizontal: 3 servers → Die 1 = còn 2`,

  // Slide 15: Tại sao Horizontal?
  15: `- 4 lợi ích chính:
  1. **Fault Tolerance**: 1 server die → vẫn sống
  2. **Elasticity**: Scale up/down theo demand
  3. **No bottleneck**: Traffic phân tải đều
  4. **Geo Distribution**: Deploy nhiều regions
- 💡 Horizontal phức tạp hơn nhưng đáng giá`,

  // Slide 16: Quiz Scaling
  16: `- Đáp án: "Fault tolerance"
- Giải thích: Vertical = single point of failure
- Horizontal = redundancy`,

  // Slide 17: Phase 4 - Load Balancer
  17: `- **Vấn đề**: 3 servers = 3 IPs. Frontend gọi ai?
- Load Balancer giải quyết:
  - Single entry point
  - Phân tải đều
  - Health check → loại server die
  - SSL termination`,

  // Slide 18: LB Algorithms
  18: `- **Round Robin**: Lần lượt A → B → C → A...
- **Least Connections**: Server ít connections nhất
- **IP Hash**: Cùng IP → cùng server (sticky session)
- **Weighted**: Server mạnh nhận nhiều hơn
- Tools: nginx, HAProxy, Traefik, AWS ALB`,

  // Slide 19: Quiz Load Balancer
  19: `- Đáp án: "Tự động chuyển traffic sang servers còn lại"
- LB có health check, detect server unhealthy
- User không biết có server die`,

  // Slide 20: Phase 5 - Stateless
  20: `- **Local State = Kẻ thù của Horizontal Scaling**
- Tình huống lỗi kinh điển:
  - User A upload file → Server 1
  - User A refresh → Load Balancer → Server 2
  - Server 2: "File not found!" ❌
- ⚠️ Files, Sessions, Cache trên local = vấn đề`,

  // Slide 21: Giải pháp Stateless
  21: `- **Rule vàng**: Tất cả servers phải GIỐNG HỆT NHAU
- Giải pháp:
  - Files → AWS S3, MinIO
  - Sessions → Redis, Database
  - Cache → Redis, Memcached
  - Logs → ELK Stack, CloudWatch
- 💡 Đây là lý do S3 phổ biến`,

  // Slide 22: Quiz Stateless
  22: `- Đáp án: "File uploads lưu trên disk"
- Giải thích: Local disk không share được
- Dùng S3 → tất cả servers access được`,

  // Slide 23: Phase 6 - Caching
  23: `- **Tại sao cache?**
  - Không cache: DB nhận 1000 req/s, 50-200ms
  - Có cache: DB nhận 100 req/s, 1-5ms
- Khi nào cache?
  - ✅ Data ít thay đổi (products, settings)
  - ✅ Được request nhiều (homepage)
  - ❌ Data real-time (stock price)`,

  // Slide 24: Cache Aside Pattern
  24: `- **Lazy Loading** (Cache Aside) - phổ biến nhất
- Flow:
  1. Check cache
  2. HIT → Return
  3. MISS → Query DB → Save cache → Return
- Performance:
  - Cache HIT: ~2ms
  - Cache MISS: ~50ms`,

  // Slide 25: Cache Problems
  25: `- ⚠️ **Vấn đề thường gặp**:
  1. **Cache Invalidation**: Data thay đổi, cache cũ
     → Phải xóa cache khi update
  2. **Thundering Herd**: Cache expire → 1000 req đồng thời
     → Lock khi rebuild
  3. **Cold Start**: Server mới = cache trống
     → Warm up trước khi nhận traffic`,

  // Slide 26: Quiz Caching
  26: `- Đáp án: "Check cache trước, miss thì query DB và cache lại"
- Nhấn mạnh: Application tự quản lý cache`,

  // Slide 27: Quiz Cache Invalidation
  27: `- Đáp án: "Xóa cache cũ"
- 💡 "There are only two hard things in CS: cache invalidation and naming things"`,

  // Slide 28: Phase 7 - CDN
  28: `- **Vấn đề**: Frontend quá nặng!
  - Zoom landing: 6MB JS
  - Facebook: 3MB JS
- CDN = Cache cho static assets
- User VN → CDN Singapore (20ms) thay vì US (200ms)
- **10x faster!**`,

  // Slide 29: CDN Deep Dive
  29: `- CDN Providers:
  - Cloudflare: Free tier tốt, DDoS protection
  - AWS CloudFront: AWS integration
  - Vercel/Netlify: Auto cho static sites
- Không CDN: 5-10 giây
- Có CDN: 0.5-1 giây`,

  // Slide 30: Quiz CDN
  30: `- Đáp án: "Giảm latency bằng cách serve từ server gần hơn"
- Edge servers ở nhiều regions`,

  // Slide 31: Phase 8 - DB Scaling
  31: `- Hầu hết apps: **90% Read, 10% Write**
- **Leader-Follower Pattern**:
  - Leader: READ + WRITE (1 instance)
  - Follower: READ only (N instances)
- WRITE → Leader → Replicate → Followers`,

  // Slide 32: Replication Lag
  32: `- ⚠️ **Vấn đề**: Replication Lag
- User update → Leader → Follower (100ms)
- User refresh ngay → Đọc từ Follower → Data cũ!
- Giải pháp:
  - Read-your-writes
  - Sticky session
- DigitalOcean: 3 nodes = $60/month`,

  // Slide 33: Quiz DB Replicas
  33: `- Đáp án: "Chỉ READ operations"
- Tất cả WRITE đi qua Leader để đảm bảo consistency`,

  // Slide 34: SPOF
  34: `- **SPOF** = Single Point of Failure
- Nếu component này chết → Cả hệ thống chết!
- Checklist:
  - API: Multiple servers + LB ✅
  - Database: Leader-Follower ⚠️
  - Queue: Redis Cluster ⚠️
- DigitalOcean LB: 10,000 connections = $12/month`,

  // Slide 35: Quiz SPOF
  35: `- Đáp án: "Toàn bộ hệ thống không hoạt động"
- Database là SPOF phổ biến nhất`,

  // Slide 36: Phase 9 - Microservices
  36: `- Microservices = Tách thành nhiều services nhỏ
- Mỗi service:
  - Database riêng
  - Deploy độc lập
  - Scale riêng
  - Team riêng maintain`,

  // Slide 37: Khi nào KHÔNG dùng
  37: `- ⚠️ **CẢNH BÁO**: Complexity tăng 10x!
- KHÔNG dùng nếu:
  - Team nhỏ (<5 devs)
  - Startup giai đoạn đầu
  - Chưa có DevOps experience
- Quote: "You're not Netflix. I'm not Netflix."`,

  // Slide 38: Khi nào NÊN dùng
  38: `- NÊN dùng khi:
  - Team lớn (50+ devs)
  - Cần scale từng phần
  - Có DevOps expertise
  - Monolith quá lớn (>500k LOC)
- **Start with monolith, extract when needed!**`,

  // Slide 39: Quiz Microservices
  39: `- Đáp án: "Team nhỏ, chưa có DevOps experience"
- Microservices = Complexity overhead`,

  // Slide 40: Final Quiz
  40: `- Đáp án: "Monolith đơn giản, tách sau khi cần"
- 💡 **Key takeaway**: Start simple!
- Chỉ optimize khi thực sự có vấn đề`,

  // Slide 41: Summary
  41: `- Tổng kết 10 phases:
  - Phase 0-4: Foundation (API, Queue, LB)
  - Phase 5-7: Optimization (Stateless, Cache, CDN)
  - Phase 8-9: Advanced (DB Replicas, Microservices)
- **Remember**: Start simple, scale when needed
- Hỏi: "Có câu hỏi gì không?"`,

  // Slide 42: Leaderboard
  42: `- Chuẩn bị reveal kết quả!
- Tạo không khí hào hứng
- Cảm ơn mọi người đã tham gia
- Share contact/resources nếu có`,
};

// Database workshop notes
export const dbWorkshopNotes: Record<number, string> = {
  0: `- Chào mừng đến workshop Database Mental Model
- Workshop dành cho Frontend devs
- Mục tiêu: Hiểu database từ góc nhìn khác`,
  // Add more notes as needed
};

// Get notes for a slide
export function getHostNotes(preset: string, slideId: number): string | undefined {
  const notesMap: Record<string, Record<number, string>> = {
    "system-design-101": systemDesign101Notes,
    "db-workshop": dbWorkshopNotes,
  };
  
  return notesMap[preset]?.[slideId];
}


