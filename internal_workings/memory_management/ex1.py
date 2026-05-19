import sys

a = []
# print(sys.getrefcount(a))
a.append(a)
print(sys.getrefcount(a))

del a
print(sys.getrefcount(a))
