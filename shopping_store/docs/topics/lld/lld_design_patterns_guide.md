# LLD + Design Patterns — Complete Interview Guide
> Beginner to FAANG level | With sources | No topic skipped

---

## What is LLD?

HLD = "System mein kaun kaun se boxes hain aur woh kaise connect hain"
LLD = "Ek box ke andar code kaise organize karein"

LLD interview mein tumse poochha jaata hai:
- "Design a Parking Lot system" → Classes, relationships, design patterns
- "Design an Elevator" → State management, OOP
- "Design a Logging Framework" → Extensibility, patterns

LLD ka answer hota hai: **Class diagrams + Core logic explanation**

---

## Learning Path

```
Step 1: OOP Concepts (agar shaky hain toh)
Step 2: SOLID Principles (LLD ki backbone)
Step 3: Design Patterns (23 patterns, teen categories)
Step 4: LLD Problems (practice)
```

---

## Part 1 — OOP Concepts (Quick Revision)

### 4 Pillars

**Encapsulation** — Data aur uski methods ko ek saath band karo, bahar direct access nahi
```
Bad:  user.password = "123"
Good: user.setPassword("123")  # validation andar hoti hai
```

**Abstraction** — "Kya karta hai" dikhao, "Kaise karta hai" chhupaao
```
Car chalate ho — engine internals nahi jaante, sirf accelerate() jaante ho
```

**Inheritance** — Parent ki properties child le leta hai
```
Animal → Dog, Cat (Dog aur Cat dono breathe() inherit karte hain)
```

**Polymorphism** — Same method, alag behavior
```
animal.sound() → Dog = "Woof", Cat = "Meow"
```

---

## Part 2 — SOLID Principles (Most Important for LLD)

Yeh 5 principles hi LLD interviews ka 70% cover karte hain.

### S — Single Responsibility Principle
**"Ek class ka sirf ek reason hona chahiye change hone ka"**

```
Bad:
class User:
    def save_to_db(self): ...      # DB concern
    def send_email(self): ...      # Email concern
    def generate_report(self): ... # Report concern

Good:
class User: ...
class UserRepository:
    def save(self, user): ...
class EmailService:
    def send_welcome(self, user): ...
```

**Interview mein:** "Yeh class itna kaam nahi karni chahiye — SRP violate ho raha hai"

---

### O — Open/Closed Principle
**"Class extension ke liye open honi chahiye, modification ke liye closed"**

```
Bad: Naya payment method aaya toh existing code modify karo
if payment_type == "credit":
    process_credit()
elif payment_type == "upi":
    process_upi()
# Har naye method pe yeh file modify karni padegi

Good:
class PaymentProcessor:  # abstract
    def process(self): ...

class CreditCardProcessor(PaymentProcessor):
    def process(self): ...

class UPIProcessor(PaymentProcessor):
    def process(self): ...

# Naya method aaya → sirf naya class banao, existing code touch nahi
```

---

### L — Liskov Substitution Principle
**"Child class ko parent ki jagah use karo — system toot nahi chahiye"**

```
Bad:
class Bird:
    def fly(self): ...

class Penguin(Bird):
    def fly(self):
        raise Exception("Penguins can't fly!")  # LSP violation!

Good:
class Bird: ...
class FlyingBird(Bird):
    def fly(self): ...
class Penguin(Bird): ...  # fly method hi nahi
```

---

### I — Interface Segregation Principle
**"Moti interface mat banao — choti-choti specific interfaces banao"**

```
Bad:
class Animal:
    def fly(self): ...
    def swim(self): ...
    def run(self): ...
# Dog ko fly() implement karna padega even though woh fly nahi karta

Good:
class Flyable:
    def fly(self): ...
class Swimmable:
    def swim(self): ...
class Runnable:
    def run(self): ...

class Dog(Runnable, Swimmable): ...  # sirf jo chahiye
class Eagle(Flyable, Runnable): ...
```

---

### D — Dependency Inversion Principle
**"High-level modules low-level pe directly depend nahi honein — abstraction pe depend karein"**

