/* tests/abi/ret_sse_sse_lib.c */
typedef struct { double a, b; } DblDbl;
DblDbl get_dbl_dbl(double x, double y) {
    DblDbl r;
    r.a = x;
    r.b = y;
    return r;
}
