# Phase 1 — OOPs Notes

---

## 1.1 Classes & Objects

### Prerequisites
- Python basics (functions, variables, syntax)

### Concept

**Class** = Blueprint (definition)
**Object** = Actual instance (memory mein alag jagah)

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

laptop = Product("Laptop", 50000)   # object 1
phone = Product("Phone", 20000)     # object 2
```

Har object ki **apni memory** hoti hai:
```
laptop ──▶ [Product object @ 0x1000]
phone  ──▶ [Product object @ 0x2000]
```

---

### `self` Kya Hai?

`self` is a reference to the current instance of the class. When a method is called on an object, Python automatically passes that object as the first argument — that argument is `self`.

```python
# Jab laptop bana → self = laptop object
# Jab phone bana  → self = phone object

laptop = Product("Laptop", 50000)
# Python internally yeh karta hai:
# Product.__init__(laptop, "Laptop", 50000)
```

`id(self)` aur `id(object)` hamesha same hoga — verify kiya.

---

### Class Variable vs Instance Variable

```python
class Product:
    category = "Electronics"   # class variable — saare objects mein same

    def __init__(self, name, price):
        self.name = name       # instance variable — har object ka apna
        self.price = price
```

| | Class Variable | Instance Variable |
|---|---|---|
| Kahan define hota hai | Class level pe | `__init__` mein `self` ke saath |
| Saare objects mein | Same hota hai | Alag alag hota hai |
| Change karne pe | Saare objects affect | Sirf woh object affect |

---

### Variable Shadowing

```python
Product.category = "Gadgets"     # class variable change

laptop.category = "Computers"    # laptop ka apna instance variable ban gaya

print(laptop.category)   # "Computers" — instance variable (shadow)
print(phone.category)    # "Gadgets"   — class variable
print(Product.category)  # "Gadgets"   — class variable unchanged
```

Instance variable class variable ko **shadow** kar deta hai — class variable change nahi hota.

---

### Advantages
- Code reuse — ek blueprint se kaafi objects
- Real world entities model kar sakte hain
- Data aur behavior ek jagah encapsulate

### Disadvantages
- Overhead — har object ki apni memory
- Galat use karne pe class variable vs instance variable confusing

### Real World Use Case
- Tumhari shopping store mein `Product`, `User`, `Order` — sabhi classes hain
- Har DB row ek object hai

### Anti-patterns
- Class variable mutable object rakho — jaise `list` ya `dict` — sabhi objects share karenge same list
```python
# WRONG
class Product:
    tags = []   # saare products same list share karenge!

# CORRECT
class Product:
    def __init__(self):
        self.tags = []   # har product ki apni list
```

### Interview Questions
1. Class variable aur instance variable mein kya fark hai?
2. `self` kya hai aur kyun zaroori hai?
3. Variable shadowing kya hota hai?
4. Mutable class variable ka kya problem hai?

---

## 1.2 Inheritance

### Prerequisites
- Classes & Objects, `super()`

### Concept

Child class parent class ki properties aur methods inherit karti hai.

```python
class Vehicle:
    def __init__(self, speed, fuel):
        self.speed = speed
        self.fuel = fuel

    def move(self):
        print(f"Moving at {self.speed} km/h")

class Car(Vehicle):
    def __init__(self, speed, fuel, doors):
        super().__init__(speed, fuel)   # parent ka __init__ call karo
        self.doors = doors
```

`super()` — parent class ke `__init__` ko call karta hai taaki parent ke attributes set ho jayein.

---

### Method Overriding

Child class parent ka method apne hisaab se override kar sakti hai:

```python
class Vehicle:
    def move(self):
        print("Vehicle moving")

class Car(Vehicle):
    def move(self):
        print("Car moving on road")  # override
```

Agar child mein method nahi hai — Python parent mein dhundhta hai.

---

### MRO — Method Resolution Order

Python method dhundhne ka order:
```
Child → Parent1 → Parent2 → object
```

```python
print(ClassName.__mro__)  # MRO dekho
```

---

### Multiple Inheritance & Diamond Problem

```
    A
   / \
  B   C
   \ /
    D
```

```python
class D(B, C):
    pass

