from abc import ABC, abstractmethod

class Payment(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

    @abstractmethod
    def refund(self, amount):
        pass

class UPIPayment(Payment):
    def pay(self, amount):
        print(f"UPI se {amount} pay kiya")
    
    def refund(self, amount):
        print(f"UPI se {amount} refund kiya")

class CardPayment(Payment):
    def pay(self, amount):
        print(f"Card se {amount} pay kiya")
    
    def refund(self, amount):
        print(f"Card se {amount} refund kiya")

class IncompletePayment(Payment):
    def pay(self, amount):
        print("paying...")
    # refund implement nahi kiya

# p = IncompletePayment()
# p.refund(100)

class Product:
    def __new__(cls, name, price):
        print("__new__ called")
        instance = super().__new__(cls)
        return instance
    
    def __init__(self, name, price):
        print("__init__ called")
        self.name = name
        self.price = price

# p = Product("Laptop", 50000)


class DatabaseConnection:
    _instance = None  # class variable — pehla object store hoga yahan

    def __new__(cls):
        if cls._instance is None:           # pehli baar?
            cls._instance = super().__new__(cls)  # object banao
        return cls._instance                # hamesha same object return karo


# db1 = DatabaseConnection()
# db2 = DatabaseConnection()

# print(id(db1))
# print(id(db2))
# print(db1 is db2)

# print(1 + 2)
# print("a" + "b")


class Cart:
    def __init__(self, item):
        self.item = item
    
    def __add__(self, other):
        return Cart(self.item + other.item)
    
# cart1 = Cart(["Laptop", "Phone"])
# cart2 = Cart(["Headphones"])

# cart3 = cart1 + cart2
# print(cart3.item)


class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def __repr__(self):
        return f"Product(name={self.name}, price={self.price})"
    
    def __str__(self):
        return f"{self.name} - Rs.{self.price}"
    
    def __eq__(self, other):
        return self.name == other.name and self.price == other.price
    
    def __len__(self):
        return len(self.name)

    def __hash__(self):
        return hash((self.name, self.price))

p1 = Product("Laptop", 50000)
p2 = Product("Laptop", 50000)

# print(repr(p1))
# print(str(p1))
# print(len(p1))
# print(p1 == p2)
# print({p1, p2})
# print(hash(p1) == hash(p2))

# print(getattr(p1, "name"))
# setattr(p1, "name", "phone")
# print(getattr(p1, "discount", 0))
# print(p1.name)

class PositiveNumber:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if value < 0:
            raise ValueError(f"{self.name} negative nahi ho sakta")
        obj.__dict__[self.name] = value

class Product:
    price = PositiveNumber()
    stock = PositiveNumber()

    def __init__(self, name, price, stock):
        self.name = name
        self.price = price
        self.stock = stock

# p = Product("Laptop", 50000, 10)   # ✅
# print(Product.ab)
# p2 = Product("Phone", -100, 5)     # ❌ ValueError
# print(type(Product))  # kya aayega?
# print(type(42))       # kya aayega?
# print(type("hello"))  # kya aayega?


class BankAccount:
    def __init__(self, balance):
        self.__balance = balance

    @property
    def balance(self):
        return self.__balance

    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("Balance negative nahi ho sakta")
        self.__balance = value

# acc = BankAccount(10000)
# print(acc.balance)      # method nahi, attribute jaisa!
# acc.balance = 20000     # setter automatically call hoga
# print(acc.balance)      # method nahi, attribute jaisa!

class Product:
    def __init__(self, price, tax_rate):
        self.price = price
        self.tax_rate = tax_rate

    @property
    def price_with_tax(self):
        return self.price * (1 + self.tax_rate)

p = Product(1000, 0.18)
# print(p.price_with_tax)  # 1180.0

print(p)