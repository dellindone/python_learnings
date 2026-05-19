class Product:
    discount_rate = 0.1  # class variable

    def __init__(self, name, price):
        self.name = name
        self.price = price

    @classmethod
    def set_discount(cls, rate):    # cls — class itself
        cls.discount_rate = rate

    @staticmethod
    def validate_price(price):      # na self, na cls
        return price > 0

# Use:
# Product.set_discount(0.2)           # class se call
# print(Product.validate_price(500))  # class se call
# print(Product.discount_rate)


class User:
    
    @classmethod
    def from_dict(cls, data: dict):     # alternative constructor
        return cls(data["name"], data["email"])
    
    @staticmethod
    def validate_email(email: str):     # utility — sirf validation
        return "@" in email


class TimestampMixin:
    created_at = None
    updated_at = None

    def set_timestamps(self):
        from datetime import datetime
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

class Product(TimestampMixin):
    def __init__(self, name):
        self.name = name
        self.set_timestamps()

# p = Product("Laptop")
# print(p.created_at)
# print(p.updated_at)


def outer():
    message = "Hello"
    
    def inner():
        print(message)  # Enclosing scope se le raha hai
    
    return inner  # function return kar raha hai!

func = outer()
# func()  # outer() khatam ho gayi — lekin message abhi bhi accessible hai?

# print(func.__closure__)
# print(func.__closure__[0].cell_contents)

def make_counter():
    count = 0
    
    def counter():
        nonlocal count
        count += 1
        return count
    
    return counter

# c1 = make_counter()
# c2 = make_counter()

# print(c1())  # 1
# print(c1())  # 2
# print(c2())  # 1 — alag closure, alag count!

import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end-start:.4f} seconds")
        return result
    return wrapper

# @timer
# def calculate(n):
#     return sum(range(n))

# # calculate(1000000)
# import functools

# def timer(func):
#     @functools.wraps(func)
#     def wrapper(*args, **kwargs):
#         return func(*args, **kwargs)
#     return wrapper

# @timer
# def calculate(n):
#     """Calculates sum"""
#     return sum(range(n))

# print(calculate.__name__)  # kya aayega?
# print(calculate.__doc__)   # kya aayega?

# class DatabaseConnection:
#     def __enter__(self):
#         print("Connection open")
#         return self

#     def __exit__(self, exc_type, exc_val, exc_tb):
#         print("Connection closed")
#         return True

# with DatabaseConnection() as db:
#     print("DB kaam kar raha hai")
#     raise Exception("Kuch toot gaya!")
#     print("Yeh print nahi hoga")

# from contextlib import contextmanager

# @contextmanager
# def database_connection():
#     print("Connection open")
#     try:
#         yield  # yahan with block execute hota hai
#     finally:
#         print("Connection closed")

# with database_connection():
#     print("DB kaam kar raha hai")

# def func(*args, **kwargs):
#     print(args)    # tuple
#     print(kwargs)  # dict

# func(1, 2, 3, name="Aditya", age=25)


# class AppException(Exception):
#     pass

# class NotFoundException(AppException):
#     pass

# try:
#     raise NotFoundException("Product not found")
# except NotFoundException as e:
#     print("NotFoundException caught")

# except AppException as e:
#     print("AppException caught")

# try:
#     int("abc")
# except ValueError as e:
#     raise RuntimeError("Processing failed") from e

# import functools

# @functools.lru_cache(maxsize=128)
# # @timer
# def fibonacci(n):
#     if n < 2:
#         return n
#     return fibonacci(n-1) + fibonacci(n-2)

# print(fibonacci(50))
# print(fibonacci.cache_info())

# import functools

# def multiply(x, y):
#     return x * y

# double = functools.partial(multiply, 2)  # x=2 fix kar diya
# triple = functools.partial(multiply, 3)  # x=3 fix kar diya

# print(double(5))   # 10
# print(triple(5))   # 15

# from functools import partial

# # Generic validator
# def validate_length(value, min_len, max_len):
#     return min_len <= len(value) <= max_len

# # Specialized validators
# validate_username = partial(validate_length, min_len=3, max_len=20)
# validate_password = partial(validate_length, min_len=8, max_len=50)

# print(validate_username("Aditya"))   # True
# print(validate_password("abc"))      # False

# 1. Normal class
# class Point:
#     def __init__(self, x, y):
#         self.x = x
#         self.y = y
# p = Point(1, 2)
# print(p)

# # 2. namedtuple
# from collections import namedtuple
# Point = namedtuple('Point', ['x', 'y'])
# p = Point(1, 2)
# print(p)

# # 3. dataclass
# from dataclasses import dataclass

# @dataclass
# class Point:
#     x: int
#     y: int

# p = Point(1, 2)
# print(p)

class Dog:
    def speak(self):
        return "Woof"

def new_speak(self):
    return "Meow"  # Dog ab Cat ki tarah bolega!

Dog.speak = new_speak  # monkey patch!

d = Dog()
print(d.speak())
