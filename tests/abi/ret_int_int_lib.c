/* tests/abi/ret_int_int_lib.c */
typedef struct { long a, b; } IntInt;
IntInt get_int_int(long x, long y) {
    IntInt r;
    r.a = x;
    r.b = y;
    return r;
}