print(D.__mro__)
# D → B → C → A → object
```

Python **C3 Linearization algorithm** use karta hai — left se right, duplicates avoid karta hai. Isliye Diamond Problem automatically solve hota hai.

---

### Advantages
- Code reuse — parent ka code dobara likhna nahi padta
- Hierarchy model kar sakte hain

### Disadvantages
- Deep inheritance chains confusing ho jaati hain
- Tight coupling — parent change hua toh child affect hoga

### Real World Use Case
- Tumhari shopping store mein `Base`, `TimestampMixin` — yeh inheritance hai
- FastAPI ka `BaseHTTPMiddleware` — tumhara middleware inherit karta hai

### Anti-patterns
- Deep inheritance (3+ levels) — Composition prefer karo
- Multiple inheritance zyada use karna — MRO confusing ho jaata hai

### Interview Questions
1. `super()` kya karta hai?
2. MRO kya hai aur kaise kaam karta hai?
3. Diamond Problem kya hai aur Python mein kaise solve hota hai?
4. Multiple inheritance ke kya risks hain?

---

## 1.3 Encapsulation

### Prerequisites
- Classes & Objects, `self`

### Concept

Data hide karo, controlled access do. ATM ki tarah — internal circuit hidden, sirf buttons accessible.

---

### 3 Levels of Access

```python
class BankAccount:
    def __init__(self):
        self.name = "Aditya"       # public    — koi bhi access kar sakta hai
        self._balance = 10000      # protected — convention: mat chhedho
        self.__pin = 1234          # private   — name mangling hota hai
```

| Level | Syntax | Access |
|---|---|---|
| Public | `self.name` | Koi bhi ✅ |
| Protected | `self._balance` | Access hota hai, but convention hai mat chhedho ⚠️ |
| Private | `self.__pin` | Direct access nahi — `AttributeError` ❌ |

---

### Name Mangling

Python mein true private nahi hota — `__pin` internally `_BankAccount__pin` ban jaata hai:

```python
acc.__pin              # AttributeError
acc._BankAccount__pin  # 1234 — access ho sakta hai
```

---

### Getter & Setter — Proper Encapsulation

```python
class BankAccount:
    def __init__(self, balance):
        self.__balance = balance

    def get_balance(self):
        return self.__balance

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount

    def withdraw(self, amount):
        if amount > self.__balance:
            print("Insufficient funds")
        else:
            self.__balance -= amount
```

Direct access mein koi validation nahi — getter/setter mein validation hoti hai.

---

### Advantages
- Data integrity — validation ke bina koi change nahi kar sakta
- Internal implementation change kar sakte ho bina bahar ka code todte

### Disadvantages
- Python mein true private nahi — name mangling bypass ho sakta hai
- Boilerplate code badhta hai getter/setter se

### Real World Use Case
- Tumhari shopping store mein Pydantic `response_model` — password field automatically exclude hota hai
- `__balance` jaisi sensitive fields — direct set nahi kar sakte

### Anti-patterns
- Har field ke liye getter/setter banana — `@property` better hai (Phase 2 mein aayega)
- `_protected` fields ko freely access karna — convention tod rahe ho

### Interview Questions
1. Python mein `_` aur `__` ka kya fark hai?
2. Name mangling kya hai?
3. True private Python mein hota hai kya?
4. Encapsulation ka real benefit kya hai?

---

## 1.4 Polymorphism

### Prerequisites
- Inheritance, Method Overriding

### Concept

**Poly = Many, Morph = Forms** — ek hi method alag alag objects pe alag alag kaam kare.

```python
class Car(Vehicle):
    def move(self):
        print("Car moving on road")

class Boat(Vehicle):
    def move(self):
        print("Boat moving on water")

vehicles = [Car(), Boat()]
for v in vehicles:
    v.move()   # same call, alag behavior
```

---

### Method Overriding vs Method Overloading

**Method Overriding** — child class parent ka method redefine kare:
```python
class Vehicle:
    def move(self): print("Vehicle moving")

class Car(Vehicle):
    def move(self): print("Car moving on road")  # override
```

**Method Overloading** — same method name, alag parameters. Python mein directly support nahi — `*args` use karte hain:
```python
# Python way
def add(*args):
    return sum(args)

