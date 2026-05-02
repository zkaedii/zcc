/* tests/abi/ret_sse_int_main.c */
#include <stdio.h>
typedef struct { double a; long b; } DblInt;
DblInt get_sse_int(double x, long y);
int main() {
    DblInt r = get_sse_int(1.23, 456);
    if (r.a > 1.229 && r.a < 1.231 && r.b == 456) return 0;
    printf("FAIL: get_sse_int returned {%f, %ld}\n", r.a, r.b);
    return 1;
}
