# System Design — Complete Interview Guide
> Problem-first approach | Easy → Hard | No topic skipped

---

## How to Use This Guide

1. Pehle problem padho
2. Khud sochne ki koshish karo (5-10 min)
3. Phir answer padho
4. Trade-offs wala section zaroor samjho — yahi interview mein pucha jaata hai

---

## Part 0 — Interview Framework (Har Problem Mein Yahi Follow Karo)

```
1. CLARIFY     → Requirements poochho (2-3 min)
2. ESTIMATE    → Scale calculate karo (1-2 min)
3. DESIGN      → High-level diagram banao (5 min)
4. DEEP DIVE   → Bottleneck identify karo aur solve karo (10-15 min)
5. TRADE-OFFS  → Apni choices justify karo
```

Interviewer chahta hai ki tum **structured sochein**, na ki perfect answer dein.

---

## Part 1 — Building Blocks (Pehle Yeh Samjho)

### 1.1 DNS (Domain Name System)
- `google.com` → `142.250.x.x` IP mein convert karta hai
- Phone book of the internet

### 1.2 Load Balancer
- Traffic ko multiple servers mein distribute karta hai
- Agar ek server crash ho toh dusre ko traffic bhejta hai
- Algorithms: Round Robin, Least Connections, IP Hash

### 1.3 CDN (Content Delivery Network)
- Static files (images, videos, CSS) ko user ke paas wale server se serve karta hai
- Mumbai ka user Mumbai ke CDN node se paayega, US nahi jaayega
- Examples: Cloudflare, AWS CloudFront

### 1.4 Cache
- Frequently accessed data ko fast memory (RAM) mein store karta hai
- DB hit avoid karta hai → bohot fast
- Tool: **Redis**, Memcached
- Cache miss: data cache mein nahi mila, DB se fetch karo
- Cache hit: data cache mein mila, seedha return karo

**Cache Invalidation Strategies:**
| Strategy | Kab Use Karein |
|---|---|
| TTL (Time To Live) | Jab data thodi der mein outdated ho jaye |
| Write-through | Har write pe cache + DB dono update karo |
| Cache-aside (Lazy) | Sirf read pe cache check karo, miss pe DB fetch karo |

### 1.5 Database — SQL vs NoSQL

| | SQL (PostgreSQL, MySQL) | NoSQL (MongoDB, Cassandra, DynamoDB) |
|---|---|---|
| Structure | Fixed schema (tables) | Flexible schema |
| Consistency | Strong | Eventual (generally) |
| Scaling | Vertical (bigger machine) | Horizontal (more machines) |
| Best for | Transactions, relationships | High write load, unstructured data |
| Example use | Banking, Bookings | Social media posts, Logs |

### 1.6 Message Queue
- Producer message daalta hai queue mein
- Consumer apni speed se message uthata hai aur process karta hai
- Decoupling: producer ko consumer ka wait nahi karna
- Tools: **Kafka**, RabbitMQ, AWS SQS

**Kab Use Karein:**
- Slow operations (email, notification, video processing)
- Traffic spikes handle karne ke liye (buffer ki tarah)
- Retry logic chahiye ho

### 1.7 Consistent Hashing
- Data ko multiple servers mein distribute karne ka technique
- Agar ek server add/remove ho toh minimum data move hota hai
- Use: Distributed caches, distributed databases

### 1.8 CAP Theorem
Distributed system mein teen mein se sirf do guarantee kar sakte ho:
- **C**onsistency — har read latest write dekhega
- **A**vailability — har request ka response milega
- **P**artition Tolerance — network failure pe bhi kaam karega

Real world mein P hamesha chahiye, isliye choice hai **CP vs AP**:
- Banking → CP (consistency critical)
- Social media likes → AP (thodi inconsistency okay)