add(1, 2)      # 3
add(1, 2, 3)   # 6
```

---

### Duck Typing

> *"If it walks like a duck and quacks like a duck — it's a duck"*

Python **type nahi check karta, behavior check karta hai.** Common parent hona zaroori nahi:

```python
class Car:
    def move(self): print("Car moving")

class Aeroplane:
    def move(self): print("Aeroplane flying")

# Koi common parent nahi — phir bhi kaam karta hai
for v in [Car(), Aeroplane()]:
    v.move()
```

---

### Real World Use Case — Shopping Store

`success()` utility function Duck Typing use karta hai:

```python
def success(data, message):
    return {"data": data, "message": message}

# data kuch bhi ho sakta hai — dict, list, str, None
success(data=product_list, message="fetched")
success(data=None, message="deleted")
```

---

### Advantages
- Flexible aur reusable code
- Common parent ki zaroorat nahi (Duck Typing)
- New types add karne pe existing code change nahi karna padta

### Disadvantages
- Duck Typing mein runtime pe pata chalta hai agar method missing ho
- Type hints na ho toh code samajhna mushkil

### Anti-patterns
- Duck Typing pe blindly rely karna bina type hints ke — production mein bugs aate hain

### Interview Questions
1. Polymorphism kya hai?
2. Duck Typing kya hai aur Java se kaise alag hai?
3. Method Overriding aur Method Overloading mein kya fark hai?
4. Python mein Method Overloading kaise implement karte hain?

---

## 1.5 Abstraction

### Prerequisites
- Inheritance, Polymorphism

### Concept

**"Kya karta hai" dikhao, "kaise karta hai" chhupao.**

Car chalate waqt steering/accelerator use karte ho — engine internals hidden hain. Yahi Abstraction.

Python mein `ABC` (Abstract Base Class) se implement hoti hai:

```python
from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

    @abstractmethod
    def refund(self, amount):
        pass
```

---

### Key Rules

1. Abstract class ka directly object nahi ban sakta — `TypeError`
2. Child class ko **saare** abstract methods implement karne padenge — warna object nahi banega
3. Ek bhi abstract method miss kiya → `TypeError: Can't instantiate abstract class`

```python
class UPIPayment(Payment):
    def pay(self, amount):
        print(f"UPI se {amount} pay kiya")

    def refund(self, amount):
        print(f"UPI se {amount} refund kiya")

u = UPIPayment()  # ✅ works
p = Payment()     # ❌ TypeError
```

---

### Python mein Interface

Python mein alag `interface` keyword nahi — **Pure ABC** use karte hain (sirf abstract methods):

```python
class Printable(ABC):
    @abstractmethod
    def print_data(self):
        pass

class Serializable(ABC):
    @abstractmethod
    def serialize(self):
        pass

# Multiple interfaces implement karna
class Product(Printable, Serializable):
    def print_data(self):
        print("Product data")

    def serialize(self):
        return {"name": "Laptop"}
```

---

### Java vs Python

| | Java | Python |
|---|---|---|
| Abstract class | `abstract class` keyword | `ABC` inherit karo |
| Abstract method | `abstract void pay()` | `@abstractmethod` decorator |
| Interface | `interface` keyword | Pure ABC (sirf abstract methods) |
| Multiple inheritance | Nahi (sirf interfaces) | Haan — multiple ABC inherit kar sakte ho |

---

### Advantages
- Contract enforce karta hai — child class implement karna bhool nahi sakti
- Common interface guarantee hoti hai

### Disadvantages
- Boilerplate badhta hai
- Simple cases mein overkill

### Real World Use Case
- Payment system — `UPIPayment`, `CardPayment`, `CODPayment` sab ka same interface
- Notification system — `EmailNotification`, `SMSNotification`, `PushNotification`

### Anti-patterns
- Har class ke liye ABC banana — sirf tab use karo jab contract enforce karna ho

### Interview Questions
1. Abstraction aur Encapsulation mein kya fark hai?
2. Abstract class ka object kyun nahi ban sakta?
3. Python mein Interface kaise implement karte hain?
4. ABC aur normal class mein kya fark hai?

---

## 1.6 Composition vs Inheritance

### Prerequisites
- Inheritance, Abstraction

### Concept

**"Is-A" vs "Has-A" relationship:**

