/* tests/abi/ret_sse_sse_main.c */
#include <stdio.h>
typedef struct { double a, b; } DblDbl;
DblDbl get_dbl_dbl(double x, double y);
int main() {
    DblDbl r = get_dbl_dbl(1.23, 4.56);
    if (r.a > 1.229 && r.a < 1.231 && r.b > 4.559 && r.b < 4.561) return 0;
    printf("FAIL: get_dbl_dbl returned {%f, %f}\n", r.a, r.b);
    return 1;
}
