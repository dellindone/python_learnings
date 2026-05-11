# Google-Level SSE Interview — Answer Guide

> **Sirf answers mat yaad karo. Reasoning aur trade-offs samjho.**
> Har section ke end mein learning resources hain — pehle video dekho, phir code karo.
> `[POC]` = tumhare actual shopping store code se linked.

---

## Index

1. [Distributed Systems](#section-1--distributed-systems)
2. [System Design HLD](#section-2--system-design-hld)
3. [Database Internals](#section-3--database-internals)
4. [Concurrency and Transactions](#section-4--concurrency-and-transactions)
5. [Python and Async Internals](#section-5--python-and-async-internals)
6. [Architecture and Design Patterns](#section-6--architecture-and-design-patterns)
7. [API Design](#section-7--api-design)
8. [Authentication and Security](#section-8--authentication-and-security)
9. [Caching at Scale](#section-9--caching-at-scale)
10. [Rate Limiting](#section-10--rate-limiting)
11. [Background Workers and Messaging](#section-11--background-workers-and-messaging)
12. [Performance and Query Optimization](#section-12--performance-and-query-optimization)
13. [Testing at Scale](#section-13--testing-at-scale)
14. [Observability](#section-14--observability)
15. [DevOps and Deployment](#section-15--devops-and-deployment)
16. [POC Deep Dive Code Audit](#section-16--poc-deep-dive-code-audit)
17. [Behavioral Googleyness](#section-17--behavioral-googleyness)

---

## Section 1 — Distributed Systems

### Learning Resources First
> YouTube: Search **"Gaurav Sen distributed systems"** — start with CAP theorem video.
> YouTube: Search **"Martin Kleppmann DDIA talks"** — the best academic source.
> Book: **"Designing Data-Intensive Applications"** by Martin Kleppmann — chapters 5, 8, 9. The Bible of this topic.
> YouTube: Search **"MIT 6.824 distributed systems lecture 1"** — free MIT course, very rigorous.

---

**Q1. Horizontal vs vertical consistency?**

Vertical consistency = consistency within ONE node. ACID transactions on a single PostgreSQL instance guarantee this — all reads from that instance see committed writes.

Horizontal consistency = consistency ACROSS multiple nodes. After writing to Node A, does Node B immediately return the new value? This is the hard distributed problem. Network delays mean nodes temporarily disagree. There is no free lunch — you must choose between consistency and availability during a network failure.

---

**Q2. CAP theorem — CP, AP, CA?**

CAP: **C**onsistency (all nodes return same data), **A**vailability (every request gets a response), **P**artition Tolerance (works despite network splits).

**Why CA cannot exist:** Network partitions WILL happen — cables fail, routers restart, AWS availability zones lose connectivity. You cannot "choose" to not have partitions. So you always have P. The real choice is C vs A **during** a partition.

- **CP system (consistent, not always available):** PostgreSQL with synchronous replication. During a partition, it refuses writes rather than risk inconsistency. Cassandra (configured for strong consistency). ZooKeeper. During partition: returns error.
- **AP system (available, not always consistent):** DynamoDB with eventual consistency. Cassandra (default config). CouchDB. During partition: returns possibly stale data.
- **Your shopping app:** Different data requires different choices. Stock count during checkout = CP (must be consistent, can fail). Product browse = AP (slightly stale price is fine, must be available).

> **Interviewer trick:** "Is your PostgreSQL CA?" Answer: No. PostgreSQL alone (single node) is not a distributed system — partitions don't apply. The moment you add a replica, you have a distributed system and must choose.

---

**Q3. Consistency models?**

**Strong consistency (linearizability):** After a write completes, every subsequent read from any node returns the new value. Most expensive — requires coordination. Required for: stock count at checkout, bank balance, order status.

**Eventual consistency:** After a write, replicas will converge to the same value — eventually (could be milliseconds, could be seconds). Acceptable for: product review count (slightly stale is fine), search index, recommendation feeds.

**Causal consistency:** If A causes B, anyone who sees B must also see A. Example: user adds product to cart, then immediately loads cart page — they must see their own add even if replicas haven't synced. Weaker than strong, stronger than eventual. Used by: MongoDB Causal Consistency, Facebook's TAO.

---

**Q5. PACELC theorem?**

Extends CAP. During **P**artition: choose **A** or **C**. **E**lse (normal operation): choose **L**atency or **C**onsistency.

CAP ignores normal operation — PACELC fills this gap.

- **PA/EL:** DynamoDB — available during partition, low latency normally (may return stale data).
- **PC/EC:** Google Spanner — consistent during partition AND consistent normally (pays with higher latency).
- **PC/EL:** Most traditional RDBMSes — consistent during partition, low latency normally (single node, no distribution tradeoff).

> This shows up in Google interviews because Google Spanner is PC/EC and Google expects you to know why.

---

**Q6. Why not wall-clock time for event ordering?**

Clocks drift. NTP (Network Time Protocol) can synchronize to within ~1-50ms — but 1ms is enough to get ordering wrong for high-throughput systems. Worse: leap seconds (clocks jump backward by 1 second), manual adjustments, clock skew after reboots.

Concrete problem: Server A records event at `10:00:00.100`, Server B records event at `10:00:00.099`. Server B's clock is slightly behind. B's event actually happened AFTER A's, but the timestamp says it happened before. You cannot trust wall clocks for ordering in distributed systems.

Google's fix: TrueTime API — GPS receivers + atomic clocks give bounded uncertainty. `TrueTime.now()` returns `[earliest, latest]` — Google waits until the uncertainty window passes before committing, guaranteeing global ordering. This is what makes Spanner unique.

---

**Q7. Lamport clock?**

A logical counter, not a physical time.

Rules:
1. Before each event, increment counter: `C = C + 1`
2. When sending a message, include counter value
3. When receiving a message: `C = max(local, received) + 1`

Guarantee: if event A happened-before event B, then `L(A) < L(B)`.
**What it cannot tell you:** if `L(A) < L(B)`, you cannot conclude A happened before B. They might be concurrent (neither caused the other).

Use: establishing a partial order for log replay, debugging event sequences.

---

**Q8. Vector clock — improvement over Lamport?**

Each node maintains a vector: `[node_A_count, node_B_count, node_C_count]`.

On event at node A: increment A's position. When sending: include full vector. When receiving: element-wise max, then increment own position.

**The key improvement:** Vector clocks detect **concurrent events**. If neither `VC1 ≤ VC2` nor `VC2 ≤ VC1` — the events are concurrent (neither caused the other). Lamport clocks cannot detect this.

Real use: DynamoDB uses vector clocks (called "version vectors") to detect conflicting writes. If two clients wrote to the same key concurrently, DynamoDB detects the conflict and presents both versions to the application to resolve.

---

**Q10. Distributed consensus — why is it hard?**

Getting N nodes to agree on a single value, even when some fail.

**FLP Impossibility (1985):** No deterministic algorithm can guarantee consensus in a purely asynchronous system with even ONE faulty node. Proven mathematically.

**How real systems work around it:** They assume "partial synchrony" — messages are eventually delivered within some bound (even if that bound is unknown). Paxos and Raft work under partial synchrony. They use timeouts to detect failures (may be wrong — a slow node looks like a failed node).

---

**Q11-12. Raft algorithm?**

Three roles: **Leader** (handles all client writes, sends heartbeats), **Follower** (receives entries, votes in elections), **Candidate** (starting an election).

**Normal operation:** Client writes to leader → leader appends to its log → sends AppendEntries to all followers → once majority acknowledge → entry is "committed" → leader responds to client → followers apply to state machine.

**Leader election:** Followers have a random election timeout (150-300ms). If no heartbeat → become Candidate → increment term → vote for self → request votes. First node to get majority wins. Random timeouts prevent split votes.

**Why random timeouts:** If all nodes used the same timeout, they'd all start elections simultaneously — split votes, no winner. Random timeouts ensure one node starts slightly earlier and usually wins before others time out.

> YouTube: Search **"Raft consensus algorithm visualization"** — there's an animated demo that makes this instantly clear.

---

**Q15. [CALC] Raft fault tolerance?**

Formula: cluster tolerates `floor((n-1)/2)` failures. Quorum = `floor(n/2) + 1`.

| Nodes | Quorum needed | Can tolerate failures |
|-------|--------------|----------------------|
| 3 | 2 | 1 |
| 5 | 3 | 2 |
| 6 | 4 | 2 (same as 5!) |
| 7 | 4 | 3 |

**Key insight:** Even numbers give you no extra fault tolerance over the odd number below them. Always use odd-numbered clusters. 5 nodes is the sweet spot: tolerates 2 failures, cheaper than 7 nodes.

---

**Q21. Consistent hashing?**

**Problem with modulo hashing:** `server = hash(key) % N`. If N changes from 5 to 6: nearly ALL keys remap to different servers. Massive cache invalidation.

**Consistent hashing:** Arrange the hash space as a ring (0 to 2^32). Each server is placed at a point on the ring. A key maps to the first server clockwise from it. When adding a server: only keys between the new server and its counter-clockwise neighbor remap. Typically ~1/N of all keys remap. Used by: Cassandra, DynamoDB, Amazon's load balancers, CDNs.

**Virtual nodes:** Place each physical server at 150+ points on the ring (virtual nodes). Benefits: (1) Better load balance — hot spots are distributed. (2) When a server joins/leaves, load is spread across many existing servers. DynamoDB uses ~150 virtual nodes per server.

---

**Q28. Two-Phase Commit (2PC)?**

**Phase 1 — Prepare:**
Coordinator sends "PREPARE" to all participants. Each participant:
- Locks all resources it will need
- Writes to WAL (so it can recover if it crashes)
- Replies "READY" or "ABORT"

**Phase 2 — Commit/Rollback:**
If ALL replied READY: coordinator sends "COMMIT" — participants apply changes, release locks.
If ANY replied ABORT: coordinator sends "ROLLBACK" — all participants undo.

**The fatal flaw:** If the coordinator crashes AFTER sending PREPARE but BEFORE sending COMMIT/ROLLBACK — participants are blocked forever. They've locked resources and cannot proceed without the coordinator's decision. This is an "in-doubt transaction." It blocks other transactions from acquiring those locks. The only fix: human intervention or wait for coordinator recovery.

> This is why microservices avoid 2PC and use Sagas instead.

---

**Q30. Saga pattern?**

**Choreography-based saga (event-driven):**
```
OrderCreated event
  → InventoryService listens → reserves stock → publishes StockReserved
  → PaymentService listens → charges card → publishes PaymentCompleted
  → OrderService listens → sets status=CONFIRMED
```
On failure: each service publishes a failure event, others compensate.

**Orchestration-based saga:**
```
OrderOrchestrator (central coordinator):
  1. Call InventoryService.reserveStock()
  2. Call PaymentService.chargeCard()
  3. Call OrderService.confirmOrder()
  On step 2 failure: call InventoryService.releaseStock()
```

**Choreography:** Loose coupling, harder to visualize the flow, harder to debug.
**Orchestration:** Easy to see the full flow, single point of failure (orchestrator), easier to handle failures.

Google prefers orchestration for complex flows because it's observable.

---

**Q32. Outbox pattern?**

Problem: write to DB AND publish an event atomically. Two separate systems — can't do in one transaction.

Solution:
```
BEGIN TRANSACTION
  INSERT INTO orders (id, user_id, total, status='pending')
  INSERT INTO outbox (event_type='OrderCreated', payload=JSON, published=false)
COMMIT

-- Separate process (OutboxProcessor runs every 100ms):
SELECT * FROM outbox WHERE published=false LIMIT 100
  → publish to Kafka/Redis
  → UPDATE outbox SET published=true
```

Guarantees: if DB commit succeeds, the event WILL be published (eventually). If the app crashes after commit, the outbox processor picks up unpublished events on restart. Consumer must be idempotent (may receive duplicates).

> This is used by every major e-commerce platform for order events. Learn this pattern deeply.

---

### Section 1 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| Designing Data-Intensive Applications (Kleppmann) | Chapters 5, 8, 9 | Book — buy it |
| MIT 6.824 Distributed Systems | Full course — free | YouTube: search "MIT 6.824 2022" |
| Gaurav Sen | CAP, consistent hashing, Raft | YouTube: search "Gaurav Sen system design" |
| Arpit Bhayani | Distributed systems deep dives | YouTube: search "Arpit Bhayani distributed" |
| The Raft Paper | Original paper — very readable | Search "In Search of an Understandable Consensus Algorithm" |
| Martin Kleppmann talks | CRDT, causality, distributed clocks | YouTube: search "Martin Kleppmann distributed" |

---

## Section 2 — System Design HLD

### Learning Resources First
> YouTube: Search **"ByteByteGo system design"** — best visual explanations.
> YouTube: Search **"Gaurav Sen system design interview"** — structured approach.
> Book: **"System Design Interview Vol 1 & 2"** by Alex Xu — the standard interview prep book.
> YouTube: Search **"Hussein Nasser system design"** — goes very deep on internals.

---

**Q1. Design YouTube [DRIVE]**

*First, clarify:* "Are we designing upload + encoding + serving? Or also recommendations? At what scale?" Assume: 500 hours uploaded/minute, 1B DAU, 1B hours watched/day.

**Upload pipeline:**
```
User → presigned S3 URL → upload raw video → trigger encoding job
Encoding farm → split into 10-second chunks → parallel encode each chunk
  → 360p, 720p, 1080p, 4K versions → store chunks back in object storage
  → update DB: video.status = 'ready', resolutions_available = [...]
```

Why chunks: enables resumable uploads, parallel encoding, adaptive bitrate streaming (HLS). The player downloads the next chunk while playing the current one.

**Serving:**
```
User requests video → hit CDN → CDN hit: return cached chunk
                               → CDN miss: fetch from object storage → cache → return
```
Popular videos: pre-warm CDN before publishing. 99% of requests served by CDN, never touching origin.

**View count at scale:**
Do NOT write to DB per view — too slow. Use Redis `INCR video_id_views`. Batch flush to DB every 30 seconds. View count is eventually consistent — acceptable trade-off.

**Bottlenecks by layer:**
1. Upload bandwidth → solution: direct-to-S3 (presigned URL bypasses your servers)
2. Encoding → solution: autoscaling job queue (SQS + EC2 spot instances)
3. Serving → solution: CDN, cache aggressively
4. Metadata DB at 1B videos → solution: sharding by video_id, caching in Redis

---

**Q4. Distributed Rate Limiter — no SPOF [DRIVE]**

*Clarify:* "Per user? Per IP? Which algorithm? What if Redis is down?"

**Architecture:**
```
100 API servers → all connect to → Redis Cluster (3 primary + 3 replica)
Each server uses centralized counters:
  Key: "rate:{user_id}:{endpoint}:{window_minute}"
  Value: request count
  TTL: 60 seconds
```

**Algorithm:** Sliding window counter (approximate). Two Redis keys per user per endpoint: current window count + previous window count. Approximation formula: `estimated = prev_count × (1 - elapsed/60) + curr_count`. O(1) space per user. Error < 1%.

**No SPOF:**
- Redis Cluster provides automatic failover
- Circuit breaker: if Redis error rate > 50% in 10 seconds → fail open (allow all requests, log alert)
- Failing open = slight security risk. Failing closed = app goes down. Choose fail open for non-critical limits.

**Accuracy vs consistency trade-off:** With 100 servers all writing to shared Redis, there's network latency. A user making requests on different servers could briefly exceed the limit by ~1 request window. Acceptable — rate limiting doesn't need to be perfectly exact.

---

**[CALC] Black Friday: 100K orders in 60 seconds**

100K/60 = ~1,667 orders/second peak.

Each order = 1 transaction with ~5 writes (order row, 3 order_items, stock update).
DB writes/sec = 1,667 × 5 = ~8,335 writes/sec.
PostgreSQL can handle 10K-50K writes/sec on good hardware (SSD, properly tuned).

Connection math: if each order holds a DB connection for 10ms → concurrent connections = 1,667 × 0.010 = ~17 connections. Pool of 50 handles this with margin.

BUT: stock reduction is the bottleneck. 1,667 orders/sec all trying to reduce stock on the same popular item = row-level lock contention. Fix: distribute stock across multiple "stock buckets" (sharding). Instead of 1 row with stock=1000, use 10 rows each with stock=100. Orders randomly pick a bucket. Reduces contention by 10×.

---

**[CALC] Four 9s availability**

99.99% uptime = 0.01% downtime.
Downtime allowed per year = 8760 hours × 0.0001 = 0.876 hours = **52.6 minutes/year**.
Per month: 4.38 minutes.
Per week: 1 minute.

What this requires: zero-downtime deployments, automated failover (< 30 seconds), redundancy at every layer, no SPOF.

---

### Section 2 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| ByteByteGo (Alex Xu) | System design patterns, visual | YouTube: search "ByteByteGo" |
| Gaurav Sen | Step-by-step design process | YouTube: search "Gaurav Sen system design" |
| System Design Interview Vol 1 & 2 | Full prep book | Buy on Amazon |
| Arpit Bhayani | Flash sale system, Twitter design | YouTube: search "Arpit Bhayani system design" |
| High Scalability Blog | Real-world architectures | highscalability.com |

---

## Section 3 — Database Internals

### Learning Resources First
> YouTube: Search **"CMU Database Systems 2023"** — Andy Pavlo's free Carnegie Mellon course. Best DB course in the world.
> YouTube: Search **"Hussein Nasser PostgreSQL internals"**
> Book: **"Database Internals"** by Alex Petrov — covers B-trees, LSM trees, storage engines.

---

**Q1. PostgreSQL data storage?**

Data stored in heap files. A heap file = collection of 8KB pages. Each page:
```
[Page Header][Item Pointers → → →][Free Space][← ← ← Tuples (rows)]
```
A table spans multiple 1GB segment files if it grows large. The file path: `$PGDATA/base/{database_oid}/{table_oid}`.

Why 8KB? Matches the OS page size — a single `read()` syscall fetches exactly one DB page.

---

**Q2. Write-Ahead Log (WAL)?**

Every change is written to the WAL (append-only log file) BEFORE the data file is modified.

Why? If server crashes after WAL write but before data file write: on recovery, PostgreSQL replays the WAL to reconstruct the change. Without WAL: partial page writes would leave data files in a corrupt, unrecoverable state.

WAL also enables:
- Streaming replication (replicas replay the WAL)
- Point-in-time recovery (replay WAL to any point)
- Logical decoding (CDC — Debezium reads WAL)
- `pg_rewind` (sync diverged replica back to primary)

---

**Q3. MVCC in PostgreSQL?**

Every row has two hidden columns:
- `xmin`: transaction ID that created this row version
- `xmax`: transaction ID that deleted/updated this row version (0 = still current)

When you UPDATE a row:
1. Old row: `xmax` set to current transaction ID (marked for deletion)
2. New row: inserted with `xmin` = current transaction ID, `xmax` = 0

Both versions exist on disk simultaneously. A transaction sees a row version where `xmin` is committed, `xmin` < snapshot, and `xmax` is 0 or not yet committed.

Result: readers never block writers, writers never block readers. Each transaction sees a consistent snapshot as of its start time.

---

**Q4-5. Dead tuples and VACUUM?**

Updated/deleted rows are never immediately removed — other transactions with earlier snapshots might still need them. These "dead tuples" accumulate.

`VACUUM`: marks dead tuple space as reusable. Non-blocking (table stays available). Auto-vacuum runs automatically every few minutes. Does NOT shrink the file on disk.

`VACUUM FULL`: rewrites the entire table, physically removing dead tuples. Shrinks the file. Requires `ACCESS EXCLUSIVE` lock — table is completely blocked. Only use after a massive one-time deletion (e.g., deleted 90% of rows and need disk space back).

Sign you need more aggressive autovacuum: `n_dead_tup` in `pg_stat_user_tables` is high, autovacuum can't keep up with your write rate.

---

**Q6. Index types?**

| Type | Best for | Example |
|------|---------|---------|
| B-tree (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'prefix%'` | `WHERE price > 100 ORDER BY price` |
| GIN | Full-text search, JSONB `@>`, arrays | `WHERE search_vector @@ query` |
| GiST | Geometric data, ranges, nearest-neighbor | `WHERE location <-> point < 10` |
| BRIN | Naturally ordered large tables (time series) | `WHERE created_at BETWEEN ...` (log tables) |
| Hash | Exact equality only | Rarely better than B-tree |

BRIN is tiny (few KB for a billion-row table) but only works if data is physically stored in order — i.e., rows with similar `created_at` are on the same disk pages.

---

**Q9-10. Query planner and statistics?**

The planner generates multiple possible execution plans and picks the cheapest using:
- `pg_statistic`: histograms of value distributions, null fractions, distinct counts
- `pg_class.reltuples`: estimated row count per table
- Cost parameters: `seq_page_cost`, `random_page_cost`, `cpu_tuple_cost`

`ANALYZE` updates these statistics. Run it manually after bulk imports — otherwise the planner sees stale statistics (e.g., thinks a table has 1000 rows when it now has 10M) and makes terrible plan choices.

---

**Q17. PgBouncer connection pooling modes?**

PgBouncer sits between your app and PostgreSQL, managing a pool of real DB connections.

| Mode | Connection returned when | Compatible with BEGIN/COMMIT? |
|------|--------------------------|-------------------------------|
| Session | Client disconnects | Yes |
| Transaction | Transaction ends | Yes — use this |
| Statement | Statement ends | No — cannot use transactions |

**Why transaction mode for async SQLAlchemy:**
An async app with 1000 concurrent requests doesn't hold a DB connection for the full request — only during the transaction. Transaction pooling matches server connections to actual DB usage. 1000 concurrent requests might only need 20 actual PostgreSQL connections because most requests are processing Python code or waiting for Redis, not actively in a DB transaction.

---

**Q21. Google Spanner?**

Globally distributed relational database with external consistency (linearizability across continents).

**What makes it unique: TrueTime.**
Google's servers use GPS receivers and atomic clocks to know the current time with bounded uncertainty (< 7ms). `TrueTime.now()` returns `[T_earliest, T_latest]` — the true current time is guaranteed to be in this range.

To commit a transaction: Spanner records a commit timestamp and waits until `TrueTime.now().earliest > commit_timestamp`. This guarantees any subsequent transaction starts at a time after this commit — global ordering without a global clock.

**Trade-off:** Every commit waits up to 7ms for the TrueTime uncertainty window. This is the price of global consistency. Worth it for Google's financial and inventory systems.

---

**Q22. [POC] UUID vs BIGSERIAL at scale?**

| | UUID (string, 36 bytes) | BIGSERIAL (8 bytes) |
|-|------------------------|---------------------|
| Index size (10M rows) | ~360 MB | ~80 MB |
| Insert performance | Random B-tree pages = cache misses | Sequential — appends to rightmost leaf |
| Join performance | String comparison = slower | Integer comparison = faster |
| Global uniqueness | Yes | No (scoped to one DB) |
| Readability | `3f5e2a1b-...` | `42` |

For your shopping app (monolith, single DB): BIGSERIAL is better for performance. If you ever split into microservices where order IDs must be globally unique — UUID v7 (time-ordered) is a good middle ground: sequential like BIGSERIAL, globally unique like UUID v4.

---

### Section 3 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| CMU Database Systems (Andy Pavlo) | B-trees, MVCC, query planning, recovery | YouTube: search "CMU 15-445 2023" |
| Hussein Nasser | PostgreSQL internals | YouTube: search "Hussein Nasser postgres" |
| Database Internals (Alex Petrov) | B-trees, LSM trees, storage engines | Book |
| PostgreSQL official docs | MVCC, WAL, VACUUM | postgresql.org/docs |
| Use-the-index-luke.com | Indexes, query optimization | Free website — excellent |

---

## Section 4 — Concurrency and Transactions

### Learning Resources First
> YouTube: Search **"CMU 15-445 concurrency control"** — Andy Pavlo's lectures on locking and isolation.
> YouTube: Search **"Martin Kleppmann transactions"**
> Book: DDIA Chapter 7 — the definitive resource on transactions.

---

**Q1. Isolation levels and what they prevent?**

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|-----------|--------------------|-----------  |
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED (PG default) | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Prevented* |
| SERIALIZABLE | Prevented | Prevented | Prevented |

*PostgreSQL's REPEATABLE READ uses MVCC snapshots which also prevents phantom reads in practice (not required by SQL standard at this level).

**Definitions:**
- **Dirty read:** Reading uncommitted data from another transaction (that might roll back)
- **Non-repeatable read:** Reading the same row twice in one transaction, getting different values because another transaction committed between reads
- **Phantom read:** A range query returns different rows on re-execution because another transaction inserted/deleted rows

---

**Q4. READ COMMITTED not sufficient for overselling?**

At READ COMMITTED, each STATEMENT (not transaction) sees the latest committed data.

Dangerous sequence:
```
T1: BEGIN
T2: BEGIN
T1: SELECT stock FROM products WHERE id=1  → stock = 1
T2: SELECT stock FROM products WHERE id=1  → stock = 1  (sees committed value)
T1: UPDATE products SET stock = stock - 1 WHERE id=1  → stock = 0
T1: COMMIT
T2: UPDATE products SET stock = stock - 1 WHERE id=1  → stock = -1 !!
T2: COMMIT
```

T2's UPDATE reads the current committed value (0) and subtracts 1. Result: stock = -1. Oversell.

**The only safe solution:**
```sql
UPDATE products SET stock = stock - :qty 
WHERE id = :id AND stock >= :qty
RETURNING id
```
This is ONE atomic statement. The check and reduction happen together. Two concurrent transactions: PostgreSQL puts a row-level lock when T1 starts updating. T2 waits. T2 then reads the post-T1 value (0). `0 >= 1` is false → 0 rows affected → application detects failure.

---

**Q7. Deadlock example with orders?**

```
T1 (Order for User A):  locks Product Row 5 (stock reduction), waits for Product Row 7
T2 (Order for User B):  locks Product Row 7 (stock reduction), waits for Product Row 5
→ Deadlock
```

PostgreSQL detects this automatically using a wait-for graph (cycle detection). It aborts one transaction with `ERROR: deadlock detected` and the app must retry.

**Prevention:** Always lock multiple rows in the same order. If all transactions lock products in ascending `product_id` order, no cycle can form.

---

**Q10. Optimistic locking with version column?**

Add `version INTEGER DEFAULT 0` to products table.

```python
# In repository:
# Read
product = await db.get(Product, product_id)
original_version = product.version

# In service: check business rules

# Write with version check
result = await db.execute(
    update(Product)
    .where(Product.id == product_id, Product.version == original_version)
    .values(stock=new_stock, version=original_version + 1)
)
if result.rowcount == 0:
    raise ConflictException("Product was modified concurrently, please retry")
```

SQLAlchemy supports this natively via `__mapper_args__ = {"version_id_col": version}` — raises `StaleDataError` automatically.

**When to use:** Low conflict rate (most requests succeed without conflict), long transactions, or when you want to avoid holding DB locks. When to use pessimistic locking instead: high conflict rate (many concurrent orders for same item during flash sale).

---

**Q12. Write skew anomaly?**

Both transactions read data, make a decision based on it, then write. The combined result violates a constraint.

Shopping app example:
- Business rule: A user cannot have more than 1 pending order.
- T1 (user's browser tab 1): `SELECT COUNT(*) FROM orders WHERE user_id=5 AND status='pending'` → 0. Decides to create order.
- T2 (user's browser tab 2): `SELECT COUNT(*) FROM orders WHERE user_id=5 AND status='pending'` → 0. Decides to create order.
- T1: `INSERT INTO orders ...` → commits.
- T2: `INSERT INTO orders ...` → commits.
- Result: 2 pending orders. Rule violated.

Neither transaction modified what the other read. `SELECT FOR UPDATE` doesn't help (no row to lock yet).

**Fix:** SERIALIZABLE isolation (detects the read-write dependency cycle and aborts one) OR explicit locking with an advisory lock on user_id OR a unique constraint.

---

### Section 4 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| DDIA Chapter 7 | Transactions, isolation levels | Book |
| CMU 15-445 Lectures 17-19 | Concurrency control, locking | YouTube: search "CMU 15-445 2023 lecture 17" |
| PostgreSQL docs | Isolation levels, locking, deadlocks | postgresql.org/docs/current/transaction-iso |
| Martin Kleppmann | Transactions, write skew | YouTube: search "Martin Kleppmann transactions" |

---

## Section 5 — Python and Async Internals

### Learning Resources First
> YouTube: Search **"Anthony Shaw Python async"** — excellent practical async Python.
> YouTube: Search **"ArjanCodes async Python"** — clean, well-explained.
> YouTube: Search **"Hussein Nasser event loop"**
> Official docs: Python asyncio documentation — actually very good.

---

**Q1. Event loop components?**

```
asyncio Event Loop
├── Ready queue: coroutines/callbacks ready to run
├── I/O selector: watches file descriptors for readability/writability
│     (uses epoll on Linux, kqueue on macOS, IOCP on Windows)
├── Timer heap: scheduled callbacks (asyncio.sleep, etc.)
└── Running task: currently executing coroutine

Coroutine: async def function. Pauses at await.
Task: scheduled coroutine. Created by create_task().
Future: a result placeholder. Task is a subclass.
```

**Cycle:** Run ready tasks → check I/O (epoll/kqueue — returns instantly with list of ready FDs) → run I/O callbacks → check timers → repeat.

When a task hits `await some_io()`: it registers with the I/O selector and suspends. The event loop runs other tasks. When the I/O completes, the selector fires, the callback runs, the task is put back in the ready queue.

---

**Q3. create_task() vs await coroutine()?**

```python
# Sequential — total time: 3 seconds
result_a = await fetch_a()  # waits 2 seconds
result_b = await fetch_b()  # waits 1 second

# Concurrent — total time: 2 seconds (max of the two)
task_a = asyncio.create_task(fetch_a())
task_b = asyncio.create_task(fetch_b())
result_a = await task_a
result_b = await task_b
```

`create_task` schedules the coroutine on the event loop immediately. It starts running as soon as the current coroutine yields control (hits any `await`).

**Danger:** If you create a task but never await it (fire and forget), you must hold a reference to it. Without a reference, Python's garbage collector can cancel the task mid-execution. Fix: `background_tasks = set(); task = asyncio.create_task(coro()); background_tasks.add(task); task.add_done_callback(background_tasks.discard)`.

---

**Q8. Blocking the event loop?**

```python
import time
import asyncio

async def bad():
    time.sleep(5)  # BLOCKS the entire event loop for 5 seconds
    # No other request can be served during this time

async def good():
    await asyncio.sleep(5)  # Yields to event loop, other coroutines run

# For blocking library calls (requests, PIL, etc.)
async def good_blocking():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, blocking_function, arg)
    # Runs blocking_function in a thread pool, doesn't block event loop
```

**5 common blockers in FastAPI:**
1. `time.sleep()` → `await asyncio.sleep()`
2. `requests.get()` → `httpx.AsyncClient().get()`
3. `open() + file.read()` → `aiofiles.open()`
4. `subprocess.run()` → `asyncio.create_subprocess_exec()`
5. Synchronous SQLAlchemy operations → async SQLAlchemy

---

**Q12. GIL deep dive?**

The GIL allows only ONE Python thread to execute bytecode at a time, even on multi-core machines. It exists to protect CPython's reference counting (memory management) from race conditions.

**Effect on async:** Async code runs in a single thread — GIL is irrelevant. The event loop switch happens at `await` points, not due to threads.

**Effect on threads (I/O bound):** Two threads CAN overlap on I/O because the GIL is released during I/O waits. `requests.get()` in two threads: both can be waiting for network simultaneously. GIL only blocks CPU execution, not I/O waiting.

**Effect on threads (CPU bound):** Two threads doing pure Python computation: the GIL forces them to take turns. No parallelism. `multiprocessing` is required for true CPU parallelism (each process has its own GIL).

**Python 3.13+:** Experimental "no-GIL" mode. Python 3.14+ will offer optional free-threading.

---

**Q20. Lazy loading in async SQLAlchemy?**

In sync SQLAlchemy: `order.items` triggers a DB query transparently (greenlets handle this under the hood).

In async SQLAlchemy: attribute access is synchronous Python. The event loop cannot run a coroutine inside a synchronous attribute access. Accessing an unloaded relationship raises `sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called`.

```python
# WRONG in async SQLAlchemy
order = await db.get(Order, order_id)
print(order.items)  # MissingGreenlet error!

# CORRECT
from sqlalchemy.orm import selectinload
result = await db.execute(
    select(Order)
    .options(selectinload(Order.items))
    .where(Order.id == order_id)
)
order = result.scalar_one()
print(order.items)  # Works - loaded eagerly
```

**Rule:** In async SQLAlchemy, ALWAYS use eager loading. Never rely on lazy loading.

---

### Section 5 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| Anthony Shaw | Python async, event loop | YouTube: search "Anthony Shaw async Python" |
| ArjanCodes | Async best practices, FastAPI | YouTube: search "ArjanCodes async" |
| Python asyncio docs | Tasks, gather, semaphores | docs.python.org/3/library/asyncio |
| FastAPI docs | Dependency injection, lifespan | fastapi.tiangolo.com |
| SQLAlchemy async docs | Async sessions, selectinload | docs.sqlalchemy.org/en/20/orm/extensions/asyncio |

---

## Section 6 — Architecture and Design Patterns

### Learning Resources First
> Book: **"Clean Architecture"** by Robert C. Martin
> Book: **"Designing Data-Intensive Applications"** — Chapter 11 (stream processing, event sourcing)
> YouTube: Search **"ArjanCodes design patterns Python"** — practical GoF patterns in Python
> YouTube: Search **"Arpit Bhayani outbox pattern"**

---

**Q1. Clean Architecture Dependency Rule?**

```
         ┌─────────────────────────────┐
         │   Frameworks & Drivers      │  (FastAPI, SQLAlchemy, Redis)
         │  ┌───────────────────────┐  │
         │  │  Interface Adapters   │  │  (Controllers, Presenters, Gateways)
         │  │  ┌─────────────────┐  │  │
         │  │  │  Application    │  │  │  (Use Cases)
         │  │  │  ┌───────────┐  │  │  │
         │  │  │  │  Entities │  │  │  │  (Business Rules)
         │  │  │  └───────────┘  │  │  │
         │  │  └─────────────────┘  │  │
         │  └───────────────────────┘  │
         └─────────────────────────────┘
              Dependencies → inward only
```

Entities don't import anything from outer rings. Use Cases don't import FastAPI. Interface Adapters don't import SQLAlchemy model details — they use repository interfaces defined by inner layers.

**Practical impact:** You can swap FastAPI for Django by changing only the outermost ring. You can swap PostgreSQL for MongoDB by changing only the database gateway. The business rules (entities + use cases) are never touched.

---

**Q4. Event Sourcing vs CRUD?**

CRUD: `UPDATE orders SET status = 'shipped'`. You only know the current state.

Event Sourcing: store each state change as an immutable event:
```
OrderCreated   {user_id: 1, items: [...], at: 2024-01-01 10:00}
OrderConfirmed {at: 2024-01-01 10:01}
OrderShipped   {tracking_number: 'XYZ', at: 2024-01-02 14:00}
OrderDelivered {at: 2024-01-03 11:00}
```

Current state = replay all events.

**Benefits:** Perfect audit trail (legal requirement for orders/payments), time travel (reconstruct state at any past moment), decoupled event handlers, natural fit for event-driven systems.

**Drawbacks:** Querying current state is complex (must rebuild projections), event schema evolution is hard (you can never change old events), eventually consistent read models.

**When to use:** Orders (compliance audit), payment history (never lose financial records), inventory changes (audit trail). Not for: product catalog (CRUD is simpler), user preferences.

---

**Q13. Circuit Breaker three states?**

```
[CLOSED] → requests pass through → failure count++ → threshold exceeded
     ↓
[OPEN] → all requests fail fast (no downstream call) → timeout expires
     ↓
[HALF-OPEN] → let N test requests through → if success → [CLOSED] → if fail → [OPEN]
```

Shopping app example: payment provider calls. If Razorpay returns 5xx 5 times in 10 seconds → circuit opens → orders immediately return "payment service temporarily unavailable" → user sees a friendly error instead of waiting 30 seconds for a timeout.

Implementation: use the `tenacity` library or `circuitbreaker` library in Python. Netflix Hystrix is the Java reference implementation.

---

**Q6. Outbox pattern flow?**

Full implementation:
```
Step 1: OrderService (inside one transaction):
  INSERT INTO orders (id, user_id, status='pending', ...)
  INSERT INTO outbox (event_type='OrderCreated', payload='{"order_id": ...}', published=false)

Step 2: OutboxProcessor (runs every 100ms via background job):
  SELECT id, event_type, payload FROM outbox WHERE published=false LIMIT 100
  for event in events:
    publish_to_kafka(event)
    UPDATE outbox SET published=true, published_at=NOW() WHERE id=event.id

Step 3: Consumer (NotificationService):
  Receives 'OrderCreated' from Kafka
  Check: already sent email for this order_id? (Redis SET or DB column)
  If not: send email, mark as sent
```

The critical guarantee: steps 1 happen atomically. If the app crashes after step 1, step 2 picks up the unpublished event on restart. Events may be delivered more than once — that's why step 3 is idempotent.

---

### Section 6 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| Clean Architecture (Robert Martin) | Architecture principles | Book |
| ArjanCodes | Design patterns, SOLID | YouTube: search "ArjanCodes design patterns" |
| Arpit Bhayani | Outbox, event sourcing | YouTube: search "Arpit Bhayani outbox" |
| Cosmic Python (book) | Clean architecture in Python | Free online: cosmicpython.com |

---

## Section 7 — API Design

### Learning Resources First
> YouTube: Search **"Hussein Nasser REST API design"**
> YouTube: Search **"TechWorld with Nana gRPC"**
> Book: **"RESTful API Design"** by Arnaud Lauret
> Google API Design Guide: cloud.google.com/apis/design

---

**Q1. Richardson REST Maturity Model?**

- **Level 0:** HTTP as tunneling transport. One URL, all POST. `POST /api` with action in the body. (SOAP, JSON-RPC)
- **Level 1:** Resources. Multiple URLs. `/products`, `/orders`, `/users`.
- **Level 2:** HTTP verbs + status codes. GET/POST/PUT/PATCH/DELETE. 200/201/404/422. Most production APIs are here.
- **Level 3:** HATEOAS. Responses include hypermedia links to related actions.

```json
// Level 3 response for GET /orders/123
{
  "id": 123,
  "status": "pending",
  "_links": {
    "self": {"href": "/orders/123"},
    "cancel": {"href": "/orders/123/cancel", "method": "POST"},
    "items": {"href": "/orders/123/items"}
  }
}
```

Most companies target Level 2. HATEOAS is theoretically correct REST but rarely implemented.

---

**Q3. Idempotency key system?**

Client generates a UUID per unique operation intent (not per retry):
```
First try:   POST /orders  X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Retry 1:     POST /orders  X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000  (same key)
Retry 2:     POST /orders  X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000  (same key)
```

Server implementation:
```python
async def create_order(idempotency_key: str, data, db, redis):
    # Check if already processed
    cached = await redis.get(f"idem:{idempotency_key}")
    if cached:
        return json.loads(cached)  # Return original response

    # Process order
    order = await order_service.create(data, db)
    response = success(data=order.dict(), message="Order created")

    # Store response with 24h TTL
    await redis.setex(f"idem:{idempotency_key}", 86400, json.dumps(response))
    return response
```

Race condition: two simultaneous requests with same key. Use Redis `SET key value NX` (only set if not exists) — second request waits and reads the stored result.

---

**Q11. Long polling vs SSE vs WebSockets?**

| | Long Polling | Server-Sent Events | WebSockets |
|--|-------------|-------------------|-----------|
| Direction | Server → Client | Server → Client | Bidirectional |
| Protocol | HTTP/1.1 | HTTP/1.1 | WS upgrade |
| Reconnect | Manual | Automatic | Manual |
| Overhead | High (new request per update) | Low | Very low |
| Browser support | Universal | Universal | Universal |
| Best for | Infrequent updates | Feeds, notifications | Chat, games, live collab |

**For order status updates:** SSE is ideal.
- User opens order detail page
- Browser connects to `GET /orders/123/stream`
- Server sends `event: status_update\ndata: {"status": "shipped"}\n\n` when order ships
- Browser updates UI automatically
- SSE auto-reconnects if connection drops

---

**Q12. HTTP/2 multiplexing?**

HTTP/1.1: one request per TCP connection. Browsers open up to 6 parallel connections per domain. Head-of-line blocking: a large slow response on one connection delays all subsequent requests on that connection.

HTTP/2: multiple streams (request-response pairs) multiplexed over ONE TCP connection. Each stream is independent — a slow stream doesn't block other streams. No more 6-connection limitation. Server push (send resources before client asks). Header compression (HPACK). Binary framing instead of text.

HTTP/3 + QUIC: replaces TCP with QUIC (UDP-based). Eliminates TCP-level head-of-line blocking. Faster connection establishment (0-RTT for known servers). Better performance on lossy networks (mobile).

---

### Section 7 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| Hussein Nasser | REST, HTTP/2, gRPC | YouTube: search "Hussein Nasser REST" |
| Google API Design Guide | Best practices from Google | cloud.google.com/apis/design |
| TechWorld with Nana | gRPC, Protocol Buffers | YouTube: search "TechWorld gRPC" |
| Postman Blog | API design patterns | blog.postman.com |

---

## Section 8 — Authentication and Security

### Learning Resources First
> YouTube: Search **"The Cyber Mentor web app security"** — OWASP Top 10 with demos
> YouTube: Search **"Hussein Nasser OAuth 2.0"**
> YouTube: Search **"Fireship JWT"** — great 12-minute visual explanation
> Book: **"The Web Application Hacker's Handbook"**
> OWASP.org — free, authoritative security reference

---

**Q1. OAuth 2.0 — four grant types?**

OAuth 2.0 solves: "App X wants to access User's data on Service Y without User sharing their Service Y password with App X."

**Authorization Code (most secure — for server-side apps):**
```
User → App → Auth Server (login) → Auth Server returns code → App exchanges code for token
```
Client secret stays on server. Code is short-lived and single-use.

**Authorization Code + PKCE (for SPAs and mobile):**
Same flow but instead of client secret, app generates a random `code_verifier`, sends its hash `code_challenge` upfront. On exchange, sends the original `code_verifier`. Auth server verifies the hash. No stored secret needed.

**Client Credentials (machine-to-machine):**
Service A calls Service B with no user involved. `POST /token` with client_id + client_secret → access token.

**Implicit (deprecated):**
Token returned directly in URL fragment. Vulnerable to token leakage via browser history and Referrer headers. Replaced by PKCE.

---

**Q6. JWT algorithm confusion attack?**

JWT header: `{"alg": "HS256", "typ": "JWT"}`. Vulnerable library: trusts the `alg` field from the token header.

Attack 1 — `alg: none`: change header to `{"alg": "none"}`. Vulnerable library skips signature verification. Attacker can forge any payload.

Attack 2 — RS256 to HS256 confusion: server has a public key for RS256 verification. Attacker changes `alg` to `HS256`. Vulnerable library uses the public key as the HMAC secret. Attacker who knows the public key (it's public!) can now create valid tokens.

**Your code is safe:** `jwt.decode(token=token, key=settings.SECRET_KEY, algorithms=["HS256"])` — the allowed algorithm is hardcoded. The library never trusts the header's `alg` field.

**Lesson:** ALWAYS pass `algorithms=["HS256"]` (the list). Never `algorithms=None`.

---

**Q8. SSRF with product image URLs?**

If your admin can set `image_url` and your app fetches that URL to download/validate the image:

Attack: `image_url = "http://169.254.169.254/latest/meta-data/iam/security-credentials/"`

This is the AWS EC2 metadata endpoint. Your server fetches it, returns IAM credentials with full AWS access. Attacker now has your AWS account.

Other targets: internal services (`http://internal-database:5432`), admin interfaces (`http://localhost:9200` for Elasticsearch without auth).

**Fixes:**
1. Validate URL: reject private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x, 127.x)
2. Use an allowlist of permitted domains
3. Use a dedicated image upload service (store file directly, never fetch by URL from server)
4. Run image fetching in a network-isolated sandbox

---

**Q9. IDOR in order API?**

`GET /orders/12345` returns order 12345. If user B knows order ID 12345 belongs to user A and makes this request — they see user A's order, address, items, payment info.

**Fix in service layer:**
```python
async def get_order(order_id: int, current_user: Users, db):
    order = await order_repository.get_by_id(db, order_id)
    if not order:
        raise NotFoundException("Order not found")
    if order.user_id != current_user.id:
        raise ForbiddenException("Access denied")  # NOT 404 — 403
    return order
```

Why 403 and not 404? Security debate: returning 404 leaks no information about the resource's existence. Returning 403 confirms the resource exists but the user can't access it. For orders: 403 is acceptable (user knows their order numbers). For sensitive resources (user profiles of others): 404 is better.

---

**Q16. OWASP Top 10?**

| # | Vulnerability | Shopping App Example |
|---|--------------|---------------------|
| 1 | Broken Access Control | User reads another user's order (IDOR) |
| 2 | Cryptographic Failures | Storing passwords in plain text or MD5 |
| 3 | Injection | SQL injection via unsanitized search query |
| 4 | Insecure Design | No rate limiting on login, no account lockout |
| 5 | Security Misconfiguration | Debug mode in production, default DB password |
| 6 | Vulnerable Components | Using jose library with known JWT CVE |
| 7 | Auth Failures | Not checking is_active, expired token accepted |
| 8 | Software Integrity Failures | Not verifying pip package checksums |
| 9 | Logging Failures | Not logging failed logins, logging passwords |
| 10 | SSRF | Server fetches attacker-controlled product image URL |

---

### Section 8 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| OWASP Top 10 | Security vulnerabilities | owasp.org/Top10 |
| The Cyber Mentor | Practical web app hacking | YouTube: search "The Cyber Mentor OWASP" |
| Hussein Nasser | OAuth, JWT | YouTube: search "Hussein Nasser OAuth" |
| PortSwigger Web Academy | Hands-on labs, free | portswigger.net/web-security |
| Fireship | JWT visual explanation | YouTube: search "Fireship JWT" |

---

## Section 9 — Caching at Scale

### Learning Resources First
> YouTube: Search **"ByteByteGo Redis system design"**
> YouTube: Search **"Hussein Nasser Redis internals"**
> Redis official docs — very well written: redis.io/docs

---

**Q2. Hot key problem in Redis?**

A single Redis key receiving millions of reads/sec. All traffic hits ONE shard in a Redis Cluster. That shard becomes the bottleneck.

**Detection:**
- `redis-cli --hotkeys` (uses OBJECT FREQ, requires LFU eviction policy)
- `redis-cli monitor` (logs all commands — careful, impacts performance)
- Redis Cluster `DEBUG SLEEP` per shard to see which one is slow

**Solutions:**

1. **Local in-process cache:** Each app server keeps a `dict` (or `functools.lru_cache`) for extremely hot keys. TTL must be 1-5 seconds (stale data risk). Eliminates Redis calls for the hottest keys.

2. **Key sharding:** Instead of `product:123`, use `product:123:shard_{random.randint(0,9)}`. Read from a random shard. Write to ALL shards (or use a write-through to one and eventual consistency to others). Distributes reads across 10 Redis keys on potentially 10 different shards.

3. **Read replicas per shard:** Redis 7.0+ supports read replicas per shard in Redis Cluster.

---

**Q4. Redis Lua scripting?**

Lua scripts are atomic on Redis server — no other commands execute between Lua instructions. This is essential for operations that need atomic read-modify-write.

```lua
-- Rate limiting: check and increment atomically
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local count = redis.call('INCR', key)
if count == 1 then
    redis.call('EXPIRE', key, window)
end
return count <= limit and 1 or 0
```

Why atomicity matters: without Lua, between `INCR` and `EXPIRE`, another client could call `INCR` on a key with no TTL — if the process crashes before `EXPIRE`, the counter lives forever. The Lua script ensures both happen or neither does.

---

**Q13. [CALC] Cache hit rate impact on latency?**

```
Average latency = hit_rate × cache_latency + miss_rate × DB_latency
Cache latency = 1ms, DB latency = 50ms

95% hit rate: 0.95 × 1ms + 0.05 × 50ms = 0.95 + 2.5  = 3.45ms
80% hit rate: 0.80 × 1ms + 0.20 × 50ms = 0.80 + 10.0 = 10.8ms  (3x slower!)
50% hit rate: 0.50 × 1ms + 0.50 × 50ms = 0.50 + 25.0 = 25.5ms  (7x slower!)
```

A 15% drop in hit rate triples your average latency. This is why cache hit rate is a critical business metric, not just a technical one. A Black Friday traffic surge that causes cache evictions can make your app appear 7× slower.

---

**Q14. Probabilistic Early Expiration (XFetch)?**

Prevents thundering herd without a distributed lock.

```python
import math, random, time

async def get_with_xfetch(redis_client, key, ttl_seconds, fetch_func, beta=1.0):
    value = await redis_client.get(key)
    remaining_ttl = await redis_client.ttl(key)

    if value:
        # Probabilistically decide to refresh early
        # As TTL → 0, probability → 1 (always refresh)
        # As TTL → ttl_seconds, probability → 0 (never refresh early)
        gap = ttl_seconds - remaining_ttl  # time already elapsed
        early_refresh_probability = math.exp(-beta * remaining_ttl / gap) if gap > 0 else 0

        if random.random() > early_refresh_probability:
            return value  # Use cached value

    # Fetch from DB and update cache
    fresh_value = await fetch_func()
    await redis_client.setex(key, ttl_seconds, fresh_value)
    return fresh_value
```

Different workers will refresh at slightly different times near the expiry — spreading the DB load instead of all hitting at once.

---

### Section 9 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| ByteByteGo | Redis use cases, caching patterns | YouTube: search "ByteByteGo Redis" |
| Hussein Nasser | Redis internals, persistence | YouTube: search "Hussein Nasser Redis" |
| Redis documentation | All data structures, commands | redis.io/docs |
| Martin Kleppmann | Cache coherence, invalidation | DDIA Chapter 5 |

---

## Section 10 — Rate Limiting

### Learning Resources First
> YouTube: Search **"ByteByteGo rate limiting system design"**
> YouTube: Search **"Arpit Bhayani rate limiter"** — builds one from scratch
> Cloudflare Blog: Search "Cloudflare rate limiting sliding window" — real-world implementation

---

**Q1. Sliding Window Log?**

Store a sorted set per user: `{timestamp: request_time}`.

On each request:
1. Remove entries older than `now - window_size` (expired)
2. Count remaining entries
3. If count >= limit: reject
4. Else: add current timestamp, allow

Memory: O(limit) entries per user. At 100 req/min limit, 10M users: 100 × 10M = 1B entries. Impractical.

---

**Q2. Sliding Window Counter (Cloudflare's approach)?**

Use two counters (current window + previous window):

```
current_window_start = floor(now / window_size) * window_size
elapsed = now - current_window_start

estimated_count = previous_count × (1 - elapsed/window_size) + current_count
```

Example: window=60s, limit=100.
At T=45s (45 seconds into current window):
- Previous window: 80 requests
- Current window: 30 requests
- `estimate = 80 × (1 - 45/60) + 30 = 80 × 0.25 + 30 = 50`

Only 2 Redis keys per user. Error rate < 1% vs true sliding window. Used by Cloudflare for their global rate limiting at trillions of requests per day.

---

**Q7. Redlock algorithm and its controversy?**

**Algorithm (5 Redis instances):**
1. Record start time
2. Try to acquire lock on all 5 instances with `SET key uuid NX PX timeout`
3. Count successes. If ≥3 AND elapsed time < lock TTL: lock is acquired
4. To release: send Lua script to delete key only if value = uuid (prevents deleting another client's lock)

**Martin Kleppmann's criticism:**
GC pauses and OS scheduling delays can cause a client to hold a "lock" beyond the TTL:
```
Client 1: acquires lock (TTL=10s)
Client 1: GC pause for 15 seconds (longer than TTL)
Redis: lock expires automatically
Client 2: acquires lock
Client 1: resumes, thinks it still has the lock
Both clients now think they hold the lock → safety violation
```

**Fix: Fencing tokens.** A monotonically increasing counter. Lock acquisition returns token N. Any operation with the lock must include the token. The resource server rejects requests with token < last-seen token.

Redlock doesn't provide fencing tokens. For truly critical sections: use ZooKeeper (provides sequential node numbers as fencing tokens).

---

### Section 10 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| ByteByteGo | Rate limiting algorithms | YouTube: search "ByteByteGo rate limiting" |
| Arpit Bhayani | Build rate limiter from scratch | YouTube: search "Arpit Bhayani rate limiter" |
| Cloudflare Blog | Sliding window at scale | blog.cloudflare.com — search "rate limiting" |
| Martin Kleppmann | Redlock critique | Visit: martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking |

---

## Section 11 — Background Workers and Messaging

### Learning Resources First
> YouTube: Search **"ByteByteGo Kafka vs RabbitMQ"**
> YouTube: Search **"TechWorld with Nana Apache Kafka"** — full beginner-to-advanced course
> YouTube: Search **"Hussein Nasser message queues"**
> Book: **"Kafka: The Definitive Guide"** — free PDF from Confluent

---

**Q1. Kafka vs RabbitMQ?**

| | Apache Kafka | RabbitMQ |
|--|-------------|---------|
| Model | Distributed log | Message broker |
| Message retention | Days/weeks after consumption | Deleted after consumption |
| Throughput | Millions/sec | Thousands/sec |
| Consumer model | Pull (consumer tracks offset) | Push (broker pushes to consumer) |
| Replay | Yes (seek to any offset) | No (message gone after consumed) |
| Ordering | Per-partition | Per-queue (with caveats) |
| Best for | Event streaming, CDC, analytics, audit logs | Task queues, RPC, complex routing |
| Complexity | High (ZooKeeper/KRaft, cluster management) | Lower |

**Choose Kafka for:** Order events stream (multiple consumers: notifications, analytics, audit), CDC (database changes), high throughput.
**Choose RabbitMQ for:** Simple background jobs (email, image resize), request-reply patterns.

---

**Q2. Kafka topic, partition, offset, consumer group?**

```
Topic: "orders"
├── Partition 0: [msg0, msg1, msg2, msg3, ...]  ← offset is position
├── Partition 1: [msg0, msg1, msg2, ...]
└── Partition 2: [msg0, msg1, ...]

Consumer Group "notifications":
├── Consumer A → reads Partition 0
├── Consumer B → reads Partition 1
└── Consumer C → reads Partition 2
  (Each partition assigned to exactly one consumer in a group)

Consumer Group "analytics":
├── Consumer D → reads ALL partitions
  (Different consumer groups are completely independent — both see all messages)
```

**Offset:** Position within a partition. Consumer commits offsets to track progress. On restart: consumer reads from last committed offset (at-least-once delivery).

**Consumer group:** Enables parallel processing across consumers. Add more consumers to scale horizontally. Max parallelism = number of partitions (one consumer per partition).

---

**Q3. Delivery semantics?**

**At-most-once:** Producer doesn't retry. Consumer commits offset before processing. If consumer crashes after committing but before processing: message is lost. Used for: metrics, low-value events where loss is acceptable.

**At-least-once (standard):** Producer retries until ACK from broker. Consumer commits offset after successful processing. If consumer crashes mid-processing: message is redelivered on restart. Consumer MUST be idempotent.

**Exactly-once (since Kafka 0.11):** Producer uses idempotent writes (sequence numbers prevent duplicates). Consumer + DB commit happen in the same Kafka transaction. Most expensive. Required for: financial transactions, inventory updates.

---

**Q7. Outbox pattern with full delivery guarantees?**

See Section 6, Q6 for the full flow. The critical insight for messaging:

The Outbox pattern solves the "dual write problem" — you cannot atomically write to a DB and publish to a message queue. The solution: treat the message queue as secondary. First write to DB (outbox table), then publish. The outbox processor provides at-least-once delivery guarantee from your own DB.

Combined with idempotent consumers: you get effectively exactly-once semantics without Kafka transactions.

---

**Q10. Poison pill message?**

A message that always causes the consumer to crash or throw an exception (bad data, unexpected format, logic error). Without handling: the consumer gets stuck in an infinite retry loop on this one message.

**Solution: dead letter queue (DLQ)**
After N retries (3-5), move the message to a DLQ topic. Continue processing other messages. Alert on DLQ depth. Review and fix/replay manually.

In ARQ: configure `max_tries=3`. Failed jobs go to a separate queue. In Kafka: use a DLQ topic pattern.

---

### Section 11 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| TechWorld with Nana | Kafka full course | YouTube: search "TechWorld Nana Kafka" |
| ByteByteGo | Kafka vs RabbitMQ | YouTube: search "ByteByteGo Kafka" |
| Confluent | Kafka Definitive Guide (free PDF) | confluent.io/resources |
| Arpit Bhayani | Outbox, saga pattern | YouTube: search "Arpit Bhayani outbox saga" |

---

## Section 12 — Performance and Query Optimization

### Learning Resources First
> Website: **use-the-index-luke.com** — the best free resource on SQL indexes
> YouTube: Search **"CMU 15-445 query execution"**
> YouTube: Search **"Hussein Nasser database indexing"**
> Tool: `pgbadger` — PostgreSQL log analyzer, find slow queries in production

---

**Q2. Covering index for product list?**

The query: `SELECT id, name, price FROM products WHERE category_id = ? AND is_active = true ORDER BY created_at DESC LIMIT 20`

Regular index on `(category_id, is_active)`: PostgreSQL finds matching rows via index, then fetches each row from the heap to get `id`, `name`, `price`, `created_at`. Each heap fetch = random I/O.

Covering index (includes all columns the query needs):
```sql
CREATE INDEX idx_products_covering 
ON products (category_id, is_active, created_at DESC)
INCLUDE (id, name, price);
```

PostgreSQL can answer this query entirely from the index — never touches the heap. This is an "index-only scan". Especially powerful for read-heavy workloads.

Note: `INCLUDE` columns are stored only in the leaf nodes (not branch nodes) — they don't affect how the index is traversed, just what's available at the leaf.

---

**Q3. Partial index?**

Index with a WHERE clause:
```sql
CREATE INDEX idx_active_products 
ON products (category_id, created_at DESC) 
WHERE is_active = true;
```

Since your `GET /products` always filters `is_active = true`, this index only contains active products. If 10% of products are inactive, the index is 10% smaller, fits better in memory, and is faster to scan.

Size comparison for 10M products: Full index = ~800 MB. Partial index (only active 90%) = ~720 MB. For a table where only 1% are active: full index = 100MB, partial index = 1MB. Dramatic difference.

---

**Q9. Window functions?**

```sql
-- Top 3 most expensive products per category
SELECT category_id, id, name, price FROM (
    SELECT 
        category_id, id, name, price,
        ROW_NUMBER() OVER (
            PARTITION BY category_id 
            ORDER BY price DESC
        ) as rank
    FROM products
    WHERE is_active = true
) ranked
WHERE rank <= 3
ORDER BY category_id, price DESC;
```

Other useful window functions: `RANK()` (gaps for ties), `DENSE_RANK()` (no gaps), `LAG(price, 1)` (previous row's price), `SUM(quantity) OVER (PARTITION BY user_id ORDER BY created_at)` (running total).

---

**Q13. [POC][CALC] 5ms query → 800ms under load?**

The query takes 5ms. The request takes 800ms. The difference (795ms) is NOT in PostgreSQL.

**Most likely cause: connection pool wait.**
Pool has 10 connections. 500 concurrent requests all need a connection. First 10 get connections immediately. Next 490 wait in queue. If each transaction takes 5ms and transactions are sequential per connection: queue wait = 490 connections / 10 workers × 5ms per transaction = 245ms average wait (but with variance, p95 = 800ms).

**Debug steps:**
1. `EXPLAIN ANALYZE` — confirm query itself is 5ms ✓
2. Add timing log: `start = time.time(); result = await db.execute(...); print(f"DB: {time.time()-start}")` — see actual DB time
3. Add timing before `db.execute` — see connection wait time
4. Check `pg_stat_activity` — how many connections in state "active" vs "idle"?
5. Increase pool size (but don't exceed PostgreSQL's `max_connections`)
6. Use PgBouncer transaction pooling to handle more concurrent requests with fewer actual connections

---

### Section 12 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| use-the-index-luke.com | Indexes, B-trees, query optimization | Free website |
| CMU 15-445 | Query execution, join algorithms | YouTube: search "CMU 15-445 2023" |
| Hussein Nasser | PostgreSQL query optimization | YouTube: search "Hussein Nasser postgres performance" |
| pgBadger | Analyze PostgreSQL slow query logs | GitHub: darold/pgbadger |

---

## Section 13 — Testing at Scale

### Learning Resources First
> YouTube: Search **"ArjanCodes Python testing pytest"**
> YouTube: Search **"Arpit Bhayani testing microservices"**
> Book: **"Python Testing with pytest"** by Brian Okken
> pytest documentation: docs.pytest.org

---

**Q1. Testing pyramid vs trophy?**

**Pyramid (traditional):**
```
        [E2E]          Few, slow, expensive
      [Integration]    Some
    [Unit Tests]       Many, fast, cheap
```
Premise: unit tests are fastest and cheapest. Maximize them.

**Trophy (Kent C. Dodds):**
```
      [E2E]           Few
    [Integration]     Most tests here
  [Unit Tests]        Few
[Static analysis]     Always
```
Premise: unit tests with mocks don't test real behavior. A service that returns the right result from a mock doesn't prove the actual DB query works. Integration tests give more confidence per test.

**For your shopping app:** Trophy is better. The interesting bugs are:
- Service + DB interaction (does the query actually work?)
- Transaction rollback (does it actually rollback?)
- Auth middleware + route (does get_current_user block unauthenticated requests?)

Pure unit tests of the service layer with mocked repositories don't catch these.

---

**Q8. Five types of test doubles?**

| Type | What it does | Example |
|------|-------------|---------|
| Dummy | Placeholder, never actually used | `None` passed to a parameter you don't test |
| Stub | Returns hardcoded values | `mock_repo.get_by_id.return_value = fake_product` |
| Mock | Stub + verifies it was called correctly | `mock_repo.get_by_id.assert_called_once_with(5)` |
| Spy | Wraps real object, records calls | `spy_service = MagicMock(wraps=real_service)` |
| Fake | Working implementation, simplified | In-memory DB dict instead of PostgreSQL |

For your shopping app:
- Unit tests of service logic: use Stubs for repositories
- Integration tests: use a Fake (real test PostgreSQL DB)
- Testing that email was triggered: use Mock (verify `enqueue` was called with correct args)

---

**Q9. F.I.R.S.T principles?**

- **Fast:** Tests must run quickly. Slow tests = developers skip them.
- **Isolated:** Each test is independent. No shared state. Tests can run in any order.
- **Repeatable:** Same result every run, any environment. No reliance on external services.
- **Self-Validating:** Pass or fail — no human interpretation needed. `assert` statements.
- **Timely:** Written alongside the code (TDD) or immediately after. Not months later.

---

### Section 13 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| ArjanCodes | pytest, fixtures, mocking | YouTube: search "ArjanCodes pytest" |
| Python Testing with pytest (Okken) | Complete pytest guide | Book |
| pytest-asyncio docs | Async test setup | github.com/pytest-dev/pytest-asyncio |
| Cosmic Python | Testing in clean architecture | cosmicpython.com (free online) |

---

## Section 14 — Observability

### Learning Resources First
> YouTube: Search **"TechWorld with Nana Prometheus Grafana"**
> YouTube: Search **"ByteByteGo observability"**
> YouTube: Search **"ArjanCodes Python logging"**
> Book: **"Observability Engineering"** by Charity Majors — the definitive guide

---

**Q1. Three pillars?**

| Pillar | What it answers | Tools |
|--------|----------------|-------|
| Metrics | "Is the system healthy right now?" Aggregated numbers over time | Prometheus + Grafana |
| Logs | "What exactly happened in this request?" Discrete events | ELK stack, Grafana Loki |
| Traces | "Where did this request spend its time?" Request journey across services | Jaeger, Zipkin, AWS X-Ray |

**When each fails you:**
- Metrics alone: "Error rate is 1%" — but WHY? Which users? Which endpoint? Which DB query?
- Logs alone: "Here's the error" — but which service called which? How long did each step take?
- Traces alone: Shows timing per span — but can't tell you the content of what was processed

You need all three.

---

**Q2. SLI, SLO, SLA?**

```
SLI (measured fact):     "99.2% of requests returned 200-499 in the last 30 days"
                                        ↑ this is what you actually measure

SLO (internal target):   "We will maintain 99.9% success rate"
                                        ↑ this is your engineering goal

SLA (legal contract):    "We guarantee 99.5% uptime or provide service credits"
                                        ↑ this is what you promise to customers
```

SLO is always more strict than SLA — you need buffer between "we're about to violate the SLO" and "we've violated the SLA." That buffer is your reaction time.

**Error budget:** If SLO = 99.9%: error budget = 0.1% = 43.8 minutes/month. This is how much downtime or error you can afford. Use it as a deployment velocity gauge: if budget is almost exhausted → freeze non-critical deploys.

---

**Q5. Four Golden Signals (Google SRE)?**

| Signal | Definition | Shopping App Metric |
|--------|-----------|-------------------|
| Latency | Time to serve a request | p95 of `GET /products` |
| Traffic | Demand on the system | Requests per second |
| Errors | Rate of failed requests | % of 5xx responses |
| Saturation | How "full" is the system | DB connection pool usage % |

**Critical:** Distinguish error latency from success latency. 500 errors that return in 1ms (fast failures) can mask high latency on successful requests. Always separate `p95_success` from `p95_error`.

**Saturation as a leading indicator:** When saturation increases (connection pool 80% full, CPU 70%), latency and errors will follow. Saturation alerts catch problems BEFORE they impact users.

---

**Q9. Cardinality in Prometheus?**

Prometheus stores one time series per unique combination of metric name + labels.

```python
# LOW CARDINALITY — good
http_requests_total{method="GET", endpoint="/products", status="200"}
# Maximum time series: 4 methods × 20 endpoints × 10 status codes = 800 series

# HIGH CARDINALITY — dangerous
http_requests_total{method="GET", endpoint="/products", user_id="abc123"}
# Maximum time series: 4 × 20 × 10M users = 800M series → Prometheus crashes
```

At 800M series: Prometheus uses ~50 bytes per series = 40 GB RAM just for labels. OOM crash.

**Rule:** Never use high-cardinality values as labels: user IDs, session IDs, request IDs, IP addresses, product IDs. These belong in log entries, not metric labels.

---

### Section 14 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| TechWorld with Nana | Prometheus, Grafana, full setup | YouTube: search "TechWorld Nana Prometheus" |
| ByteByteGo | Observability patterns | YouTube: search "ByteByteGo observability" |
| Google SRE Book | SLI/SLO, golden signals, error budgets | Free online: sre.google/sre-book |
| ArjanCodes | Python structured logging | YouTube: search "ArjanCodes logging Python" |
| Observability Engineering (Majors) | Modern observability philosophy | Book |

---

## Section 15 — DevOps and Deployment

### Learning Resources First
> YouTube: Search **"TechWorld with Nana Kubernetes full course"** — best free K8s course
> YouTube: Search **"TechWorld with Nana Docker"**
> YouTube: Search **"ByteByteGo CI/CD pipeline"**
> Book: **"Kubernetes in Action"** by Marko Luksa

---

**Q1. Blue-Green deployment?**

```
Load Balancer
     │
     ├── Blue (current production, v1.0)  ← 100% traffic
     └── Green (new version, v1.1)        ← 0% traffic

Step 1: Deploy v1.1 to Green environment
Step 2: Run smoke tests on Green (same DB as Blue)
Step 3: Switch Load Balancer: Green = 100%, Blue = 0%
Step 4: Monitor for 1 hour
Step 5a: If good → decommission Blue
Step 5b: If bad → switch LB back to Blue (instant rollback)
```

Critical requirement: DB migrations must be backward-compatible. During the switch, both Blue and Green briefly handle traffic. The DB schema must work with both v1.0 and v1.1 code.

---

**Q2. Canary deployment?**

```
Load Balancer
     │
     ├── Old version → 95% of traffic
     └── Canary (new version) → 5% of traffic

Monitor: error rate, p95 latency, business metrics (order completion rate)
If good after 30 min: 20% → 50% → 100%
If bad at any point: drop canary to 0%, investigate
```

Canary % decision: based on blast radius. A payment calculation change → 1% canary for 2 hours. A typo fix in a static message → 50% canary for 10 minutes.

**Metrics to monitor during canary:**
- Error rate difference (canary vs old): should be < 0.1%
- p99 latency difference: should be < 20%
- Business metric: conversion rate, order completion rate

---

**Q5. Backward-compatible migration: NOT NULL column?**

Direct `ALTER TABLE orders ADD COLUMN shipping_address TEXT NOT NULL` fails — existing rows have no value.

**3-step zero-downtime approach:**

```
Deploy 1: Add column as nullable
  ALTER TABLE orders ADD COLUMN shipping_address TEXT;
  (zero downtime — just adds a nullable column)

Backfill (separate job, run in batches):
  UPDATE orders SET shipping_address = '' WHERE shipping_address IS NULL
  LIMIT 10000;  -- run repeatedly until done
  (Don't update all 100M rows at once — too many locks)

Deploy 2: Add NOT NULL constraint
  ALTER TABLE orders ALTER COLUMN shipping_address SET NOT NULL;
  (fast — PostgreSQL checks constraint inline, all rows already non-null)
```

Between Deploy 1 and Deploy 2: old code (no shipping_address field) runs fine — column is nullable. New code writes to the column. Zero downtime.

---

**Q7. Kubernetes liveness vs readiness?**

**Liveness probe:** Is the container alive? If it fails → restart the container.
Use for: detecting deadlocks, infinite loops, corrupted state. Example: `GET /healthz` → if it hangs or returns 500 → container is stuck → kill and restart.

**Readiness probe:** Is the container ready to receive traffic? If it fails → remove from load balancer (stop sending traffic), but DON'T restart.
Use for: startup (app is still loading), temporary unavailability (DB connection lost), maintenance mode. Example: `GET /ready` → checks DB connectivity → if DB is down, return 503 → load balancer stops sending traffic → no restart, container is alive but not ready.

**Critical difference:** Liveness failure → restart (fixes deadlocks). Readiness failure → traffic removed (prevents sending requests to an unhealthy pod). Wrong liveness probe = restart loop (thrashing). Wrong readiness probe = requests to a pod that's not ready (errors).

---

### Section 15 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| TechWorld with Nana | Docker, Kubernetes full courses | YouTube: search "TechWorld Nana Docker" and "TechWorld Nana Kubernetes" |
| ByteByteGo | CI/CD patterns, deployment strategies | YouTube: search "ByteByteGo CI CD" |
| Kubernetes in Action (Luksa) | Deep K8s book | Book |
| GitHub Actions docs | CI/CD pipeline setup | docs.github.com/actions |

---

## Section 16 — POC Deep Dive — Code Audit

---

**Bug 1: Timezone comparison in `auth_service.py:44`**

```python
# CURRENT BUG:
if stored_token.expires_at < datetime.utcnow():
```

`stored_token.expires_at` was stored as `datetime.now(timezone.utc)` — timezone-AWARE.
`datetime.utcnow()` returns timezone-NAIVE.

Python raises `TypeError: can't compare offset-naive and offset-aware datetimes`.

```python
# FIX:
from datetime import datetime, timezone

if stored_token.expires_at < datetime.now(timezone.utc):
```

Note: `datetime.utcnow()` is deprecated since Python 3.12. Always use `datetime.now(timezone.utc)` going forward.

---

**Bug 2: `Users(**user.model_dump())` safety**

`model_dump()` returns all fields in the Pydantic schema. If the schema has more fields than the ORM model, SQLAlchemy raises `TypeError: unexpected keyword argument 'some_field'`.

More dangerous: if the Pydantic schema allows extras (`model_config = ConfigDict(extra='allow')`), an attacker could inject `role='admin'` in the request body, which would be included in `model_dump()` and passed to the ORM model.

Defensive pattern:
```python
# Only pass known safe fields
new_user = Users(
    name=user.name,
    email=user.email,
    password=user.password
)
```

---

**Bug 3: Inconsistent response format**

`response.py` returns `"status": "True"` (string).
`exceptions.py` returns `"success": false` (boolean).

TypeScript client:
```typescript
if (response.success) { ... }
```
For success: `response.success = "True"` (non-empty string → truthy → works by accident)
For `"False"` string errors: `"False"` is also truthy (non-empty string!) → error responses ALSO pass the check. Real bug.

Fix `response.py`:
```python
def success(data: Any, message: str) -> dict:
    return {
        "success": True,    # boolean
        "message": message,
        "data": data,
        "error": None,
    }
```

---

**Bug 4: Refresh token in query params (security)**

`GET /auth/refresh_token?refresh_token=eyJ...` appears in:
- Nginx access logs
- CloudFront/CDN logs
- Application logs
- Browser history
- HTTP `Referer` headers when navigating away

Tokens in URL logs = security breach.

Fix: Change to `POST /auth/refresh` with JSON body:
```python
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    return await controller.refresh_token(data.refresh_token, db)
```

---

**Bug 5: Wrong type annotation on dependency**

```python
# WRONG:
async def get_current_user_function(current_user: AsyncSession = Depends(get_current_user)):

# CORRECT:
async def get_current_user_function(current_user: Users = Depends(get_current_user)):
```

FastAPI does NOT enforce dependency return types at runtime — it will work. But:
- Your IDE shows `AsyncSession` methods when you type `current_user.` (wrong autocomplete)
- mypy/pyright report type errors
- `current_user.id` works at runtime but IDE shows it as an error
- This confuses future maintainers

Type annotations in Python are documentation + tooling support. Wrong annotations mean broken tooling.

---

**Bug 6: `_issue_tokens` partial failure**

User created → `_issue_tokens` called → `save_refresh_token` DB commit fails → exception → 500 response.

User exists in DB (from the `create_user` commit) but cannot log in because the session expired mid-creation. User tries to register again → `ConflictException("Email already registered")`. User is stuck.

Fix: wrap both in ONE transaction:
```python
async def register(self, data, db):
    # Single transaction for the entire registration
    existing = await auth_repository.get_user_by_email(db, data.email)
    if existing:
        raise ConflictException("Email already registered")

    data.password = hash_password(data.password)
    new_user = Users(**{"name": data.name, "email": data.email, "password": data.password})
    db.add(new_user)
    await db.flush()  # Get the new user's ID without committing yet

    access_token = create_access_token(new_user.id, new_user.role)
    refresh_token_value = create_refresh_token(new_user.id)

    await auth_repository.save_refresh_token(db, new_user.id, refresh_token_value, expires_at)
    await db.commit()  # Both user and token committed atomically

    return access_token, refresh_token_value
```
If `save_refresh_token` fails, the entire transaction rolls back — user is NOT created. Client gets 500 and can retry cleanly.

---

**Bug 7: Missing `is_active` check in `get_current_user`**

Current: validates JWT signature + fetches user from DB. Does NOT check `user.is_active`.

A banned user with a valid JWT (not yet expired) can still make all authenticated API calls.

Fix in `core/dependencies.py`:
```python
async def get_current_user(credentials, db) -> Users:
    # ... JWT decode and user fetch ...
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user
```

Why in `get_current_user` and not per-route: it applies to ALL authenticated routes automatically. Adding per-route is error-prone — developers forget.

---

## Section 17 — Behavioral — Googleyness

### How Google evaluates behavioral questions

Google rates behavioral equally with technical. They use a structured rubric called "Googleyness + Leadership":
- **Intellectual humility**: can you be wrong and handle it gracefully?
- **Data-driven**: do you use metrics, not opinions?
- **Ownership**: do you own problems, not just your assigned tasks?
- **Clarity under ambiguity**: can you make good decisions with incomplete information?

**Format for all answers: STAR**
**S**ituation (20%) → **T**ask (10%) → **A**ction (50%) → **R**esult (20%)
Interviewers want 70% on Action — what YOU specifically did.

---

**Q1. Technical decision that was wrong?**

Structure:
1. Name the decision confidently (no hedging)
2. Why it seemed correct at the time (you weren't dumb)
3. How you discovered it was wrong (data, not gut feeling)
4. Specific actions: who you told, how quickly, what you did
5. Measurable result
6. What you changed in your process going forward

Example answer:
"On a previous project I chose Redis for our primary session store to avoid DB load. Six months later we had random session drops affecting 2% of logins — tracked via Datadog. Root cause: Redis eviction was silently dropping sessions under memory pressure because I hadn't configured a `maxmemory-policy` appropriate for session data.

I found it by querying Redis `INFO stats` — `evicted_keys` counter was non-zero. I had used `allkeys-lru` (evicts anything) instead of `volatile-lru` (only evicts keys with TTLs). Fixed in 10 minutes — changed the policy and added alerts on `evicted_keys > 0`.

The process change: I now write down assumptions explicitly during design review, and each assumption gets a monitoring check."

---

**Q7. 2am 500 errors — exact debugging process?**

Google expects a methodical, data-driven answer. They're testing incident response thinking.

```
Step 1 (< 2 min): Check dashboards
  - Which endpoint? What % error rate? When did it start?
  - Does the timing correlate with a recent deploy?

Step 2 (< 2 min): Check recent activity
  - git log --since="2 hours ago" on main
  - Recent config changes, feature flag changes

Step 3 (< 5 min): Read the actual errors
  - grep "ERROR\|500\|exception" app.log | tail -50
  - What is the actual exception message? Stack trace?

Step 4 (depends on step 3 finding):
  DB errors → check pg_stat_activity for locks, long queries
  Redis errors → check Redis connection pool, memory usage
  Auth errors → check JWT secret rotation, token format
  500 with no exception → check for OOM (dmesg)

Step 5: Rollback decision
  If deploy correlates AND bug is in new code → rollback first, investigate second
  If no deploy correlation → investigate first (rollback won't help)

Step 6: Fix and prevent
  - Root cause documented
  - Alert added so this is caught faster next time
  - Postmortem written (no blame, just facts + action items)
```

The key signal Google looks for: you don't guess. Every step produces data that informs the next step.

---

**Q10. When is a system "good enough"?**

Google answer: define SLOs first, build to meet them — not beyond.

A system is "good enough" when:
1. It meets its defined SLOs with error budget remaining
2. The engineering cost of the next improvement exceeds the business value
3. The team's time is better spent on customer-facing features

How to decide: "Our p95 is 180ms against an SLO of 200ms. We have 20ms headroom. The optimization to get to 100ms would take 3 engineer-weeks. Those 3 weeks could instead ship feature X that would increase conversion by 2%. That 2% conversion increase is worth 10× more to the business than a 80ms improvement no user will notice."

Google SRE culture: if you have error budget remaining, use it. Take risks. Ship features. Over-engineering for reliability beyond your SLO is wasted investment.

---

### Section 17 Resources

| Resource | What to study | Where |
|----------|--------------|-------|
| Google SRE Book | SRE culture, incident management, postmortems | Free: sre.google/sre-book |
| Grokking the Behavioral Interview | STAR format, Google-specific tips | educative.io |
| Life at Google YouTube channel | Engineering culture insights | YouTube: search "Life at Google engineering" |
| "Radical Candor" by Kim Scott | Feedback culture, how Google gives feedback | Book |

---

## Master Resource List — Complete Learning Roadmap

### Books (Priority Order)
1. **Designing Data-Intensive Applications** — Martin Kleppmann *(most important — read this first)*
2. **System Design Interview Vol 1 & 2** — Alex Xu *(interview preparation)*
3. **Clean Architecture** — Robert C. Martin *(architecture)*
4. **Database Internals** — Alex Petrov *(storage engines, B-trees)*
5. **Kafka: The Definitive Guide** — Confluent *(free PDF, messaging)*
6. **Observability Engineering** — Charity Majors *(monitoring, SRE)*

### YouTube Channels (Subscribe to all)
| Channel | Best for |
|---------|---------|
| **ByteByteGo** (Alex Xu) | System design, visual explanations |
| **Gaurav Sen** | System design, distributed systems |
| **Arpit Bhayani** | Deep dives, backend engineering |
| **Hussein Nasser** | Networking, databases, protocols |
| **TechWorld with Nana** | Kubernetes, Docker, DevOps |
| **ArjanCodes** | Python, design patterns, clean code |
| **CMU Database Group** | Database internals (academic, rigorous) |

### Free Courses
| Course | Platform | Search For |
|--------|---------|-----------|
| MIT 6.824 Distributed Systems | YouTube | "MIT 6.824 2022" |
| CMU 15-445 Database Systems | YouTube | "CMU 15-445 2023" |
| CMU 15-721 Advanced Database | YouTube | "CMU 15-721 2023" |
| Google SRE Book | Free online | sre.google/sre-book |
| Cosmic Python | Free online | cosmicpython.com |

### Practice Platforms
| Platform | Use for |
|---------|---------|
| interviewing.io | Mock interviews with real engineers |
| Pramp | Free peer mock interviews |
| PortSwigger Web Academy | Security hands-on labs |
| pgexercises.com | SQL practice |