### 1.9 Sharding (Database Horizontal Scaling)
- Ek badi table ko multiple databases mein split karna
- **Horizontal sharding**: rows alag-alag DB mein (User 1-1M → DB1, 1M-2M → DB2)
- **Vertical sharding**: alag-alag tables alag DB mein

### 1.10 Replication
- Same data copy multiple servers pe rakhna
- **Primary-Replica**: Primary writes karta hai, replicas reads serve karte hain
- Fault tolerance + read scaling

### 1.11 Rate Limiting
- Ek user kitni requests kar sakta hai per second/minute
- DDoS attacks se bachata hai
- Algorithms: Token Bucket, Sliding Window

### 1.12 Blob Storage
- Images, videos, large files store karne ke liye
- Database mein binary nahi daalna chahiye
- Examples: AWS S3, Google Cloud Storage

---

## Part 2 — Problems (Easy → Hard)

---

## Problem 1 — URL Shortener (Easy)

### Problem
Design bit.ly — user long URL deta hai, system short URL return karta hai. Koi bhi short URL visit kare toh original pe redirect ho jaye.

---

### Step 1: Clarify Requirements

**Functional:**
- Long URL → Short URL generate karna
- Short URL visit karne pe redirect karna
- Custom alias support? (user apna naam de sake)
- Expiry? (kuch time baad URL delete ho jaye?)
- Analytics? (kitni baar click hua?)

**Non-Functional:**
- Scale: 100M URLs per day
- Read-heavy: reads >>> writes (log of log in visit karte hain)
- Low latency redirect chahiye
- High availability

---

### Step 2: Estimation

```
Writes: 100M URLs/day = ~1200 URLs/sec
Reads: 10:1 ratio = 12000 redirects/sec

Storage:
- 1 URL entry ~500 bytes
- 5 years data = 100M × 365 × 5 = ~180 billion entries? 
  → Actually 100M/day is too high, let's say 1M/day
- 1M/day × 365 × 5 × 500 bytes = ~900 GB
```

---

### Step 3: High-Level Design

```
User → API Gateway → URL Service → Database
                         ↓
                       Cache (Redis)
                         ↓
                    Short URL return

Redirect flow:
User visits short.ly/x7k2p
→ Load Balancer
→ URL Service
→ Redis check (cache hit?) → Yes → 301 Redirect
                           → No  → DB lookup → Cache update → 301 Redirect
```

---

### Step 4: Short URL Generation — Core Problem

**Option A: Random String**
- 6-7 character alphanumeric generate karo (a-z, A-Z, 0-9 = 62 chars)
- 62^7 = ~3.5 trillion combinations — enough
- Problem: collision check karna padega DB mein

**Option B: MD5/Hash**
- Long URL ka MD5 hash lo, pehle 7 chars use karo
- Problem: collision possible, deterministic (same URL = same short code)

**Option C: Auto-increment ID + Base62 Encoding** ✅ Best
```
DB mein auto-increment ID generate karo (e.g., 1000000)
1000000 ko Base62 mein convert karo → "4c92"
Yeh short code ban gaya
```
- No collision
- Predictable length
- Fast

---

### Step 5: Database Schema

```
urls table:
- id          BIGINT PRIMARY KEY AUTO_INCREMENT
- short_code  VARCHAR(10) UNIQUE
- long_url    TEXT
- created_at  TIMESTAMP
- expires_at  TIMESTAMP (nullable)
- user_id     BIGINT (nullable)
```

---

### Step 6: Redirect — 301 vs 302

| | 301 Permanent | 302 Temporary |
|---|---|---|
| Browser behavior | Caches redirect, future visits direct jaate hain | Har baar server se check karta hai |
| Analytics | Accurate nahi (browser cache se) | Accurate (har request server pe aati hai) |
| Server load | Kam | Zyada |

**Agar analytics chahiye → 302 use karo**
**Agar server load kam karna → 301 use karo**

---

