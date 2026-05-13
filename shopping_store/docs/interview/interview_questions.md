# Google-Level SSE Interview — Complete Question Bank

> **Bhai, yeh Google, Meta, Amazon SWE-3/SWE-4 level ke questions hain.**
> Agar in sabka jawab dena aaye toh koi bhi company crack ho jaayegi.
> Answers ke liye `interview_answers.md` dekho.
> `[POC]` = tumhare shopping store code se directly linked question.
> `[CALC]` = back-of-envelope calculation expected hai.
> `[DRIVE]` = tum khud conversation drive karo, interviewer sirf follow karta hai.

---

## Index

1. [Distributed Systems](#section-1--distributed-systems)
2. [System Design — HLD](#section-2--system-design--hld-drive-the-conversation)
3. [Database Internals](#section-3--database-internals--deep-dive) *(includes Normalization & Relationships)*
4. [Concurrency & Transactions](#section-4--concurrency--transactions) *(includes ACID)*
5. [Python & Async Internals](#section-5--python--async-internals)
6. [Architecture & Design Patterns](#section-6--architecture--design-patterns)
7. [API Design](#section-7--api-design)
8. [Authentication & Security](#section-8--authentication--security)
9. [Caching at Scale](#section-9--caching-at-scale)
10. [Rate Limiting](#section-10--rate-limiting)
11. [Background Workers & Messaging](#section-11--background-workers--messaging)
12. [Performance & Query Optimization](#section-12--performance--query-optimization)
13. [Testing at Scale](#section-13--testing-at-scale)
14. [Observability](#section-14--observability)
15. [DevOps & Deployment](#section-15--devops--deployment)
16. [POC Deep Dive — Code Audit](#section-16--poc-deep-dive--code-audit)
17. [Behavioral — Googleyness](#section-17--behavioral--googleyness)

---

## Section 1 — Distributed Systems

> *Yeh section Google mein sabse zyada fail hota hai. Ek bhi concept skip mat karna.*

### Fundamentals
1. What is the difference between horizontal and vertical consistency in distributed systems?
2. Explain the CAP theorem with a real-world example for each of: CP, AP, and CA systems. Why can CA not exist in a distributed system?
3. What is the difference between strong consistency, eventual consistency, and causal consistency? Give a shopping app example where each is appropriate.
4. What is a network partition? Why is it unavoidable and not a choice?
5. What is the PACELC theorem and how does it extend CAP?

### Clocks & Ordering
6. Why can't you use wall-clock time to order events in a distributed system?
7. What is a Lamport clock? How does it establish a partial ordering of events?
8. What is a vector clock? How does it improve on Lamport clocks? What problem does it solve that Lamport can't?
9. What is the difference between happened-before ordering and causal ordering?

### Consensus
10. What is the distributed consensus problem? Why is it hard?
11. Explain the Raft consensus algorithm at a high level. What are the three roles a node can have?
12. What is leader election in Raft? What happens when the leader dies?
13. What is a split-brain scenario? How does quorum prevent it?
14. What is the difference between Paxos and Raft? Why is Raft considered more understandable?
15. `[CALC]` You have 5 Raft nodes. How many can fail before the cluster stops working? What about 6 nodes? What about 3 nodes?

### Replication
16. What is the difference between synchronous and asynchronous replication? What are the trade-offs?
17. What is replication lag? How does it manifest in a user-facing shopping app?
18. What is the difference between master-slave (primary-replica) and multi-master replication?
19. What is a write conflict in multi-master replication? How do systems resolve it (last-write-wins, CRDTs, operational transforms)?
20. What is a CRDT (Conflict-free Replicated Data Type)? Give an example of where you'd use one.

### Distributed Patterns
21. What is consistent hashing? Why is it better than modulo hashing for distributing load across nodes?
22. What is a virtual node in consistent hashing? Why does it improve load balance?
23. What is the gossip protocol? How does it scale to thousands of nodes?
24. What is a Bloom filter? What guarantees does it make? What can't it guarantee?
25. What is a Merkle tree? How does DynamoDB use it for anti-entropy?
26. What is the "thundering herd" problem? Where can it occur in a distributed system?
27. What is backpressure? How do you implement it in a producer-consumer system?

### Distributed Transactions
28. What is the two-phase commit (2PC) protocol? Walk through the steps for an order that spans two services.
29. What is the coordinator failure problem in 2PC? Why does it cause transactions to be stuck in-doubt?
30. What is the Saga pattern? Compare choreography-based vs orchestration-based sagas.
31. What is a compensating transaction? Give an example for the order creation flow.
32. What is the Outbox pattern? Why is it critical for reliable event publishing after a DB commit?
33. What is Change Data Capture (CDC)? How does Debezium use PostgreSQL's WAL for CDC?

---

## Section 2 — System Design / HLD *(Drive the conversation)*

> *Google mein 45 min milte hain. Tum khud requirements clarify karo, estimate karo, design karo.*
> *Har question mein: requirements → estimation → high-level → deep-dive → bottlenecks → trade-offs.*

### Classic FAANG Questions
1. `[DRIVE]` Design YouTube. Focus on: video upload pipeline, encoding at scale, CDN strategy, view count at 1B views/day.
2. `[DRIVE]` Design WhatsApp. Focus on: message delivery guarantees, online presence, message ordering, end-to-end encryption architecture.
3. `[DRIVE]` Design Uber's surge pricing system. Focus on: real-time geospatial data, pricing calculation, fairness.
4. `[DRIVE]` Design a distributed rate limiter that works correctly across 100 API servers. No single point of failure.
5. `[DRIVE]` Design a notification system for 1 billion users. Supports: push, SMS, email. Priority queues. User preferences.
6. `[DRIVE]` Design Google Search autocomplete. Focus on: trie vs other data structures, ranking, latency < 100ms, personalization.
7. `[DRIVE]` Design a distributed job scheduler (like AWS Lambda Scheduled Events). Supports: cron syntax, exactly-once execution, millions of jobs.
8. `[DRIVE]` Design a real-time leaderboard for a gaming app with 10M concurrent players.
9. `[DRIVE]` Design a distributed key-value store (like DynamoDB or Redis). Focus on: consistent hashing, replication, failure handling.
10. `[DRIVE]` Design a payment processing system. Focus on: idempotency, exactly-once semantics, fraud detection, audit trail.

### Shopping App Specific
11. `[DRIVE][CALC]` Your shopping app needs to handle a Black Friday flash sale: 10M users, 1M products, 100K orders in 60 seconds. Design the system. What breaks first? How do you fix each layer?
12. `[DRIVE]` The product search on your shopping app is slow at 10M products. Design a search system using Elasticsearch. How do you keep it in sync with PostgreSQL?
13. `[DRIVE]` Design the inventory management system for your shopping app to guarantee no overselling across multiple warehouses.
14. `[DRIVE]` Your shopping app needs to send order confirmation emails, SMS, and push notifications. Design a fan-out notification system.

### Estimation Questions
15. `[CALC]` Estimate the storage required for your shopping app at 1M products, each with a 500-word description, 5 images at 2MB each, and 1000 reviews per product.
16. `[CALC]` Your API serves 50K requests/second. Each request does 3 DB queries averaging 10ms. How many DB connections do you need minimum? What pool size do you configure?
17. `[CALC]` You want 99.99% availability (four 9s). How many minutes of downtime per year does that allow? What does that mean for your deployment strategy?
18. `[CALC]` Your Redis cache holds product data. Each product object is 2KB. You want to cache 500K products. How much RAM does Redis need? (Factor in Redis overhead of ~60 bytes per key.)

---

## Section 3 — Database Internals & Deep Dive

### Normalization & Relationships
1. What is database normalization? Why do we do it?
2. What is 1NF (First Normal Form)? Give an example of a table that violates it.
3. What is 2NF? What is a partial dependency? Give an example.
4. What is 3NF? What is a transitive dependency? Give an example using a products table.
5. What is BCNF (Boyce-Codd Normal Form)? How is it stricter than 3NF?
6. When would you intentionally **denormalize** a table? What do you trade off?
7. What is a One-to-Many relationship? Give an example from the shopping app. How is it implemented in SQL (foreign key)?
8. What is a Many-to-Many relationship? Give an example. Why do you need a junction/association table?
9. What is a One-to-One relationship? When would you split a table into two with a 1:1 relationship instead of keeping all columns together?
10. What is referential integrity? What does `ON DELETE CASCADE` vs `ON DELETE RESTRICT` vs `ON DELETE SET NULL` do?
11. `[POC]` Your `products` table has `category_id` as a foreign key. What happens if you try to delete a category that has 50 products? How do you handle this gracefully in the API?
12. `[POC]` You have Products and Orders — a product can be in many orders, an order can have many products. What is the relationship type? Design the junction table with relevant columns (quantity, price at time of order). Why store price in the junction table?

### Storage Internals
1. How does PostgreSQL store data on disk? What is a heap file? What is a page?
2. What is a Write-Ahead Log (WAL)? Why must every change be written to WAL before the data file?
3. What is MVCC (Multi-Version Concurrency Control)? How does PostgreSQL implement it using transaction IDs (XIDs)?
4. What is a dead tuple in PostgreSQL? Why does it exist? What happens if you don't vacuum?
5. What is `VACUUM` vs `VACUUM FULL`? What are the trade-offs?
6. What is the difference between a B-tree index and a GIN index? What is a GiST index? When would you use BRIN?
7. What is an expression index? Give an example where you'd add one to the products table.
8. What is index bloat? How does it happen and how do you fix it?

### Query Planner
9. What is the PostgreSQL query planner? What statistics does it use to choose a plan?
10. What is `ANALYZE` (the standalone command, not EXPLAIN ANALYZE)? When do you need to run it manually?
11. What is a sequential scan vs an index scan vs a bitmap heap scan? When does the planner choose each?
12. What is a nested loop join vs a hash join vs a merge join? When does each win?
13. What is a "bad" query plan? Give an example of a planner making the wrong choice and how you fix it.
14. What is `pg_stat_statements`? How do you use it to find slow queries in production?

### Scaling Databases
15. What is the difference between vertical scaling and horizontal scaling for PostgreSQL?
16. What is logical replication vs physical replication in PostgreSQL?
17. What is PgBouncer? What are the three connection pooling modes (session, transaction, statement)? Which mode is required for async SQLAlchemy and why?
18. What is database sharding? Compare range sharding vs hash sharding vs directory sharding.
19. What is a hot shard? How do you detect and fix it?
20. What is read-your-writes consistency? How do you ensure it when you have a primary + read replicas?
21. What is Google Spanner? What makes it different from traditional distributed databases?

### POC Database
22. `[POC]` Your `users` table uses UUID string as primary key. At 10M users, how does this compare to BIGSERIAL for: index size, insert performance, join performance? Run the math.
23. `[POC]` Your `orders` table will have 100M rows in 2 years. Write the exact Alembic migration to add the optimal index for `GET /orders` (user's order history, sorted by date). Explain why that specific index.
24. `[POC]` You notice `autovacuum` is running constantly on your `cart_items` table. Why? What does it tell you about your access pattern?
25. `[POC]` Your `price` column is `Numeric(10,2)`. At 100M product price lookups per day, does the Numeric type create any performance concern vs Float? When would you switch?

---

## Section 4 — Concurrency & Transactions

### ACID Properties
1. What does ACID stand for? Define each property in one sentence.
2. What is Atomicity? Give a concrete example from the shopping app where atomicity matters. What happens if atomicity is violated?
3. What is Consistency? Who is responsible for maintaining it — the database or the application?
4. What is Isolation? Why is "full isolation" expensive? What does PostgreSQL give you by default?
5. What is Durability? If a server crashes right after `COMMIT` returns success, is your data safe? What mechanism ensures this?
6. `[MIND-BENDER]` ACID says transactions are Atomic — all or nothing. But your `register` flow had: `create_user` commit → `save_refresh_token` commit — two separate commits. Was this ACID? What specifically was violated and what real-world failure did it cause?
7. `[MIND-BENDER]` Durability guarantees data survives a crash. But if your PostgreSQL server's disk itself fails (not just the process), is your committed data safe? What infrastructure do you need to truly guarantee durability?
8. `[MIND-BENDER]` BASE (Basically Available, Soft state, Eventually consistent) is the opposite of ACID. Name one place in your shopping app where eventual consistency is acceptable and one place where it is absolutely not acceptable. Justify both.

### Isolation Levels Deep Dive
1. Name all 4 SQL isolation levels in order from lowest to highest. What anomalies does each prevent?
2. What is a phantom read? Give a concrete example in the context of placing an order.
3. What is Serializable Snapshot Isolation (SSI)? How does PostgreSQL implement it differently from traditional locking?
4. PostgreSQL's default is `READ COMMITTED`. Your order creation uses a transaction. Is that sufficient to prevent overselling? Prove your answer.

### Locking
5. What is a row-level lock vs a table-level lock in PostgreSQL? When does each occur?
6. What is `SELECT FOR UPDATE`? What is `SELECT FOR UPDATE SKIP LOCKED`? When is the latter useful?
7. What is a deadlock? Give a concrete example with two concurrent order placements. How does PostgreSQL detect and resolve it?
8. What is lock escalation? Does PostgreSQL do it?
9. What is an advisory lock in PostgreSQL? Give an example of where you'd use it.

### Advanced Patterns
10. What is optimistic concurrency control (OCC)? Implement it for the stock reduction in your shopping app using a `version` column.
11. What is the lost update problem? Is it possible even inside a transaction at READ COMMITTED? Prove it.
12. What is the write skew anomaly? Give a concrete example. Which isolation level prevents it?
13. What is a two-phase lock (2PL)? How is it different from two-phase commit (2PC)?
14. What is MVCC's "snapshot too old" problem in PostgreSQL (ORA-01555 equivalent)?

### POC
15. `[POC]` Two users simultaneously place an order for the last item (stock=1). Your code does: `SELECT stock → check > 0 → UPDATE stock = stock - 1` inside a `BEGIN`. At READ COMMITTED, can both succeed? Prove it with the exact sequence of operations.
16. `[POC]` Rewrite the stock reduction as a single SQL statement that atomically checks and reduces, returning whether it succeeded. Why is this safer?
17. `[POC]` Your `async with db.begin()` — if an exception happens inside the block, does SQLAlchemy guarantee a rollback? What if the exception is caught and swallowed inside the block?

---

## Section 5 — Python & Async Internals

### Event Loop Deep Dive
1. Draw the Python async event loop. What are the components: event loop, coroutines, tasks, futures, callbacks?
2. What is the difference between a `Task` and a `Future` in asyncio?
3. What happens when you call `asyncio.create_task()` vs just `await coroutine()`?
4. What is `asyncio.gather()` vs `asyncio.wait()` vs `asyncio.as_completed()`? When do you use each?
5. What is `asyncio.Semaphore`? How do you use it to limit concurrent DB connections?
6. What is `asyncio.Queue`? Build a producer-consumer pattern with backpressure using it.
7. What is a "fire and forget" task? What is the risk if you don't hold a reference to the Task object?

### Blocking the Event Loop
8. You call `requests.get(url)` inside an `async def` function. What happens? What is the fix?
9. What is `asyncio.run_in_executor()`? When do you need it?
10. Name 5 common operations that accidentally block the event loop in a FastAPI app.
11. What is `uvloop`? How much faster is it than the default event loop? Why can't it be used on Windows?

### Python Internals
12. What is the GIL and why does it exist? Does it affect async code? Does it affect multithreaded CPU-bound work?
13. What is the difference between `threading`, `multiprocessing`, and `asyncio` in Python? When do you use each?
14. What is a generator? What is the relationship between generators and coroutines?
15. What is `__slots__`? How does it reduce memory usage? When would you add it to a model class?
16. What is `lru_cache`? What is the difference between `@lru_cache` and `@cache`? What is the risk of using `lru_cache` on a method?

### FastAPI & SQLAlchemy Internals
17. FastAPI resolves dependencies in a tree. If two routes share the same `Depends(get_db)`, do they get the same session instance or different ones?
18. What is `expire_on_commit=False` in SQLAlchemy? What happens if you access an attribute after commit without this?
19. What is the difference between `db.execute()`, `db.scalar()`, `db.scalars()`, and `db.scalar_one_or_none()`?
20. What is lazy loading in SQLAlchemy async? Why does it raise `MissingGreenlet` or `greenlet_spawn` errors?
21. What is `selectinload` vs `subqueryload` vs `joinedload` vs `contains_eager`?

### POC
22. `[POC]` Your `get_db` uses `yield`. What happens if a request handler throws an exception — does the session get closed? What if the exception happens inside the `except` block of your `get_db`?
23. `[POC]` You want to run 3 independent DB lookups (products, categories, user) concurrently inside a single request. How do you do this with `asyncio.gather()` and what is the risk with a single shared session?

---

## Section 6 — Architecture & Design Patterns

### Clean Architecture
1. What is the Dependency Rule in Clean Architecture? Draw the layers and arrow directions.
2. What is an Anti-Corruption Layer (ACL)? When do you need one?
3. What is the difference between a Domain Event and an Integration Event?
4. What is Event Sourcing? Compare it to traditional CRUD. What problems does it solve?
5. What is CQRS? When does it make sense? What are the operational costs?
6. What is the Outbox pattern? Draw the flow for your order service publishing an "order created" event reliably.
7. What is the Strangler Fig pattern? How would you use it to migrate your monolith to microservices?

### Design Patterns (Gang of Four)
8. What is the Observer pattern? How is it different from the Pub/Sub pattern?
9. What is the Decorator pattern? Give an example in Python. How does FastAPI's `Depends()` relate to this?
10. What is the Strategy pattern? Give an example with payment methods (credit card, UPI, wallet).
11. What is the Template Method pattern? How does SQLAlchemy's `Base` class use it?
12. What is the Command pattern? How does it relate to the Command in CQRS?
13. What is the Circuit Breaker pattern? What are its three states?
14. What is the Bulkhead pattern? Give an example in the context of your shopping app.

### Microservices Patterns
15. What is service discovery? Compare client-side vs server-side discovery.
16. What is a service mesh? What does Istio/Envoy give you that your application code doesn't?
17. What is the Sidecar pattern?
18. What is an API gateway vs a reverse proxy vs a load balancer? When do you need each?
19. What is the Strangler Fig pattern? How would you migrate your shopping app to microservices without downtime?
20. `[POC]` If you split your shopping app into: Auth Service, Product Service, Order Service — what shared infrastructure would all three need? What problems does shared infrastructure create?

---

## Section 7 — API Design

### REST Advanced
1. What is Richardson's REST Maturity Model? What are the 4 levels?
2. What is HATEOAS? Design a response for `GET /orders/123` that is fully HATEOAS-compliant.
3. What is idempotency? Implement an idempotency key system for `POST /orders`. What do you store and where?
4. What is the difference between `If-Match`, `If-None-Match`, `If-Modified-Since`, and `If-Unmodified-Since` headers?
5. Design API versioning for an API with 50M clients. What is your deprecation strategy?

### gRPC & GraphQL
6. What is gRPC? How does it differ from REST? What are Protocol Buffers?
7. When would you choose gRPC over REST for a microservice? When would you stick with REST?
8. What is GraphQL? What is the N+1 problem in GraphQL and how does DataLoader solve it?
9. What is GraphQL subscription? How does it work under the hood?
10. What are the security risks specific to GraphQL that don't exist in REST?

### Advanced API Patterns
11. What is long polling? What are Server-Sent Events (SSE)? What are WebSockets? Compare all three for a real-time order status update feature.
12. What is HTTP/2? What does multiplexing solve that HTTP/1.1 couldn't?
13. What is HTTP/3 and QUIC? What problem with TCP does QUIC solve?
14. What is request coalescing? How do reverse proxies use it to reduce origin load?
15. What is a partial response in API design? How does `?fields=id,name,price` work at scale (Google's approach)?

### POC
16. `[POC]` Your API returns the same `product_id` in both the URL path and the response body. Is that redundant? What is the RESTful convention?
17. `[POC]` Design the `PATCH /admin/products/{id}` response. The admin updates only the price. What exactly should the response body contain — the full updated product or just a success message? Justify.
18. `[POC]` Your logout endpoint is `POST /auth/logout` and takes the refresh token. What should happen if the refresh token is already invalid (expired or already logged out)? 200 or 404?

---

## Section 8 — Authentication & Security

### OAuth & OpenID
1. What is OAuth 2.0? What problem does it solve? What are the four grant types?
2. What is the difference between OAuth 2.0 and OpenID Connect (OIDC)?
3. What is PKCE (Proof Key for Code Exchange)? Why is it needed for mobile/SPA apps?
4. What is the difference between an `access_token`, `id_token`, and `refresh_token` in OIDC?
5. What is a JWT `iss` (issuer) claim? Why should you always validate it?

### Attack Vectors
6. What is a JWT algorithm confusion attack (CVE-2015-9235)? How does using `alg: none` allow bypassing signature verification?
7. What is a JWT `kid` (key ID) injection attack? How do you prevent it?
8. What is SSRF (Server-Side Request Forgery)? Give an example where your product image URL upload feature could be exploited.
9. What is IDOR (Insecure Direct Object Reference)? Give an example from your order API.
10. What is mass assignment? Can it happen with Pydantic schemas? Prove your answer.
11. What is a timing attack on token comparison? Show the difference between vulnerable and safe code.
12. What is a rainbow table attack? Why does bcrypt's per-password salt prevent it?

### Security at Scale
13. What is mTLS (mutual TLS)? When would you use it between microservices?
14. What is a zero-trust architecture? How is it different from perimeter security?
15. What is secrets management at scale? Compare: env vars, Vault by HashiCorp, AWS Secrets Manager.
16. What is the OWASP Top 10? Name all 10 and give one example from a shopping app for each.
17. What is Content Security Policy (CSP)? Does it affect a pure JSON API?

### POC
18. `[POC]` Your `create_access_token` puts `role` in the JWT payload. An attacker decodes the JWT (base64), changes `"role": "user"` to `"role": "admin"`, re-encodes. Does this work? Why or why not?
19. `[POC]` Your `get_current_user` does not check `user.is_active`. A banned user with a valid JWT can still make API calls. Fix this — where exactly in the code and why there?
20. `[POC]` An admin creates a product with `description` containing `<script>alert('xss')</script>`. This gets stored in the DB and returned in API responses. Does this create an XSS vulnerability in your backend? Under what conditions does it become dangerous?

---

## Section 9 — Caching at Scale

### Distributed Cache Design
1. How do you distribute cache across multiple Redis nodes? Compare: Redis Cluster vs Redis Sentinel vs client-side consistent hashing.
2. What is the hot key problem in Redis? How do you detect it? What are the solutions (local cache, key sharding, read replicas)?
3. What is Redis pipelining? How does it reduce latency for bulk operations?
4. What is Redis Lua scripting? Why does it give you atomicity?
5. What is Redis Pub/Sub? How is it different from Streams (Redis 5+)?
6. What is a Redis Stream? How is it different from a List used as a queue?

### Cache Patterns Deep Dive
7. What is the read-through vs cache-aside pattern? Who is responsible for loading the cache in each?
8. What is write-behind (write-back) caching? What is the risk of data loss?
9. What is refresh-ahead caching? When does it help?
10. What is a negative cache? When do you need one?
11. What is cache coherence in a distributed system? How is it different from cache invalidation?
12. What is stale-while-revalidate? How does it work in HTTP caching? Could you implement the same pattern at the application level?

### Hard Problems
13. `[CALC]` Your product cache has a 95% hit rate. DB query takes 50ms. Cache lookup takes 1ms. Average latency = ? What happens to average latency if hit rate drops to 80%?
14. What is probabilistic early expiration (also called XFetch)? Write the algorithm in pseudocode.
15. You cache a product list. The list has 20 products. One product is updated. You need to invalidate all lists containing that product without knowing which page numbers they appear on. Design a solution using Redis Sets.
16. `[POC]` Your cache key is `products:page=1:limit=20:cat=5`. If a new product is added to category 5, this cache is stale. But you also have `products:page=2:limit=20:cat=5`. How do you invalidate all of them efficiently? What data structure in Redis helps?

---

## Section 10 — Rate Limiting

### Algorithms Deep Dive
1. Implement the Sliding Window Log algorithm. What is its memory complexity? Why is it impractical at scale?
2. Implement the Sliding Window Counter algorithm using Redis. How does it approximate the sliding window while using O(1) space?
3. Implement Token Bucket using Redis with atomic Lua script. Handle the case where the bucket refills over time.
4. What is the Leaky Bucket algorithm? How is it different from Token Bucket?
5. `[CALC]` Your login endpoint allows 5 requests/minute. Using a fixed window, the boundary attack allows effectively how many requests in a 2-second window?

### Distributed Rate Limiting
6. Design a distributed rate limiter for 100 servers that: handles Redis failover, has no single point of failure, and is accurate within 1%.
7. What is the Redlock algorithm? Why did Antirez create it? What is Martin Kleppmann's criticism of it?
8. What is a cell-rate algorithm? How is it used in networking?
9. How do you implement rate limiting at the API gateway layer vs the application layer? What are the trade-offs?
10. You need to rate limit a bulk API endpoint: `POST /products/bulk` that accepts up to 1000 products. Do you count it as 1 request or 1000? Justify.

### POC
11. `[POC]` Implement a Redis Lua script that atomically increments a rate limit counter AND sets its TTL in one round trip. Why must these be atomic?
12. `[POC]` Your rate limiter uses `INCR key` followed by `EXPIRE key 60`. A request comes in when the key doesn't exist. The `INCR` succeeds, then the server crashes before `EXPIRE` runs. What is the consequence? How does the Lua script fix it?

---

## Section 11 — Background Workers & Messaging

### Message Queue Internals
1. What is Apache Kafka? How is it different from RabbitMQ? When do you choose each?
2. What is a Kafka topic, partition, offset, and consumer group? Draw the relationship.
3. What is at-most-once, at-least-once, and exactly-once delivery in Kafka? How does each work?
4. What is the difference between Kafka and a traditional message queue (RabbitMQ) in terms of message retention?
5. What is consumer lag in Kafka? Why is it a critical metric to monitor?
6. What is a compacted topic in Kafka? When would you use one for the product catalog?

### Reliability Patterns
7. What is the Outbox pattern? Walk through the full flow: order created → event published → notification sent. What guarantees does it provide?
8. What is the Transactional Inbox pattern? How is it different from Outbox?
9. What is idempotency at the message consumer level? Implement it for your order confirmation email consumer.
10. What is a poison pill message? How do you handle it without stopping the consumer?
11. What is saga orchestration vs choreography? When is each better? Draw the order creation saga using both approaches.

### ARQ & Celery Deep Dive
12. How does ARQ store jobs in Redis? What data structure does it use?
13. What happens to an ARQ job if the worker process is killed mid-execution (before the job completes)?
14. What is ARQ's health check endpoint? How do you monitor worker health in production?
15. `[POC]` Your order confirmation email fails. ARQ retries 3 times. All fail. The job goes to the dead letter queue. How do you replay it without duplicating the email?

---

## Section 12 — Performance & Query Optimization

### Advanced Indexing
1. What is index selectivity? How does it affect whether PostgreSQL uses an index?
2. What is a covering index? Design one for your most expensive query: `SELECT id, name, price FROM products WHERE category_id = ? AND is_active = true ORDER BY created_at DESC LIMIT 20`.
3. What is a partial index? Write the SQL for a partial index that only indexes active products. What is the size benefit?
4. What is an expression index? Your search uses `LOWER(name) LIKE 'phone%'`. Write the index for this.
5. What is index-only scan in PostgreSQL? When does it occur?
6. What is index bloat? How do you detect it with `pgstattuple`? How do you fix it without downtime?

### Query Optimization
7. What is a lateral join? Give an example.
8. What is a CTE (Common Table Expression)? What is the difference between a materialized and non-materialized CTE in PostgreSQL 12+?
9. What is window functions? Write a query using `ROW_NUMBER()` to get the top 3 most expensive products per category.
10. What is `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`? What does the BUFFERS option tell you that ANALYZE alone doesn't?
11. What is a parallel query in PostgreSQL? What are the conditions for it to kick in?
12. What is a hot standby query conflict in PostgreSQL? Why can queries on read replicas be cancelled?

### Application-Level
13. `[POC][CALC]` Your `GET /products` query runs in 5ms normally. Under load with 500 concurrent requests, it takes 800ms. The query time in PostgreSQL is still 5ms. What is causing the 800ms? Where is the time being spent?
14. `[POC]` You have SQLAlchemy `echo=True` and see this for `GET /cart` with 10 items:
    ```
    SELECT * FROM carts WHERE user_id = 'x'        (1 query)
    SELECT * FROM cart_items WHERE cart_id = 1      (1 query)
    SELECT * FROM products WHERE id = 1             (10 queries)
    ```
    Why 10 separate product queries? Write the fix using `selectinload`.
15. What is N+1 in async SQLAlchemy and why does it behave differently than in synchronous SQLAlchemy?

---

## Section 13 — Testing at Scale

### Testing Strategy
1. What is the testing pyramid? What is the testing trophy (alternative by Kent C. Dodds)? When is each appropriate?
2. What is contract testing? How does Pact work? When do you need it in a microservices architecture?
3. What is mutation testing? What does a mutation testing tool (like mutmut for Python) tell you that coverage doesn't?
4. What is property-based testing? Write a property test for your order total calculation.
5. What is chaos engineering? What is Chaos Monkey? How would you apply it to your shopping app?

### Test Design
6. What is the difference between `mock.patch` and dependency injection for replacing dependencies in tests?
7. What is `pytest-asyncio`? How do you configure it for FastAPI integration tests?
8. What is a test double? Name all 5 types (dummy, stub, spy, mock, fake) and give an example of each.
9. What is the F.I.R.S.T principle for good tests?
10. What is a flaky test? Name 5 root causes and their fixes.

### POC
11. `[POC]` Write the pytest fixture setup for integration testing `POST /orders`. What do you need: DB, auth, product, cart — in what order? Use `pytest.fixture` with correct scope.
12. `[POC]` You want to test that when stock = 0, the order transaction is fully rolled back (no order row, stock unchanged, cart unchanged). Design the test assertions.
13. `[POC]` Your background email task is tested by mocking ARQ's `enqueue`. But the mock doesn't test that the correct arguments are passed. Write the full mock assertion.

---

## Section 14 — Observability

### The Three Pillars
1. What are the three pillars of observability? Define each and give a tool example.
2. What is an SLI (Service Level Indicator)? What is an SLO? What is an SLA? Give concrete examples for your shopping app.
3. What is an error budget? How do you calculate it from an SLO?
4. What is the difference between a metric and a log? When does a metric fail you and a log save you?

### Metrics
5. What are the four golden signals? Define each for your shopping app.
6. What is a histogram metric vs a gauge vs a counter? When do you use each?
7. What is the difference between `p50`, `p95`, `p99`, and `p99.9` latency? Why is p99.9 important for Google?
8. What is Prometheus? What is the pull vs push model for metrics collection?
9. What is cardinality in metrics? Why does high cardinality break Prometheus?

### Distributed Tracing
10. What is a trace? What is a span? What is the parent-child relationship between spans?
11. What is OpenTelemetry? How is it different from OpenTracing and OpenCensus?
12. How do you propagate trace context across services? What is the W3C `traceparent` header?
13. What is tail-based sampling vs head-based sampling in distributed tracing?

### POC
14. `[POC]` An order fails at 3am. You have no distributed tracing. Using only your logs, describe exactly what log entries you need to find: (a) which user, (b) what the cart contained, (c) which step failed, (d) what error occurred.
15. `[POC]` Define 3 SLOs for your shopping app (one for each: latency, availability, error rate). What are the SLIs you'd measure?

---

## Section 15 — DevOps & Deployment

### Zero-Downtime Deployments
1. What is a blue-green deployment? Draw it. What is the rollback procedure?
2. What is a canary deployment? How do you decide what % of traffic goes to the canary?
3. What is a rolling deployment? What is the risk if your new version has a DB migration?
4. What is a feature flag? How does it decouple code deployment from feature release?
5. What is backward-compatible database migration? Give an example of adding a NOT NULL column without downtime.

### Container Orchestration
6. What is Kubernetes? What problem does docker-compose not solve that Kubernetes does?
7. What is a Pod, Deployment, Service, Ingress, and ConfigMap in Kubernetes?
8. What is a liveness probe vs a readiness probe in Kubernetes? What happens when each fails?
9. What is Horizontal Pod Autoscaling (HPA) in Kubernetes? What metrics does it use by default?
10. What is a PersistentVolumeClaim (PVC)? Why can't you use a regular pod volume for your PostgreSQL data?

### CI/CD
11. What is the difference between Continuous Integration, Continuous Delivery, and Continuous Deployment?
12. What is a deployment pipeline? What stages should your shopping app pipeline have?
13. What is a database migration in a CI/CD pipeline? What are the risks of running migrations automatically on deploy?
14. What is a rollback strategy for a failed deployment that included a DB migration?

### POC
15. `[POC]` You add a `NOT NULL` column `shipping_address` to the `orders` table. You have 100M rows. You need to do this without taking the app down. Write the exact 3-step migration strategy.
16. `[POC]` You deploy a new version. 3 minutes in, error rate spikes to 15%. How do you decide whether to rollback or fix-forward? What data do you look at?

---

## Section 16 — POC Deep Dive — Code Audit

> *Ye section mein interviewer tumhara code screen pe daalta hai aur directly puchta hai.*
> *Apna code andar se jaano.*

1. Open `auth_service.py`. Line 44: `if stored_token.expires_at < datetime.utcnow()`. This is a production bug. Find it, explain why it fails in Python, and write the fix.

2. Open `auth_repository.py`. The `create_user` method does `new_user = Users(**user.model_dump())`. What happens if the Pydantic schema has extra fields not in the ORM model? Is this safe? What is the defensive approach?

3. Open `database.py`. `engine = create_async_engine(Settings().DATABASE_URL, echo=False)`. This creates the engine at module import time. If you have 3 workers starting simultaneously, do they share one engine or create three? What does that mean for the connection pool?

4. Open `security.py`. Your `hash_password` pre-hashes with SHA-256 for passwords > 72 bytes. Now consider: attacker has your DB hash for a user whose password is exactly 73 bytes. The attacker knows you pre-hash. What can they do that they couldn't if you used bcrypt alone? Is this a meaningful vulnerability?

5. Open `response.py`. `"status": "True"` is a string. `exceptions.py` returns `"success": false` as a boolean. A TypeScript client does: `if (response.success)`. What happens for success responses? What happens for error responses? Fix both files to be consistent.

6. Open `auth/router.py`. The `logout` and `refresh_token` endpoints take `refresh_token: str` as a query parameter. Tokens in query params appear in: nginx access logs, CloudFront logs, browser history, Referrer header. Change the design — what HTTP mechanism should you use instead?

7. Open `modules/users/router.py`. The `get_current_user_function` route has a type annotation `current_user: AsyncSession = Depends(get_current_user)`. This is wrong — `get_current_user` returns a `Users` object, not an `AsyncSession`. Does Python/FastAPI enforce this at runtime? What are the consequences of wrong type annotations in dependencies?

8. Your `AuthService._issue_tokens` creates a user and stores a refresh token in two separate operations. If the DB commit for the refresh token fails after the user is already created, what is the system state? Is the user stuck? Design a fix using a single transaction.

9. Your codebase has no `__init__.py` in `app/modules/` directory (only in subdirectories). Does Python 3 require `__init__.py`? What is the difference between a package and a namespace package? Does it matter for your imports?

10. You use `jose` library for JWT. This library has had CVEs. Name the specific algorithm confusion vulnerability, how it works, and how your current `decode_token` implementation is or isn't vulnerable.

---

## Section 17 — Behavioral — Googleyness

> *Google rates these equally with technical. "Googleyness" = intellectual humility + ownership + data-driven decisions.*

1. Tell me about a time you made a technical decision that turned out to be wrong. How did you handle it?

2. Tell me about the most complex system you've designed or built. What were the biggest technical challenges?

3. You are 2 days before a release deadline. You discover a security vulnerability in the auth system. What do you do?

4. A junior engineer on your team wrote code that works but is clearly unmaintainable. How do you handle the code review?

5. You disagree with your tech lead's architectural decision. You believe their approach will cause scaling problems in 6 months. What do you do?

6. Tell me about a time you improved system performance significantly. How did you identify the bottleneck? How did you measure the improvement?

7. You are on-call. At 2am, the order creation endpoint starts throwing 500 errors. Describe your exact debugging process step by step.

8. A product manager asks for a feature that will take 2 weeks. You know there is a technical shortcut that will take 2 days but will create significant technical debt. What do you recommend and why?

9. Tell me about a time you had to learn a new technology quickly to solve a problem. What was your approach?

10. How do you decide when a system is "good enough" and when it needs to be redesigned? What metrics do you use?