```
Car IS-A Vehicle    → Inheritance ✅
Car HAS-A Engine    → Composition ✅
Car IS-A Engine     → ❌ Galat!
```

---

### Inheritance Approach

```python
class Car(Engine):   # Car IS-A Engine? Galat!
    pass
```

### Composition Approach

```python
class Engine:
    def start(self):
        print("Engine started")

class Car:
    def __init__(self):
        self.engine = Engine()  # Car HAS-A Engine ✅

    def start(self):
        self.engine.start()
```

---

### Kyun Composition Better Hai?

```
Inheritance → tight coupling  (parent change = child affect)
Composition → loose coupling  (parts independently change ho sakte hain)
```

Electric Engine aaya — Composition mein sirf Engine badlo, Car untouched.

---

### Real World Use Case — Shopping Store

SQLAlchemy `relationship()` Composition hai:

```python
class Order(Base):
    items = relationship("OrderItem")  # Order HAS-A list of OrderItems
```

```
Order HAS-A OrderItems    → Composition
Order HAS-A User          → Composition
Product HAS-A Category    → Composition
Cart HAS-A CartItems      → Composition
```

---

### Kab Kya Use Karein?

| Situation | Use |
|---|---|
| "IS-A" relationship | Inheritance |
| "HAS-A" relationship | Composition |
| Behavior reuse karna | Composition prefer karo |
| Contract enforce karna | Inheritance (ABC) |

---

### Advantages of Composition
- Loose coupling — parts independently change ho sakte hain
- Flexible — runtime pe bhi change kar sakte ho
- Testable — parts alag alag test ho sakte hain

### Disadvantages
- Zyada boilerplate — har method manually delegate karna padta hai

### Anti-patterns
- Inheritance sirf code reuse ke liye use karna — "IS-A" relationship nahi hai toh mat karo
- Deep inheritance chains — 3+ levels avoid karo

### Interview Questions
1. Composition vs Inheritance mein kya fark hai?
2. "Favour Composition over Inheritance" kyun kehte hain?
3. "IS-A" aur "HAS-A" relationship kya hoti hai?
4. Kab Inheritance aur kab Composition use karoge?

---

## 2.1 `__init__` vs `__new__`

### Prerequisites
- Classes & Objects

### Concept

Jab `p = Product("Laptop", 50000)` likhte ho — 2 steps hote hain:

```
Step 1: __new__  → Object memory mein create karo (allocate)
Step 2: __init__ → Object ko initialize karo (attributes set karo)
```

```python
class Product:
    def __new__(cls, name, price):
        print("__new__ called")
        instance = super().__new__(cls)
        return instance

    def __init__(self, name, price):
        print("__init__ called")
        self.name = name
        self.price = price

p = Product("Laptop", 50000)
# Output:
# __new__ called
# __init__ called
```

---

### Real World Use Case — Singleton Pattern

`__new__` ka sabse common use case — poori app mein sirf ek object banana:

```python
class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

db1 = DatabaseConnection()
db2 = DatabaseConnection()

print(db1 is db2)  # True — same object!
```

---

### Advantages
- `__new__` se object creation control kar sakte ho
- Singleton, object pooling jaise patterns implement ho sakte hain

### Disadvantages
- Rarely zaroorat padti hai — 99% cases mein sirf `__init__` kaafi hai

### Anti-patterns
- `__new__` unnecessarily override karna — confusing hota hai

### Interview Questions
1. `__init__` aur `__new__` mein kya fark hai?
2. `__new__` kab use karte hain?
3. Singleton `__new__` se kaise implement hota hai?

---

## 2.2 Dunder Methods

### Prerequisites
- Classes & Objects, Inheritance

### Concept

**Dunder = Double Underscore** — `__method__`

Python ke built-in operators actually dunder methods call karte hain:

```python
1 + 2        →  (1).__add__(2)
p1 == p2     →  p1.__eq__(p2)
len(p)       →  p.__len__()
print(p)     →  p.__str__()
```

---

### Important Dunder Methods

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __repr__(self):
        return f"Product(name={self.name}, price={self.price})"  # developer ke liye

    def __str__(self):
        return f"{self.name} - Rs.{self.price}"  # user ke liye, print() mein

    def __eq__(self, other):
        return self.name == other.name and self.price == other.price  # == operator

    def __hash__(self):
        return hash((self.name, self.price))  # set/dict key ke liye

    def __len__(self):
        return len(self.name)  # len() function

    def __add__(self, other):
        return Cart(self.items + other.items)  # + operator
