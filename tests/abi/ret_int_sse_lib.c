/* tests/abi/ret_int_sse_lib.c */
typedef struct { long a; double b; } IntSse;
IntSse get_int_sse(long x, double y) {
    IntSse r;
    r.a = x;
    r.b = y;
    return r;
}