```
Bad:
class OrderService:
    def __init__(self):
        self.db = MySQLDatabase()  # directly depend on MySQL

Good:
class OrderService:
    def __init__(self, db: Database):  # depend on abstraction
        self.db = db

# Kal MongoDB use karna ho → sirf MongoDatabase class banao, OrderService change nahi
```

---

## Part 3 — Design Patterns

23 classic patterns hain (Gang of Four book). Teen categories:

```
Creational  → Object kaise banayein
Structural  → Objects ko kaise combine karein
Behavioral  → Objects kaise communicate karein
```

---

## Category 1: Creational Patterns

### Pattern 1 — Singleton
**"Puri application mein sirf ek hi instance hona chahiye"**

**Use cases:** Database connection pool, Logger, Config manager, Thread pool

```
Problem: Agar har jagah new DatabaseConnection() karo toh 100 connections ban jayenge!

Solution:
class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Koi bhi call karo — same instance milegi
db1 = DatabaseConnection()
db2 = DatabaseConnection()
db1 is db2  # True
```

**Interview angle:** Thread safety — multi-threaded environment mein double-checked locking chahiye

**Pitfalls:**
- Testing mushkil hota hai (global state)
- Tight coupling
- Overuse karo toh anti-pattern ban jaata hai

---

### Pattern 2 — Factory Method
**"Object creation logic ko subclasses pe chhod do"**

**Use cases:** Jab exact type runtime pe pata chale, plugin systems

```
Problem:
if vehicle_type == "car":
    return Car()
elif vehicle_type == "bike":
    return Bike()
# Naya vehicle aaya → yeh method modify karna padega (OCP violate)

Solution:
class VehicleFactory:  # abstract
    def create_vehicle(self): ...  # subclass implement karegi

class CarFactory(VehicleFactory):
    def create_vehicle(self):
        return Car()

class BikeFactory(VehicleFactory):
    def create_vehicle(self):
        return Bike()
```

---

### Pattern 3 — Abstract Factory
**"Related objects ka family ek saath banao"**

**Use cases:** UI themes (dark/light), cross-platform UI (Windows/Mac/Linux)

```
Problem: Dark theme mein Button, Checkbox, Dialog sab dark hone chahiye
         Light theme mein sab light hone chahiye

Solution:
class UIFactory:  # abstract
    def create_button(self): ...
    def create_checkbox(self): ...

class DarkThemeFactory(UIFactory):
    def create_button(self):
        return DarkButton()
    def create_checkbox(self):
        return DarkCheckbox()

class LightThemeFactory(UIFactory):
    def create_button(self):
        return LightButton()

# Client sirf factory se maange — theme consistent rahegi
```

**Factory vs Abstract Factory:**
- Factory: Ek type ka object banata hai
- Abstract Factory: Related objects ka poora set banata hai

---

### Pattern 4 — Builder
**"Complex object step-by-step banao"**

**Use cases:** Query builder, HTTP request builder, Pizza order, Report generation

```
Problem:
Pizza(size, crust, cheese, toppings, sauce, extra_cheese, thin_crust, ...)
# Constructor mein bahut parameters — confusing!

Solution:
pizza = (PizzaBuilder()
    .size("large")
    .crust("thin")
    .add_topping("mushroom")
    .add_topping("olives")
    .extra_cheese(True)
    .build())
```

**Real world:** Python's SQLAlchemy query builder, requests library

---

### Pattern 5 — Prototype
**"Existing object ko copy karke naya banao"**

**Use cases:** Jab object creation costly ho (DB se load karna), game enemies clone karna

```
class Enemy:
    def clone(self):
        return copy.deepcopy(self)

base_enemy = Enemy()
base_enemy.health = 100
base_enemy.speed = 10

# Naya enemy banane ke liye DB se load nahi — sirf clone karo
enemy2 = base_enemy.clone()
enemy2.health = 150  # base_enemy unchanged
```

---

## Category 2: Structural Patterns

### Pattern 6 — Adapter
**"Incompatible interfaces ko compatible banao"**