```

---

### `__eq__` aur `__hash__` Rule

**Agar `__eq__` override karo → `__hash__` bhi override karo:**

```python
p1 = Product("Laptop", 50000)
p2 = Product("Laptop", 50000)

# Bina __hash__ override ke:
{p1, p2}  # 2 elements — inconsistent!

# __hash__ override ke baad:
{p1, p2}  # 1 element — correct!
```

---

### `getattr` / `setattr`

```python
# Dynamic attribute access — runtime pe field name pata chale
getattr(p, "name")           # p.name jaisa
getattr(p, "discount", 0)    # default value agar attribute nahi
setattr(p, "name", "Phone")  # p.name = "Phone" jaisa
```

**Real World Use Case — Shopping Store:**
```python
# PATCH request mein sirf changed fields update karo
for field, value in update_data.model_dump(exclude_unset=True).items():
    setattr(product, field, value)
```

---

### `__getattr__` — Dynamic Error Handling

`__getattr__` tab call hota hai jab attribute **exist nahi karta**:

```python
class Product:
    def __getattr__(self, attr):
        raise BusinessException(f"'{attr}' field allowed nahi hai")

try:
    print(p.discount)
except Exception as e:
    if isinstance(e, BusinessException):
        print(f"Business Error: {e}")
    else:
        print(f"Other Error: {e}")
```

---

### Advantages
- Custom behavior define kar sakte ho operators ke liye
- Readable code — `cart1 + cart2` better hai `cart1.merge(cart2)` se

### Disadvantages
- Overuse karne se code confusing ho jaata hai

### Anti-patterns
- Unnecessary dunder methods override karna — sirf tab karo jab genuinely zaroorat ho

### Interview Questions
1. Dunder methods kya hain?
2. `__str__` aur `__repr__` mein kya fark hai?
3. `__eq__` override karne ke baad `__hash__` kyun override karna chahiye?
4. `getattr` aur `__getattr__` mein kya fark hai?
5. `setattr` real world mein kahan use hota hai?

---

## 2.3 Descriptors

### Prerequisites
- Classes & Objects, Dunder Methods

### Concept

**Reusable attribute validation** — ek baar banao, kahin bhi use karo.

Problem: Har class mein alag alag validation likhna wasteful hai.
Solution: Descriptor class banao jo `__get__`, `__set__`, `__delete__` implement kare.

```python
class PositiveNumber:
    def __set_name__(self, owner, name):
        self.name = name  # attribute ka naam store karo

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self  # class level access pe descriptor khud return hoga
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if value < 0:
            raise ValueError(f"{self.name} negative nahi ho sakta")
        obj.__dict__[self.name] = value

class Product:
    price = PositiveNumber()   # reuse
    stock = PositiveNumber()   # reuse

class Order:
    total = PositiveNumber()   # same descriptor, alag class
```

---

### Teen Methods — Kab Call Hote Hain

| Method | Kab Call Hota Hai |
|---|---|
| `__set_name__` | Class define hone pe — ek baar, attribute naam store karne ke liye |
| `__get__` | `p.price` — attribute read karne pe |
| `__set__` | `p.price = 100` — attribute set karne pe |

---

### `if obj is None` Kyun?

```python
Product.price  # class level → obj = None → descriptor khud return hoga
p.price        # instance level → obj = p  → actual value return hogi
```

Bina check ke — `None.__dict__` access hoga → `AttributeError`!

---

### How Python Calls Descriptors Automatically

```
self.price = -100
      │
      ▼
Class mein price descriptor hai? YES
      │
      ▼
