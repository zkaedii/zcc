/* tests/abi/ret_sse_int_lib.c */
typedef struct { double a; long b; } DblInt;
DblInt get_sse_int(double x, long y) {
    DblInt r;
    r.a = x;
    r.b = y;
    return r;
}
