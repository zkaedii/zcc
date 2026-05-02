/* tests/abi/ret_tvalue_lib.c */
typedef union { long i; double d; } Val;
typedef struct { Val v; char t; } TValue;
TValue get_tvalue(long i, char t) {
    TValue r;
    r.v.i = i;
    r.t = t;
    return r;
}