**Use cases:** Third-party library integration, legacy code wrap karna

```
Problem:
OldPaymentGateway mein: old_gateway.make_payment(amount, currency, account)
Tumhara code expect karta hai: gateway.pay(payment_request)

Solution:
class PaymentAdapter:
    def __init__(self, old_gateway):
        self.old_gateway = old_gateway

    def pay(self, payment_request):  # new interface
        # old interface pe convert karo
        self.old_gateway.make_payment(
            payment_request.amount,
            payment_request.currency,
            payment_request.account
        )
```

**Real world:** Python's io.TextIOWrapper (bytes → text adapter)

---

### Pattern 7 — Decorator
**"Object ko runtime pe extra functionality add karo, without inheritance"**

**Use cases:** Logging, authentication middleware, caching, compression

```
Problem: Coffee mein milk, sugar, whip cream add karne ke liye
         har combination ke liye alag class banana padega!
         (CoffeeWithMilk, CoffeeWithSugar, CoffeeWithMilkAndSugar...)

Solution:
class Coffee:
    def cost(self): return 10
    def description(self): return "Coffee"

class MilkDecorator:
    def __init__(self, coffee):
        self.coffee = coffee
    def cost(self): return self.coffee.cost() + 2
    def description(self): return self.coffee.description() + " + Milk"

class SugarDecorator:
    def __init__(self, coffee):
        self.coffee = coffee
    def cost(self): return self.coffee.cost() + 1

coffee = SugarDecorator(MilkDecorator(Coffee()))
coffee.cost()         # 13
coffee.description()  # "Coffee + Milk"
```

**Real world:** Python's @functools.wraps, Django middleware

---

### Pattern 8 — Facade
**"Complex subsystem ke upar simple interface banao"**

**Use cases:** Library wrapper, simplified API

```
Problem:
# Home theater chalane ke liye:
tv.turn_on()
amplifier.set_volume(10)
dvd_player.turn_on()
dvd_player.load(movie)
projector.turn_on()
projector.set_input("HDMI")
lights.dim(30)

Solution:
class HomeTheaterFacade:
    def watch_movie(self, movie):
        tv.turn_on()
        amplifier.set_volume(10)
        dvd_player.turn_on()
        dvd_player.load(movie)
        # ... sab andar
```

**Real world:** Django ORM (SQL complexity hide karta hai), boto3 AWS SDK

---

### Pattern 9 — Proxy
**"Real object ke saamne ek representative rakho"**

**Types:**
- **Virtual Proxy** — Lazy loading (image tab load karo jab chahiye)
- **Protection Proxy** — Access control
- **Remote Proxy** — Remote object represent karo
- **Caching Proxy** — Results cache karo

```
class ExpensiveService:
    def get_data(self):
        # DB se 2 second mein data laata hai
        return database.query(...)

class CachingProxy:
    def __init__(self):
        self.service = ExpensiveService()
        self.cache = {}

    def get_data(self):
        if "data" not in self.cache:
            self.cache["data"] = self.service.get_data()
        return self.cache["data"]
```

---

### Pattern 10 — Composite
**"Individual objects aur groups ko same tarah treat karo"**

**Use cases:** File system (file aur folder dono), UI components, org chart

```
class FileSystemItem:  # abstract
    def get_size(self): ...

class File(FileSystemItem):
    def get_size(self): return self.size

class Folder(FileSystemItem):
    def __init__(self):
        self.children = []
    def add(self, item): self.children.append(item)
    def get_size(self):
        return sum(child.get_size() for child in self.children)

# File aur Folder dono same interface — client ko fark nahi
root = Folder()
root.add(File(100))
root.add(File(200))
subfolder = Folder()
subfolder.add(File(50))
root.add(subfolder)
root.get_size()  # 350
```

---

### Pattern 11 — Bridge
**"Abstraction aur implementation ko alag rakho taaki dono independently evolve kar sakein"**

**Use cases:** Cross-platform code, multiple DB support

