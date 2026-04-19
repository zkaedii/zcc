/* tests/abi/ret_int_int_main.c */
#include <stdio.h>
typedef struct { long a, b; } IntInt;
IntInt get_int_int(long x, long y);
int main() {
    IntInt r = get_int_int(123, 456);
    if (r.a == 123 && r.b == 456) return 0;
    printf("FAIL: get_int_int returned {%ld, %ld}\n", r.a, r.b);
    return 1;
}