### Key Trade-offs
- Base62 vs Hash: Base62 better hai — no collision, predictable
- Cache: Top 20% URLs 80% traffic generate karte hain (Pareto principle) → Redis mein rakho
- DB: SQL fine hai — simple key-value lookup, strong consistency chahiye

---

## Problem 2 — Rate Limiter (Easy-Medium)

### Problem
Design a rate limiter. API calls ko limit karo — e.g., user 100 requests per minute se zyada nahi kar sakta.

---

### Step 1: Clarify Requirements
- Per user limit? Per IP? Per API key?
- Different limits for different APIs?
- Distributed system mein kaam karna chahiye? (multiple servers)
- Limit exceed karne pe kya? (429 Too Many Requests)

---

### Step 2: Algorithms

**Token Bucket** ✅ Most Common
```
Har user ke paas ek bucket hai (e.g., 100 tokens)
Har request pe 1 token consume hota hai
Bucket ek fixed rate pe refill hota hai (e.g., 100 tokens/minute)
Bucket empty → request reject
```
- Burst allowed (momentarily zyada requests)
- Smooth average rate maintain hota hai

**Sliding Window Counter**
```
Last 60 seconds mein kitni requests aayi — count karo
Count > limit → reject
```
- Zyada accurate
- Thoda zyada memory

**Fixed Window Counter** (Simple but flawed)
```
Minute ke start pe counter reset
Problem: 0:59 pe 100 req + 1:01 pe 100 req = 200 req in 2 seconds
```

---

### Step 3: Implementation with Redis

```
Key: "rate_limit:{user_id}"
Value: request count
TTL: 60 seconds

Pseudocode:
count = redis.incr("rate_limit:{user_id}")
if count == 1:
    redis.expire("rate_limit:{user_id}", 60)
if count > 100:
    return 429 Too Many Requests
```

Redis atomic operations ensure karte hain ki distributed environment mein bhi sahi kaam kare.

---

### Step 4: Architecture

```
Request → Rate Limiter Middleware → API Server
              ↓
           Redis Cluster
           (shared state across all servers)
```

**Middleware as separate service** (API Gateway pe):
- Centralized
- Koi bhi service use kar sakti hai
- AWS API Gateway, Kong, Nginx sab support karte hain

---

### Key Trade-offs
- Redis in-memory: fast but data loss on crash (acceptable for rate limiting)
- Token Bucket: burst allow karta hai — user experience better
- Sliding Window: zyada accurate but memory-intensive

---

## Problem 3 — Design a Cache System (Medium)

### Problem
Design a distributed cache like Redis/Memcached.

---

### Step 1: Core Operations
- `get(key)` → value
- `set(key, value, ttl)`
- `delete(key)`

---

### Step 2: Eviction Policies (Jab Cache Full Ho Jaye)

| Policy | Kaise Kaam Karta Hai | Best For |
|---|---|---|
| LRU (Least Recently Used) | Sabse purana accessed item remove | General purpose |
| LFU (Least Frequently Used) | Sabse kam accessed item remove | Popularity-based access |
| FIFO | Pehle aaya pehle gaya | Simple, not great |
| Random | Random item remove | Cache thrashing avoid |

**LRU sabse common hai interviews mein.**

---

### Step 3: LRU Cache — Data Structure

**HashMap + Doubly Linked List**

```
HashMap: O(1) lookup
Doubly Linked List: O(1) move to front (most recently used)

get(key):
  - HashMap se node find karo
  - Node ko list ke front pe move karo
  - Value return karo

set(key, value):
  - Agar exist karta hai → update + move to front
  - Agar nahi → front pe add karo
  - Agar capacity full → tail (LRU) remove karo
```

---

### Step 4: Distributed Cache

Multiple cache servers chahiye? Consistent Hashing use karo:
- Key ka hash nikalo
- Hash ring pe server dhundho
- Woh server is key ka owner hai

**Replication:**
- Har key do cache servers pe rakho
- Agar ek crash ho toh dusra serve kare

---