PositiveNumber.__set__(obj, -100) automatically call hota hai
```

---

### Advantages
- Reusable validation — ek baar likho, kahin bhi use karo
- `@property` bhi internally descriptor hai

### Disadvantages
- Complex code — simple cases mein overkill
- Beginners ke liye confusing

### Real World Use Case
- Django ORM fields — `CharField`, `IntegerField` — sab descriptors hain
- Pydantic validators bhi similar concept use karte hain

### Anti-patterns
- Simple validation ke liye descriptor banana — `@property` kaafi hai

### Interview Questions
1. Descriptor kya hota hai?
2. `__get__`, `__set__`, `__set_name__` kab call hote hain?
3. `if obj is None: return self` kyun zaroori hai?
4. `@property` aur Descriptor mein kya connection hai?

---

## 2.4 Metaclasses

### Prerequisites
- Classes & Objects, `__new__`, `type`

### Concept

```
Object ki class → Class
Class ki class  → Metaclass
```

**`type` default Metaclass hai** — har class internally `type` se banti hai:

```python
print(type(Product))  # <class 'type'>
print(type(42))       # <class 'int'>
```

```
type  ──creates──▶  Class
Class ──creates──▶  Object
```

---

### Custom Metaclass

Class define hote waqt automatically checks laga sakte ho:

```python
class APIMeta(type):
    def __new__(mcs, name, bases, namespace):
        if name != "BaseAPI":
            if "get" not in namespace:
                raise TypeError(f"{name} mein 'get' method hona chahiye!")
        return super().__new__(mcs, name, bases, namespace)

class BaseAPI(metaclass=APIMeta):
    pass

class ProductAPI(BaseAPI):
    def get(self): return "products"  # ✅

class OrderAPI(BaseAPI):  # ❌ TypeError — class define hote waqt!
    pass
```

---

### Normal vs ABC vs Metaclass

| | Kab Check Hota Hai |
|---|---|
| Normal | Object banate waqt |
| ABC | Object banate waqt |
| Metaclass | Class define hote waqt — sabse pehle! |

---

### Real World Use Case

| Framework | Metaclass Ka Use |
|---|---|
| Django ORM | `CharField` etc automatically register hote hain |
| SQLAlchemy | `Base` — table mapping automatically hoti hai |
| Pydantic | Field validation aur schema generation |

Tumhari shopping store mein `Base` class SQLAlchemy ka metaclass use karta hai — isliye `__tablename__` aur columns automatically DB se map hote hain.

---

### Advantages
- Class definition level pe validation
- Framework-level magic possible hota hai

### Disadvantages
- Complex — samajhna mushkil
- 99% cases mein zaroorat nahi

### Anti-patterns
- Simple validation ke liye Metaclass use karna — ABC ya decorator kaafi hai

### Interview Questions
1. Metaclass kya hota hai?
2. `type` kya hai Python mein?
3. ABC aur Metaclass mein kya fark hai?
4. Real world mein Metaclass kahan use hota hai?

---

## 2.5 `@property`

### Prerequisites
- Classes & Objects, Encapsulation, Descriptors

### Concept

Getter/Setter ko **attribute jaisa** access deta hai — method call ki zaroorat nahi.

```python
# Pehle (verbose):
acc.get_balance()
acc.set_balance(20000)

# @property ke baad (clean):
acc.balance
acc.balance = 20000
```

---

### Implementation

```python
class BankAccount:
    def __init__(self, balance):
        self.__balance = balance

    @property
    def balance(self):              # getter
        return self.__balance

    @balance.setter
    def balance(self, value):       # setter
        if value < 0:
            raise ValueError("Balance negative nahi ho sakta")
        self.__balance = value
```

---

### Computed Property

Store nahi hota — har baar calculate hota hai:

```python
class Product:
    def __init__(self, price, tax_rate):
        self.price = price
        self.tax_rate = tax_rate

    @property
    def price_with_tax(self):       # no setter — read only
        return self.price * (1 + self.tax_rate)