```
Problem: WindowsButton, MacButton, LinuxButton
         WindowsDarkButton, MacDarkButton...
         Combinations explode!

Solution: Shape aur Color alag rakho
class Shape:
    def __init__(self, color):
        self.color = color  # Color ka reference (bridge)
    def draw(self): ...

class Circle(Shape): ...
class Square(Shape): ...

class Color:
    def fill(self): ...

class Red(Color): ...
class Blue(Color): ...

# Circle + Red → separately composable
```

---

### Pattern 12 — Flyweight
**"Bahut saare similar objects mein shared state share karo — memory bachao"**

**Use cases:** Game mein lakhs of trees/enemies, text editor mein characters

```
Problem: 1 lakh trees render karo → 1 lakh objects → too much memory

Solution:
class TreeType:  # shared (intrinsic state)
    def __init__(self, name, color, texture):
        self.name = name
        self.color = color
        self.texture = texture

class Tree:  # per-instance (extrinsic state)
    def __init__(self, x, y, tree_type):
        self.x = x
        self.y = y
        self.tree_type = tree_type  # shared reference

# 1 lakh trees but sirf 5 TreeType objects (oak, pine, etc.)
```

---

## Category 3: Behavioral Patterns

### Pattern 13 — Observer
**"Ek object ka state change ho toh saare dependents ko automatically notify karo"**

**Use cases:** Event systems, notifications, UI updates, pub-sub

```
class EventEmitter:
    def __init__(self):
        self._listeners = {}

    def on(self, event, callback):
        self._listeners.setdefault(event, []).append(callback)

    def emit(self, event, data=None):
        for callback in self._listeners.get(event, []):
            callback(data)

stock = EventEmitter()
stock.on("price_change", lambda price: print(f"New price: {price}"))
stock.on("price_change", lambda price: send_alert(price))
stock.emit("price_change", 150)
```

**Real world:** JavaScript's addEventListener, Python's signal library, Redux

---

### Pattern 14 — Strategy
**"Algorithm ko interchangeable banao — runtime pe switch kar sako"**

**Use cases:** Sorting strategies, payment methods, compression algorithms, routing

```
Problem:
def sort(data, algorithm):
    if algorithm == "bubble": ...
    elif algorithm == "merge": ...
    # Naya algorithm aaya → yeh function modify karo (OCP violate)

Solution:
class SortStrategy:
    def sort(self, data): ...

class BubbleSort(SortStrategy):
    def sort(self, data): ...

class MergeSort(SortStrategy):
    def sort(self, data): ...

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self.strategy = strategy

    def sort(self, data):
        return self.strategy.sort(data)

sorter = Sorter(MergeSort())
sorter.sort(data)
# Runtime pe change:
sorter.strategy = BubbleSort()
```

---

### Pattern 15 — Command
**"Request ko object mein encapsulate karo"**

**Use cases:** Undo/Redo, task queues, logging operations, remote control

```
class Command:
    def execute(self): ...
    def undo(self): ...

class DeleteTextCommand(Command):
    def __init__(self, editor, text):
        self.editor = editor
        self.text = text
        self.backup = None

    def execute(self):
        self.backup = self.editor.selected_text
        self.editor.delete(self.text)

    def undo(self):
        self.editor.insert(self.backup)

class CommandHistory:
    def __init__(self):
        self.history = []

    def execute(self, command):
        command.execute()
        self.history.append(command)

    def undo(self):
        if self.history:
            self.history.pop().undo()
```

---

### Pattern 16 — Template Method
**"Algorithm ka skeleton define karo, specific steps subclass implement kare"**

**Use cases:** Data processing pipelines, report generation, game loops

```
class DataExporter:  # abstract
    def export(self, data):  # template method
        raw = self.fetch_data(data)
        processed = self.process(raw)
        formatted = self.format(processed)
        self.save(formatted)

    def fetch_data(self, data): return data
    def process(self, data): return data
    def format(self, data): ...  # subclass implement kare
    def save(self, data): ...    # subclass implement kare

class CSVExporter(DataExporter):
    def format(self, data): return to_csv(data)
    def save(self, data): write_file("output.csv", data)

class JSONExporter(DataExporter):
    def format(self, data): return to_json(data)
    def save(self, data): write_file("output.json", data)
```