### Key Trade-offs
- Cache consistency: DB update hone pe cache bhi update karo (write-through) ya lazy rakho (cache-aside)
- Memory vs Disk: Pure in-memory (Redis) = fast but limited size
- Eviction: LRU most balanced hai

---

## Problem 4 — Design WhatsApp (Medium-Hard)

### Problem
Design a messaging app like WhatsApp — 1:1 messaging, group messaging, online status, read receipts.

---

### Step 1: Clarify Requirements

**Functional:**
- 1:1 messaging
- Group messaging (max 256 members)
- Online/offline status
- Message delivered/read receipts
- Media sharing (images, videos)
- Message history

**Non-Functional:**
- 2 billion users
- Low latency (message deliver in < 100ms)
- High availability (99.99%)
- Eventual consistency acceptable for status, strong for messages

---

### Step 2: Estimation

```
2B users, 50% daily active = 1B DAU
Each user 40 messages/day = 40B messages/day
40B / 86400 sec = ~460K messages/sec

Storage:
- 1 message ~100 bytes
- 40B × 100 bytes = 4TB/day
```

---

### Step 3: Core Problem — Message Delivery

**How does A send message to B?**

**Option 1: HTTP Polling** (Bad)
- B har second server se poochhe "koi message aaya?"
- Waste of resources, high latency

**Option 2: Long Polling** (Okay)
- B request kare, server connection open rakhe
- Message aate hi response do
- Better but connection overhead

**Option 3: WebSocket** ✅ Best
```
Client ↔ Server: Persistent bidirectional connection
Message aate hi server push kar deta hai
No polling needed
```

---

### Step 4: Architecture

```
Client A ──WebSocket──→ Chat Server 1
                              ↓
                        Message Queue (Kafka)
                              ↓
                        Chat Server 2 ──WebSocket──→ Client B
                              ↓
                           Message DB (Cassandra)

Presence Service (Online Status):
Client → Heartbeat every 5 sec → Presence Server → Redis
```

---

### Step 5: Message DB — Why Cassandra?

- Write-heavy workload (billions of messages/day)
- Time-series data (messages ordered by time)
- Horizontal scaling easy
- Cassandra write performance best among all DBs

**Schema:**
```
messages table:
- conversation_id   (partition key)
- message_id        (clustering key, time-ordered)
- sender_id
- content
- type              (text/image/video)
- created_at
- status            (sent/delivered/read)
```

---

### Step 6: Online Status

```
User connects → WebSocket established → Presence Service mein "online" mark karo (Redis)
User disconnects → "offline" mark karo + last_seen timestamp

Challenge: Server crash pe status update nahi hoga
Solution: Heartbeat — client har 5 sec mein ping kare
          Server 30 sec tak heartbeat nahi aaya → offline mark karo
```

---

### Step 7: Media Sharing

```
User image bhejta hai:
1. Image upload karo Blob Storage (S3) pe
2. S3 return karta hai URL
3. Message mein URL bhejo (not the image itself)
4. Receiver URL se download kare

CDN use karo images ke liye → fast global delivery
```

---

### Step 8: Group Messaging

**Fan-out approach:**
```
A group mein message bhejta hai (256 members):
Option 1: 256 alag-alag messages create karo (fan-out on write)
  - Pros: Read fast
  - Cons: Write expensive, storage zyada

Option 2: Ek message store karo, sab read kare (fan-out on read)
  - Pros: Write cheap, storage kam
  - Cons: Read slow agar group bada ho

WhatsApp approach: Hybrid — small groups fan-out on write, large groups fan-out on read
```

---

### Key Trade-offs
- WebSocket vs SSE: WebSocket bidirectional (better for chat), SSE unidirectional
- Cassandra vs MySQL: Cassandra write-heavy workload ke liye better
- Fan-out write vs read: Group size pe depend karta hai

---

## Problem 5 — Design Instagram (Medium-Hard)

### Problem
Design Instagram — photo upload, follow system, news feed, likes/comments.

