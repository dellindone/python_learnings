import sys

class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

p = Product("Laptop", 50000)
print(p.__dict__)
print(sys.getsizeof(p))
print(sys.getsizeof(p.__dict__))


class ProductWithSlots:
    __slots__ = ['name', 'price']
    
    def __init__(self, name, price):
        self.name = name
        self.price = price

p = ProductWithSlots("Laptop", 50000)
print(sys.getsizeof(p))
print(hasattr(p, '__dict__'))