---

### Pattern 17 — State
**"Object ka behavior uske state ke hisaab se change ho"**

**Use cases:** Order status, traffic light, vending machine, elevator

```
class Order:
    def __init__(self):
        self.state = PendingState()

    def pay(self): self.state.pay(self)
    def ship(self): self.state.ship(self)
    def deliver(self): self.state.deliver(self)

class PendingState:
    def pay(self, order):
        print("Payment received")
        order.state = PaidState()
    def ship(self, order):
        print("Can't ship — payment pending!")

class PaidState:
    def pay(self, order):
        print("Already paid!")
    def ship(self, order):
        print("Shipped!")
        order.state = ShippedState()

order = Order()
order.ship()   # "Can't ship — payment pending!"
order.pay()    # "Payment received"
order.ship()   # "Shipped!"
```

---

### Pattern 18 — Chain of Responsibility
**"Request ko handlers ki chain mein pass karo jab tak process na ho jaye"**

**Use cases:** Middleware, logging levels, auth checks, support escalation

```
class Handler:
    def __init__(self, next_handler=None):
        self.next = next_handler

    def handle(self, request):
        if self.next:
            return self.next.handle(request)
        return None

class AuthHandler(Handler):
    def handle(self, request):
        if not request.is_authenticated:
            return "401 Unauthorized"
        return super().handle(request)

class RateLimitHandler(Handler):
    def handle(self, request):
        if self.rate_exceeded(request):
            return "429 Too Many Requests"
        return super().handle(request)

class BusinessLogicHandler(Handler):
    def handle(self, request):
        return process(request)

# Chain banao:
chain = AuthHandler(RateLimitHandler(BusinessLogicHandler()))
chain.handle(request)
```

---

### Pattern 19 — Iterator
**"Collection ke elements ko traverse karo, internal structure expose kiye bina"**

**Use cases:** Custom collections, lazy evaluation, infinite sequences

```
class NumberRange:
    def __init__(self, start, end):
        self.start = start
        self.end = end

    def __iter__(self):
        return NumberIterator(self.start, self.end)

class NumberIterator:
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __next__(self):
        if self.current > self.end:
            raise StopIteration
        value = self.current
        self.current += 1
        return value

for num in NumberRange(1, 5):
    print(num)  # 1, 2, 3, 4, 5
```

**Real world:** Python generators, Java Iterator

---

### Pattern 20 — Mediator
**"Objects directly communicate nahi karein — mediator ke through karein"**

**Use cases:** Chat rooms, air traffic control, UI forms

```
Problem: 10 UI components direct ek dusre se communicate karein → spaghetti!

Solution:
class FormMediator:
    def __init__(self):
        self.components = {}

    def register(self, name, component):
        self.components[name] = component

    def notify(self, sender, event):
        if event == "country_changed":
            # Country change hone pe city dropdown update karo
            self.components["city"].update_options(sender.value)

country_dropdown.mediator = form_mediator
city_dropdown.mediator = form_mediator
```

---

### Pattern 21 — Memento
**"Object ka state save karo taaki baad mein restore kar sako (Undo)"**

```
class EditorMemento:
    def __init__(self, content):
        self._content = content

    def get_content(self):
        return self._content

class Editor:
    def __init__(self):
        self.content = ""

    def write(self, text):
        self.content += text

    def save(self):
        return EditorMemento(self.content)

    def restore(self, memento):
        self.content = memento.get_content()

editor = Editor()
editor.write("Hello ")
saved = editor.save()
editor.write("World")
editor.restore(saved)
print(editor.content)  # "Hello "
```

---

### Pattern 22 — Visitor
**"Naya operation add karo without classes modify kiye"**

**Use cases:** Compilers (AST traversal), export in different formats, tax calculation