---

### Step 1: Clarify Requirements

**Functional:**
- Photo/video upload karna
- Follow/unfollow users
- News feed (followed users ki posts)
- Like, comment
- Search (users, hashtags)

**Non-Functional:**
- 1B users, 500M DAU
- Read-heavy (feed reads >>> uploads)
- Eventual consistency okay for feed
- Low latency feed generation

---

### Step 2: Core Problem — News Feed Generation

Yeh sabse interesting aur difficult part hai.

**Option 1: Pull Model (Fan-out on Read)**
```
User feed open kare:
1. Saare followed users ki posts fetch karo
2. Merge karo by timestamp
3. Top 20 show karo

Problem: Agar user 1000 logon ko follow kare toh 1000 DB queries!
         High latency
```

**Option 2: Push Model (Fan-out on Write)** ✅
```
Jab koi post kare:
1. Uske saare followers ki feed mein yeh post add karo
2. Feed pre-computed hai Redis mein

User feed open kare:
1. Redis se seedha pre-built feed fetch karo
2. O(1) lookup

Problem: Celebrity problem — agar Virat Kohli post kare, 
         250M followers ke feeds update karne honge!
```

**Option 3: Hybrid** ✅ Best (Instagram actually yahi karta hai)
```
Normal users (< 1M followers): Push model
Celebrities (> 1M followers): Pull model

User ka feed = pre-built feed + real-time celebrity posts merged
```

---

### Step 3: Architecture

```
Upload Flow:
Client → API Gateway → Upload Service → S3 (media)
                              ↓
                         Post DB (MySQL)
                              ↓
                         Kafka (fan-out event)
                              ↓
                    Feed Generation Service
                              ↓
                    User Feed Cache (Redis)

Read Flow:
Client → API Gateway → Feed Service → Redis (feed cache)
                                           ↓ (miss)
                                      Feed Generation
```

---

### Step 4: Database Design

**Users Table (SQL):**
```
users: id, username, email, bio, profile_pic_url, follower_count
```

**Posts Table (SQL):**
```
posts: id, user_id, media_url, caption, like_count, created_at
```

**Follow Graph (Graph DB or SQL):**
```
follows: follower_id, following_id, created_at
```

**Feed (Redis):**
```
Key: "feed:{user_id}"
Value: List of post_ids (sorted by time)
TTL: 24 hours
```

---

### Step 5: Photo Storage

```
Client → Upload Service → S3 bucket
                              ↓
                    Image Processing Service (async)
                    (resize: thumbnail, medium, HD)
                              ↓
                         CDN (CloudFront)
                              ↓
                    User anywhere se fast access kare
```

---

### Key Trade-offs
- Push vs Pull: Celebrity problem ke liye hybrid best hai
- SQL vs NoSQL: Posts ke liye SQL (structured), feed ke liye Redis (speed)
- CDN: Global users ke liye must-have

---

## Problem 6 — Design Uber (Hard)

### Problem
Design Uber — rider trip book kare, driver match ho, real-time tracking, pricing.

---

### Step 1: Clarify Requirements

**Functional:**
- Rider trip request kare with pickup/dropoff
- Nearby driver match karo
- Real-time driver location tracking
- Trip pricing (surge pricing)
- Payment processing

**Non-Functional:**
- Millions of concurrent users
- Real-time location updates (driver har second location update kare)
- Low latency matching (< 2 sec driver match)
- Consistency for payments

---

### Step 2: Core Problem — Location Tracking

**Driver har second location update karta hai:**
```
1M active drivers × 1 update/sec = 1M writes/sec
```

**Geo-spatial indexing chahiye:**
- Nearby drivers dhundne ke liye simple SQL `WHERE distance < X` = slow
- Solution: **Geohash** ya **Quadtree**

