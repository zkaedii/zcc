/* tests/abi/ret_tvalue_main.c */
#include <stdio.h>
typedef union { long i; double d; } Val;
typedef struct { Val v; char t; } TValue;
TValue get_tvalue(long i, char t);
int main() {
    TValue r = get_tvalue(12345678, 42);
    if (r.v.i == 12345678 && r.t == 42) return 0;
    printf("FAIL: get_tvalue returned {%ld, %d}\n", r.v.i, (int)r.t);
    return 1;
}
