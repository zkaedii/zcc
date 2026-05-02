#include <stdio.h>
#include <stddef.h>

typedef struct { long a; long b; } IntInt;
typedef struct { double a; double b; } DblDbl;
typedef struct { double a; long b; } DblInt;
typedef struct { long a; double b; } IntDbl;
typedef union  { long i; double d; } Val;
typedef struct { Val v; char t; } TValue;
typedef struct { long a, b, c; } TooBig;
typedef struct __attribute__((packed)) { char a; long b; } Packed9;

int main(void) {
    printf("IntInt:  %zu\n", sizeof(IntInt));
    printf("DblDbl:  %zu\n", sizeof(DblDbl));
    printf("DblInt:  %zu\n", sizeof(DblInt));
    printf("IntDbl:  %zu\n", sizeof(IntDbl));
    printf("Val:     %zu\n", sizeof(Val));
    printf("TValue:  %zu\n", sizeof(TValue));
    printf("TooBig:  %zu\n", sizeof(TooBig));
    printf("Packed9: %zu\n", sizeof(Packed9));
    return 0;
}