**Geohash:**
```
Earth ko grid mein divide karo
Har cell ka ek string code hai (e.g., "te7ud" = Mumbai area)
Nearby cells = similar prefix

Driver "te7ud" mein hai → seedha us cell ke drivers dhundo
Redis Geospatial commands support karta hai natively
```

---

### Step 3: Architecture

```
Driver App → Location Service → Redis (driver locations, Geospatial index)
                                      ↓
Rider Request → Matching Service → Find nearby drivers from Redis
                      ↓                    ↓
               Trip Service ←──── Driver accepted/rejected
                      ↓
               Notification Service → Driver ko notify karo

Real-time Tracking:
Driver location → WebSocket → Rider App (live map update)
```

---

### Step 4: Matching Algorithm

```
1. Rider request aaya (pickup location)
2. Geohash se pickup location ka cell nikalo
3. Us cell + neighboring cells mein available drivers dhundo (Redis)
4. Distance + ETA calculate karo (Google Maps API)
5. Nearest driver ko request bhejo
6. Driver 15 sec mein accept nahi kiya → next driver
7. Driver accepted → trip start
```

---

### Step 5: Surge Pricing

```
Supply/Demand ratio:
- Area mein requests >> available drivers → surge 2x, 3x
- Geohash cell level pe calculate karo
- Real-time update every minute

Storage:
Redis mein har cell ka surge multiplier store karo
TTL: 1-2 minutes (frequently update)
```

---

### Step 6: Database Design

```
trips table (SQL - PostgreSQL):
- id, rider_id, driver_id
- pickup_lat, pickup_lng, pickup_address
- dropoff_lat, dropoff_lng, dropoff_address
- status (requested/accepted/ongoing/completed/cancelled)
- fare, surge_multiplier
- started_at, ended_at

driver_locations (Redis Geo):
- driver_id → (latitude, longitude)
- TTL: 30 sec (agar update nahi aaya toh offline)

trips_history (Cassandra):
- Historical trips, analytics ke liye
```

---

### Key Trade-offs
- Redis Geo vs PostGIS: Redis faster for real-time, PostGIS better for complex geo queries
- WebSocket for tracking: Persistent connection, low latency
- Separate matching service: Independently scalable

---

## Problem 7 — Design Netflix (Hard)

### Problem
Design Netflix — video upload, encoding, streaming, recommendations.

---

### Step 1: Clarify Requirements

**Functional:**
- Video upload (admin/content team)
- Video streaming (users)
- Search
- Recommendations
- Multiple quality levels (360p, 720p, 1080p, 4K)

**Non-Functional:**
- 200M+ subscribers
- Peak: millions concurrent streams
- Low buffering, smooth playback
- Different devices (mobile, TV, web)

---

### Step 2: Video Upload & Processing Pipeline

```
Admin uploads raw video → S3 (raw storage)
                              ↓
                    Video Processing Service (async)
                    - Transcoding: MP4 → HLS format
                    - Multiple resolutions: 360p, 720p, 1080p, 4K
                    - Thumbnail generation
                    - Subtitle extraction
                              ↓
                         S3 (processed storage)
                              ↓
                            CDN
```

**HLS (HTTP Live Streaming):**
- Video ko small chunks (2-10 sec) mein split karo
- Client current connection speed ke hisaab se quality switch kare
- Adaptive bitrate streaming — buffering kam hota hai

---

### Step 3: Streaming Architecture

```
User play button dabata hai:
1. API Server → Video metadata fetch (title, description, available qualities)
2. CDN se video chunks stream hone lagte hain

CDN placement:
- ISP ke andar CDN nodes (Open Connect Appliances)
- Netflix apne servers ISP ke data centers mein rakhta hai
- 95% traffic CDN se, 5% Netflix origin se
```

---

### Step 4: Database Design

```
videos (SQL):
- id, title, description, duration, thumbnail_url
- genres, languages, rating
- release_date, content_type (movie/series)

video_files (SQL):
- video_id, quality (360p/720p/1080p), s3_url, file_size

user_watch_history (Cassandra):
- user_id, video_id, watched_at, progress_seconds

user_profiles (SQL):
- id, account_id, name, age, preferences

ratings (Cassandra):
- user_id, video_id, rating, timestamp
```

