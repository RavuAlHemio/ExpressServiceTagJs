#!/usr/bin/env python3
print("// addTable")
for a in range(0, 10):
    print("        '{0}': {{".format(a))
    for b in range(a, 10):
        s = (a + b) % 10
        c = (a + b) // 10
        print("            '{0}': '{1}{2}',".format(b, s, c))
    print("        },")
print()

print("// subTable")
for a in range(0, 10):
    print("        '{0}': {{".format(a))
    for b in range(0, 10):
        d = (a - b) % 10
        c = 0 if a >= b else 1
        print("            '{0}': '{1}{2}',".format(b, d, c))
    print("        },")
print()

print("// mulTable")
for a in range(0, 10):
    print("        '{0}': {{".format(a))
    for b in range(a, 10):
        p = (a * b) % 10
        c = (a * b) // 10
        print("            '{0}': '{1}{2}',".format(b, p, c))
    print("        },")
print()

print("// fullAdderTest")
for a in range(0, 10):
    for b in range(0, 10):
        for ci in range(0, 10):
            s = (a + b + ci) % 10
            co = (a + b + ci) // 10

            print("        BadBignumTests.checkFullAdder('{0}', '{1}', '{2}', '{3}{4}');".format(
                a, b, ci, s, co
            ))


print("// fullSubberTest")
for a in range(0, 10):
    for b in range(0, 10):
        for bi in range(0, 10):
            d = (a - b - bi) % 10
            bo = -((a - b - bi) // 10)

            print("        BadBignumTests.checkFullSubber('{0}', '{1}', '{2}', '{3}{4}');".format(
                a, b, bi, d, bo
            ))

print("// mulTest")
for a in range(0, 100):
    for b in range(a, 100):
        prod = a * b
        print("        BadBignumTests.checkMul('{0}', '{1}', '{2}');".format(
            a, b, prod
        ))
