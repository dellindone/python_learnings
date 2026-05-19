class Product:
    def __init__(self, name, price):
        print(f"self id: {id(self)}")
        self.name = name
        self.price = price

laptop = Product("Laptop", 50000)
phone = Product("Phone", 20000)

print(f"laptop id: {id(laptop)}")
print(f"phone id: {id(phone)}")