```
class TaxVisitor:
    def visit_food(self, food): return food.price * 0.05
    def visit_electronics(self, item): return item.price * 0.18

class Food:
    def accept(self, visitor):
        return visitor.visit_food(self)

class Electronics:
    def accept(self, visitor):
        return visitor.visit_electronics(self)

tax_calculator = TaxVisitor()
food = Food()
food.accept(tax_calculator)  # 5% tax
```

---

### Pattern 23 — Interpreter
**"Language ya grammar ke liye interpreter banao"**

**Use cases:** SQL parsers, regex, expression evaluators, command parsers

```
# Mathematical expression: (2 + 3) * 4
class Number:
    def __init__(self, val): self.val = val
    def interpret(self): return self.val

class Add:
    def __init__(self, left, right):
        self.left = left
        self.right = right
    def interpret(self):
        return self.left.interpret() + self.right.interpret()

expr = Add(Number(2), Number(3))
expr.interpret()  # 5
```

---

## Part 4 — LLD Interview Problems

### Problem 1 — Parking Lot (Beginner LLD)

**Design a Parking Lot system**

**Classes:**

```
ParkingLot
├── ParkingFloor[] floors
├── park(vehicle) → Ticket
└── unpark(ticket) → Fee

ParkingFloor
├── ParkingSpot[] spots
├── find_available_spot(vehicle_type)
└── is_full()

ParkingSpot
├── spot_id
├── spot_type (SMALL/MEDIUM/LARGE)
├── is_occupied
└── vehicle (current vehicle)

Vehicle (abstract)
├── Car(Vehicle)
├── Bike(Vehicle)
└── Truck(Vehicle)

Ticket
├── ticket_id
├── vehicle
├── spot
├── entry_time

FeeCalculator (Strategy Pattern)
├── HourlyFee(FeeCalculator)
└── FlatFee(FeeCalculator)
```

**Design Patterns Used:**
- **Strategy** — FeeCalculator (alag-alag fee structures)
- **Factory** — VehicleFactory (vehicle type se object banao)
- **Singleton** — ParkingLot (ek hi instance)

---

### Problem 2 — Elevator System (Medium LLD)

**Design an Elevator system for a building**

**Key Classes:**

```
ElevatorController (Singleton)
├── Elevator[] elevators
├── request(floor, direction)
└── dispatch(request)

Elevator
├── current_floor
├── state: ElevatorState
├── move_up()
├── move_down()
└── open_door()

ElevatorState (State Pattern)
├── IdleState
├── MovingUpState
├── MovingDownState
└── DoorOpenState

Request
├── source_floor
├── destination_floor
└── direction

DispatchAlgorithm (Strategy Pattern)
├── NearestElevatorAlgorithm
└── FCFSAlgorithm
```

**Design Patterns Used:**
- **State** — Elevator states
- **Strategy** — Dispatch algorithm
- **Singleton** — ElevatorController
- **Observer** — Floor panels elevator status dekhein

---

### Problem 3 — Library Management System (Medium LLD)

```
Library (Facade)
├── search_books(query)
├── checkout(member, book)
└── return_book(member, book)

Book
├── isbn, title, author
├── copies_total
└── copies_available

Member
├── member_id
├── active_loans: Loan[]
└── can_checkout()

Loan
├── book
├── member
├── checkout_date
└── due_date

SearchStrategy (Strategy Pattern)
├── TitleSearch
├── AuthorSearch
└── ISBNSearch

NotificationService (Observer Pattern)
├── notify_due_soon(member)
└── notify_book_available(member, book)
```

---

### Problem 4 — Ride Sharing (Uber LLD — Hard)

```
RideService (Facade)
├── request_ride(rider, pickup, dropoff)
├── accept_ride(driver, ride)
└── complete_ride(ride)

Ride
├── rider, driver
├── pickup, dropoff
├── state: RideState (State Pattern)
│   ├── RequestedState
│   ├── AcceptedState
│   ├── InProgressState
│   └── CompletedState

Driver
├── location
├── is_available
└── rating

Rider
├── payment_method
└── rating

PricingStrategy (Strategy Pattern)
├── StandardPricing
├── SurgePricing
└── FlatRatePricing

MatchingAlgorithm (Strategy Pattern)
├── NearestDriverMatch
└── HighestRatedMatch
```

