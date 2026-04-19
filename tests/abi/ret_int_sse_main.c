/* tests/abi/ret_int_sse_main.c */
#include <stdio.h>
typedef struct { long a; double b; } IntSse;
IntSse get_int_sse(long x, double y);
int main() {
    IntSse r = get_int_sse(123, 4.56);
    if (r.a == 123 && r.b > 4.559 && r.b < 4.561) return 0;
    printf("FAIL: get_int_sse returned {%ld, %f}\n", r.a, r.b);
    return 1;
}
