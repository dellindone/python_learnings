import weakref

class Product:
    def __init__(self, name):
        self.name = name

p = Product("Laptop")
weak_p = weakref.ref(p)

print(weak_p())   # object access karo
del p
print(weak_p())   # ab kya hoga?
