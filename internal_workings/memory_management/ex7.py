class Vehicle:
    def move(self):
        print("Vehicle moving")

class Car(Vehicle):
    def move(self):
        print("Car moving on road")

class Boat(Vehicle):
    def move(self):
        print("Boat moving on water")

car = Car()
boat = Boat()

car.move()
boat.move()


class Truck(Vehicle):
    pass

truck = Truck()
truck.move()


class Electric:
    def power(self):
        print("Electric power")

class Vehicle:
    def power(self):
        print("Fuel power")

class Teslacar(Electric, Vehicle):
    pass

car = Teslacar()
car.power()
print(Teslacar.__mro__)

class A:
    def hello(self):
        print("A")

class B(A):
    def hello(self):
        print("B")

class C(A):
    def hello(self):
        print("C")

class D(B, C):
    pass

d = D()
d.hello()
print(D.__mro__)


class BankAccount:
    def __init__(self):
        self.name = "Aditya"        # public — koi bhi access kar sakta hai
        self._balance = 10000       # protected — convention: mat chhedho
        self.__pin = 1234           # private — name mangling hota hai

acc = BankAccount()
print(acc.name)      # kya hoga?
print(acc._balance)  # kya hoga?
print(acc._BankAccount__pin)

# print(acc.__pin)     # kya hoga?

class Vehicle:
    def move(self):
        print("Vehicle moving")

class Car(Vehicle):
    def move(self):
        print("Car moving on road")

class Boat(Vehicle):
    def move(self):
        print("Boat moving on water")

vehicles = [Car(), Boat()]

for v in vehicles:
    v.move()
