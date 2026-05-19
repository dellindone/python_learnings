import sys

numbers = [x * 2 for x in range(100000)]
print(sys.getsizeof(numbers))


numbers_gen = (x * 2 for x in range(100000))
print(sys.getsizeof(numbers_gen))

def normal_function():
    return [1, 2, 3]

def generator_function():
    yield 1
    yield 2
    yield 3

normal = normal_function()
gen = generator_function()

print(normal)
print(next(gen))
print(next(gen))
print(next(gen))
print(next(gen))