---

### Step 5: Recommendation System

```
Collaborative Filtering:
"Jo log X dekhte hain woh Y bhi dekhte hain"

Content-based Filtering:
"Tumne action movies pasand ki → aur action movies recommend"

Netflix actual approach:
- Machine learning models
- A/B testing har thumbnail ke liye bhi
- Real-time + batch processing (Apache Spark)

Data pipeline:
User events (play, pause, skip, complete) → Kafka → 
Spark (processing) → ML Models → Recommendation DB → User Feed
```

---

### Key Trade-offs
- CDN crucial hai: Video data bohot bada hota hai, origin se stream karna impossible
- HLS vs DASH: Both adaptive streaming, HLS Apple devices pe better
- Cassandra for watch history: Write-heavy, time-series data

---

## Problem 8 — Design a Ticket Booking System (Hard)

### Problem
Design BookMyShow — book movie/event tickets, seat selection, payment.

---

### Step 1: Clarify Requirements

**Functional:**
- Events browse karo (movies, concerts)
- Shows/time slots dekhna
- Seat selection + booking
- Payment processing
- Cancellation

**Non-Functional:**
- High contention: IPL tickets — lakhs of users ek seat ke liye compete karte hain
- No double booking (critical)
- Payment consistency
- Read > Write (zyada log browse karte hain, kuch book karte hain)

---

### Step 2: Core Problem — Preventing Double Booking

Yeh sabse important part hai.

**Race Condition:**
```
User A: Check seat 15A → Available
User B: Check seat 15A → Available
User A: Book seat 15A → Success
User B: Book seat 15A → Also Success (WRONG!)
```

**Solution 1: Database Row Lock (Pessimistic Locking)**
```sql
BEGIN TRANSACTION;
SELECT * FROM seats WHERE id = 15 AND status = 'available' FOR UPDATE;
-- seat lock ho gaya, koi aur select nahi kar sakta
UPDATE seats SET status = 'booked', user_id = ? WHERE id = 15;
COMMIT;
```
- Simple
- High contention pe performance issue

**Solution 2: Optimistic Locking**
```sql
-- version field rakho seat pe
SELECT id, version FROM seats WHERE id = 15;
-- version = 5 mili

UPDATE seats SET status = 'booked', version = 6 
WHERE id = 15 AND version = 5;
-- Agar rows affected = 0, matlab kisi ne pehle book kar liya → retry
```
- No lock held
- Better for low contention
- High contention pe retries zyada

**Solution 3: Redis Distributed Lock + Temporary Hold** ✅ Best for Ticket Booking
```
User seat select kare:
1. Redis mein seat lock karo (SET seat:15A userId NX EX 600)
   NX = only if not exists
   EX 600 = 10 minute TTL
2. Lock mila → user 10 min mein payment kare
3. Payment success → DB mein permanent book karo, Redis lock release
4. Payment fail/timeout → Redis lock auto expire → seat available again

Benefits:
- No DB lock held during payment (can take minutes)
- 10 min window user ke liye
- Automatic cleanup on timeout
```

---

### Step 3: Architecture

```
Browse Flow (Read-heavy):
User → CDN → API Gateway → Show Service → Cache (Redis) → DB

Booking Flow (Write, High Consistency):
User → API Gateway → Booking Service → Redis (seat lock)
                           ↓
                     Payment Service (async via Kafka)
                           ↓
                     DB (PostgreSQL - ACID transactions)
                           ↓
                     Notification Service
```

---

### Step 4: Database Schema

```
events: id, name, venue, date, type
shows: id, event_id, start_time, total_seats, available_seats
seats: id, show_id, row, number, category, price, status
bookings: id, user_id, show_id, total_amount, payment_status, created_at
booking_seats: booking_id, seat_id
```