p = Product(1000, 0.18)
print(p.price_with_tax)  # 1180.0
```

---

### Read-Only Property

Sirf `@property` likho, `@setter` mat likho:

```python
p.price_with_tax         # ✅ read kar sakte ho
p.price_with_tax = 500   # ❌ AttributeError — set nahi kar sakte
```

---

### Kab Store Karo, Kab `@property`?

| Situation | Approach |
|---|---|
| Cart total — items change hote hain | `@property` — real-time calculate |
| Order total — order place ke baad fixed | Store karo DB mein |

---

### `@property` internally Descriptor hai

```
@property → __get__, __set__, __delete__ implement karta hai
```

---

### Advantages
- Clean interface — attribute jaisa access
- Validation with clean syntax
- Computed values — no extra storage

### Disadvantages
- Heavy computation `@property` mein mat karo — bar bar call hoti hai

### Anti-patterns
- DB call ya heavy computation `@property` mein — unexpected performance issue

### Interview Questions
1. `@property` kya hai aur kyun use karte hain?
2. Getter/Setter aur `@property` mein kya fark hai?
3. `@property` aur Descriptor ka kya connection hai?
4. Read-only property kaise banate hain?

---

## 2.6 `@classmethod` vs `@staticmethod`

### Prerequisites
- Classes & Objects, `self`

### Concept

```
Normal method   → self   → object ka data access karta hai
@classmethod    → cls    → class ka data access karta hai
@staticmethod   → kuch nahi → utility function, independent
```

---

### Implementation

```python
class Product:
    discount_rate = 0.1

    def __init__(self, name, price):
        self.name = name
        self.price = price

    @classmethod
    def set_discount(cls, rate):     # class variable update karo
        cls.discount_rate = rate

    @staticmethod
    def validate_price(price):       # utility — sirf validation
        return price > 0
```

---

### `@classmethod` — Alternative Constructor

```python
class User:
    @classmethod
    def from_dict(cls, data: dict):
        return cls(data["name"], data["email"])

user = User.from_dict({"name": "Aditya", "email": "a@b.com"})
```

---

### Kab Kya Use Karein?

| Situation | Use |
|---|---|
| Object ka data chahiye | Normal method (`self`) |
| Class variable update karna | `@classmethod` (`cls`) |
| Alternative constructor | `@classmethod` |
| Utility function — independent | `@staticmethod` |

---

### Real World Use Case — Shopping Store

`success()` aur `error()` utility functions — class mein hote toh `@staticmethod` hote:

```python
class ResponseHelper:
    @staticmethod
    def success(data, message):
        return {"data": data, "message": message}
```

---

### Advantages
- Code organization — related functions class mein group kar sakte ho
- `@classmethod` se alternative constructors banate hain

### Disadvantages
- `@staticmethod` plain function se better nahi — sirf organization ke liye

### Anti-patterns
- `@staticmethod` use karna sirf isliye ki class mein dikh sake — plain function better hai

### Interview Questions
1. `@classmethod` aur `@staticmethod` mein kya fark hai?
2. `cls` aur `self` mein kya fark hai?
3. Alternative constructor kya hota hai?
4. Kab `@staticmethod` use karte hain?

---

## 2.7 Mixin Classes

### Prerequisites
- Multiple Inheritance, MRO

### Concept

Reusable behavior add karo multiple classes mein — bina "IS-A" relationship ke.

**Problem:** `Product`, `Order`, `User` teeno mein timestamp chahiye.
**Solution:** `TimestampMixin` banao — ek baar, sab mein use karo.

```python
class TimestampMixin:
    created_at = None
    updated_at = None

    def set_timestamps(self):
        from datetime import datetime
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

class Product(Base, TimestampMixin):
    def __init__(self, name):
        self.name = name
        self.set_timestamps()
```

---

### 3 Rules of Mixin

```
1. Standalone use nahi hota — sirf mix karne ke liye
2. Specific behavior deta hai — sirf ek kaam
3. Naam mein "Mixin" likhte hain — convention
```

---

### Real World Use Case — Shopping Store

```python
class Product(Base, TimestampMixin):
    pass

class Order(Base, TimestampMixin):
    pass

class User(Base, TimestampMixin):
    pass
```

Ek `TimestampMixin` — teeno classes mein `created_at`, `updated_at` automatically.

---

### Advantages
- Code reuse — ek baar likho, kahin bhi use karo
- Single Responsibility — har Mixin ek kaam kare

### Disadvantages
- Zyada Mixins → MRO confusing ho jaata hai
- Hidden behavior — kahan se aa raha hai samajhna mushkil

### Anti-patterns
- Ek Mixin mein bahut saara behavior — Single Responsibility tod rahe ho

### Interview Questions
1. Mixin kya hota hai?
2. Mixin aur normal Inheritance mein kya fark hai?
3. Mixin use karne ke 3 rules kya hain?
4. Tumhare project mein Mixin kahan use hua?