---

### Problem 5 — Food Ordering System (Swiggy/Zomato LLD — Hard)

```
Order
├── items: OrderItem[]
├── restaurant
├── delivery_partner
├── state: OrderState (State Pattern)
│   ├── PlacedState
│   ├── AcceptedState
│   ├── PreparingState
│   ├── PickedUpState
│   └── DeliveredState

OrderBuilder (Builder Pattern)
├── add_item(menu_item, quantity)
├── set_address(address)
└── build()

Restaurant
├── menu: MenuItem[]
├── accept_order(order)
└── mark_ready(order)

PaymentProcessor (Strategy Pattern)
├── UPIPayment
├── CardPayment
└── WalletPayment

NotificationService (Observer Pattern)
├── notify_rider(event)
├── notify_restaurant(event)
└── notify_delivery_partner(event)

MenuItemFactory (Factory Pattern)
```

---

## Part 5 — HLD vs LLD Summary

| Aspect | HLD | LLD |
|---|---|---|
| Focus | Components & interaction | Classes & methods |
| Output | Architecture diagram | Class diagram + pseudocode |
| Question style | "Design WhatsApp" | "Design Parking Lot" |
| Key concepts | Scalability, DB choice, caching | OOP, SOLID, Design Patterns |
| Time in interview | 45-60 min | 45-60 min |
| Typical companies | All FAANG rounds | Google, Amazon, Microsoft |

---

## Part 6 — Sources (Best Resources)

### Design Patterns
| Resource | Type | Why |
|---|---|---|
| [refactoring.guru/design-patterns](https://refactoring.guru/design-patterns) | Website | Best visual explanations, real-world examples |
| "Design Patterns" — Gang of Four | Book | Original, must-read for deep understanding |
| "Head First Design Patterns" | Book | Beginner-friendly, visual |

### LLD
| Resource | Type | Why |
|---|---|---|
| [github.com/prasadgujar/low-level-design-primer](https://github.com/prasadgujar/low-level-design-primer) | GitHub | Problems with solutions |
| [github.com/ashishps1/awesome-low-level-design](https://github.com/ashishps1/awesome-low-level-design) | GitHub | Curated LLD problems |
| Neetcode (YouTube) | Video | OOP + LLD problems |

### HLD
| Resource | Type | Why |
|---|---|---|
| [github.com/donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | GitHub | Most comprehensive free resource |
| ByteByteGo (YouTube + book) | Video/Book | Best visual explanations |
| "Designing Data-Intensive Applications" — Martin Kleppmann | Book | Deep understanding of distributed systems |
| Grokking System Design (Educative) | Course | Interview-focused, structured |

### SOLID Principles
| Resource | Type | Why |
|---|---|---|
| [solidprinciples.io](https://www.solidprinciples.io) | Website | Quick visual reference |
| "Clean Code" — Robert Martin | Book | Broader software design principles |

---

## Part 7 — Study Plan

### Week 1-2: Foundation
- OOP 4 pillars revise karo
- SOLID principles — ek per day, example banao
- Source: refactoring.guru SOLID section

### Week 3-4: Creational + Structural Patterns
- Singleton, Factory, Builder (week 3)
- Adapter, Decorator, Facade (week 4)
- Har pattern ke liye ek real example socho

### Week 5-6: Behavioral Patterns
- Observer, Strategy, Command, State (week 5)
- Template Method, Chain of Responsibility (week 6)

### Week 7-8: LLD Problems
- Parking Lot (week 7)
- Elevator + Library (week 7-8)
- Ride Sharing / Food Ordering (week 8)

### Week 9+: HLD (system_design_guide.md wali file)
- Building blocks
- Problems easy → hard

---

*Tip: Har pattern ke baad socho — "Meri current project mein yeh pattern kahan use ho sakta tha?"*
*Real-world connection se pattern kabhi nahi bhoolte.*
