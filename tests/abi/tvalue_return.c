/* tests/abi/tvalue_return.c
 * ================================================================
 * Hypothesis probe: CG-IR-019 candidate
 *   Does zcc correctly classify a 16-byte union-containing struct
 *   with mixed INTEGER and SSE eightbytes on return?
 *
 * SysV AMD64 ABI §3.2.3 rules for struct { union{ptr,long,double}; uchar }:
 *   Eightbyte 0 (bytes 0-7):  union of ptr(INTEGER), long(INTEGER),
 *                              double(SSE)  → contains SSE field →
 *                              classification is SSE  (union rule)
 *   Eightbyte 1 (bytes 8-15): uchar → INTEGER
 *   Return: xmm0 (SSE eightbyte), rax (INTEGER eightbyte)
 *
 * If zcc returns both eightbytes in rax/rdx (INTEGER,INTEGER), the
 * double field will be bit-scrambled and Lua's TValue numeric ops die.
 *
 * Pass condition:
 *   num: 3.14159265358979 tag=3
 *   int: 0xdeadbeefcafebabe tag=2
 *   exit code 0
 * ================================================================
 */
#include <stdio.h>
#include <string.h>

/* Mirrors lua_TValue layout (Lua 5.4) */
typedef union {
    void  *p;    /* GCObject* — INTEGER eightbyte */
    long   i;    /* lua_Integer — INTEGER eightbyte */
    double n;    /* lua_Number  — SSE eightbyte    */
} Value;

typedef struct {
    Value        v;   /* bytes 0-7  */
    unsigned char tt; /* bytes 8-15 (padded to 8 for alignment) */
} TValue;

/* noinline forces real ABI crossing — no elision by inliner. */
__attribute__((noinline))
TValue make_num(double d) {
    TValue t;
    t.v.n = d;
    t.tt  = 3;  /* LUA_TNUMFLT */
    return t;
}

__attribute__((noinline))
TValue make_int(long i) {
    TValue t;
    t.v.i = i;
    t.tt  = 2;  /* LUA_TNUMINT */
    return t;
}

/* GCC reference values (generated with gcc -O0):
 *   make_num: returns double in xmm0, tag byte in rax (high half)
 *   make_int: returns long  in rax,   tag byte in rdx (high half)
 * If zcc ABI is wrong, one of the printf lines will print garbage.
 */
int main(void) {
    TValue a = make_num(3.14159265358979);
    TValue b = make_int((long)0xDEADBEEFCAFEBABEL);

    printf("num: %.15g tag=%u  (expect 3.14159265358979 tag=3)\n",
           a.v.n, (unsigned)a.tt);
    printf("int: 0x%lx   tag=%u  (expect 0xdeadbeefcafebabe tag=2)\n",
           (unsigned long)b.v.i, (unsigned)b.tt);

    int pass = (a.tt == 3 && b.tt == 2);
    printf("ABI probe: %s\n", pass ? "PASS" : "FAIL");
    return pass ? 0 : 1;
}