---

### Step 5: Handling IPL-Level Traffic

```
100K users ek saath 10K seats ke liye:
```

**Queue-based approach:**
```
User request aaye → Virtual Queue mein daalo
Queue processor → FIFO order mein process karo
User ko estimated wait time batao

Benefits:
- Server overload nahi
- Fair processing
- User experience better (queue position pata)

Implementation:
Redis List as queue
Multiple workers queue se process karein
```

**Caching:**
```
Show details, seat map → Redis mein cache karo
Sirf booking write operations DB pe jayein
```

---

### Key Trade-offs
- Redis lock vs DB lock: Redis lock better (no DB connection held during payment)
- Queue vs Direct: Queue fair aur scalable, direct fast but unfair under high load
- Eventual vs Strong consistency: Seat booking = strong consistency must (no double booking)

---

## Part 3 — Advanced Concepts

### Microservices vs Monolith

| | Monolith | Microservices |
|---|---|---|
| Deployment | Single unit | Independent services |
| Scaling | Whole app scale karo | Sirf bottleneck service scale karo |
| Complexity | Simple | Complex (service discovery, network calls) |
| Start with | ✅ Small teams | ✅ Large orgs with clear boundaries |
| Team size | Small | Large, multiple teams |

**Rule of thumb:** Monolith se shuru karo, scale hone pe split karo.

### Event-Driven Architecture
```
Service A → Kafka event publish kare
Service B, C, D → Event subscribe karein aur independently process karein

Benefits:
- Loose coupling
- Services independently scalable
- Easy to add new consumers
```

### CQRS (Command Query Responsibility Segregation)
```
Write operations → Command side (optimized for writes)
Read operations → Query side (optimized for reads, often denormalized)

Use case: High read-write disparity, complex read requirements
```

### Database Indexing
```
Index = Book ka index page
Without index: har row scan karo → O(n)
With index: seedha jump karo → O(log n)

B-Tree index: General purpose (SQL default)
Hash index: Exact match queries
Composite index: Multiple columns (order matters!)
Covering index: Query ke saare columns index mein — DB scan hi nahi karta
```

---

## Part 4 — Interview Tips

### Do's
- Hamesha clarify karo pehle
- Numbers estimate karo — interviewer dekhna chahta hai ki tum scale samajhte ho
- Trade-offs explicitly bolte jao
- Bottleneck identify karo aur solve karo
- "It depends" bolna theek hai — phir explain karo kab kya

### Don'ts
- Seedha complex solution mat dena
- Sab kuch over-engineer mat karo
- Ek hi solution present mat karo bina alternatives ke
- Interviewer ke sawaal ignore mat karo

### Common Mistakes
- Scale estimate nahi karna
- Bottleneck identify nahi karna
- Single point of failure chhod dena
- Cache ka mention hi nahi karna (almost har system mein chahiye)
- DB choice justify nahi karna

---

## Part 5 — Quick Reference

### "Kitne servers chahiye" estimate:
```
1 server handle karta hai ~1000 req/sec (HTTP)
1 server handle karta hai ~10K WebSocket connections
Redis: ~100K ops/sec single node
MySQL: ~5K writes/sec, ~50K reads/sec
Cassandra: ~100K writes/sec per node
```

### Common Technology Choices:
| Need | Technology |
|---|---|
| Real-time messaging | WebSocket |
| Async processing | Kafka, RabbitMQ |
| Caching | Redis, Memcached |
| Search | Elasticsearch |
| Time-series data | Cassandra, InfluxDB |
| File storage | S3, GCS |
| Graph data | Neo4j |
| Global low latency | CDN + Edge computing |
| Rate limiting | Redis (Token Bucket) |

---

*Guide complete hogi lekin learning kabhi nahi rukti. Har problem ke baad khud variations socho: "Agar 10x scale hona ho toh kya change karoonga?"*
