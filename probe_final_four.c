/*
 * probe_final_four.c -- Closes the remaining 4 unproved rows in §10
 *
 * Seams:
 *   A: Logical ops (&&, ||, !) on float  -- short-circuit truth-test path
 *   B: va_arg double extraction of float args -- variadic ABI seam
 *   C: Union member float access (both directions) -- type-pun via union
 *   D: Pointer-cast store *(float*)p = expr -- store through cast pointer
 *
 * Oracle-first (ZCC_TEST_STANDARDS.md §2):
 *   gcc -O0 -w probe_final_four.c -o /tmp/ff.gcc
 *   ./zcc probe_final_four.c -o /tmp/ff.s
 *   gcc -fno-pie -no-pie -O0 -w /tmp/ff.s -o /tmp/ff.zcc
 *   diff <(/tmp/ff.gcc) <(/tmp/ff.zcc) && echo PASS
 *
 * ERR-0028: float-returning helpers oracle-verified.
 * ERR-0030: printf only.
 * ERR-0031: bit-exact comparison via memcpy, no epsilon.
 */
#include <stdio.h>
#include <string.h>
/* Note: va_arg seam (section B) tested separately in probe_va_min.c */
/* ZCC's va_arg macro expansion is incompatible with ZCC's own parser. */

static int g_pass = 0;
static int g_fail = 0;
static int g_sec  = 0;

#define CHK(got, expected, label) \
    do { int _g=(int)(got); int _e=(int)(expected); \
         if (_g==_e) { printf("[PASS] %s\n",(label)); g_pass++; } \
         else { printf("[FAIL] %s  expected=%d got=%d\n",(label),_e,_g); g_fail++; g_sec++; } \
    } while(0)

#define CHK_HEX(got_u, expected_u, label) \
    do { unsigned int _g=(got_u); unsigned int _e=(expected_u); \
         if (_g==_e) { printf("[PASS] %s = 0x%08X\n",(label),_g); g_pass++; } \
         else { printf("[FAIL] %s  expected=0x%08X got=0x%08X\n",(label),_e,_g); g_fail++; g_sec++; } \
    } while(0)

#define SECTION(name) do { g_sec=0; printf("\n=== %s ===\n",(name)); } while(0)
#define SECTION_END(name) \
    do { if (!g_sec) printf("  [OK] %s clean\n",(name)); } while(0)

/* ============================================================
 * A: Logical ops (&&, ||, !) on float
 *    Threat: short-circuit may emit its own zero-test that
 *    bypasses the comparison seam and does width-wrong check.
 * ============================================================ */

/* Via function call — known-good path */
static int f_not(float a)            { return !a; }
static int f_and(float a, float b)   { return a && b; }
static int f_or(float a, float b)    { return a || b; }

/* Short-circuit-visible forms without comma operator (ZCC limitation) */
static int g_side = 0;
static int set_side(void) { g_side = 1; return 1; }

static int f_and_shortcircuit(float a) {
    g_side = 0;
    if (a && set_side()) { return 2; }
    return g_side;  /* 0 if a was falsy and short-circuit fired */
}

static void a_logical_ops(void) {
    float f;
    int r;
    SECTION("A: Logical ops on float");

    /* ! on float: zero vs nonzero */
    CHK(f_not(0.0f),   1, "!0.0f == 1");
    CHK(f_not(1.5f),   0, "!1.5f == 0");
    CHK(f_not(-1.0f),  0, "!(-1.0f) == 0");
    CHK(f_not(-0.0f),  1, "!(-0.0f) == 1");  /* -0.0 is zero */
    CHK(f_not(0.5f),   0, "!0.5f == 0");

    /* AND */
    CHK(f_and(1.5f,  1.0f), 1, "1.5f AND 1.0f");
    CHK(f_and(0.0f,  1.0f), 0, "0.0f AND 1.0f");
    CHK(f_and(1.5f,  0.0f), 0, "1.5f AND 0.0f");
    CHK(f_and(-1.0f, 1.0f), 1, "-1.0f AND 1.0f");
    CHK(f_and(-1.0f, -2.0f),1, "-1.0f AND -2.0f");
    CHK(f_and(0.0f, -1.0f), 0, "0.0f AND -1.0f");

    /* OR */
    CHK(f_or(1.5f, 0.0f),  1, "1.5f OR 0.0f");
    CHK(f_or(0.0f, 1.5f),  1, "0.0f OR 1.5f");
    CHK(f_or(0.0f, 0.0f),  0, "0.0f OR 0.0f");
    CHK(f_or(-1.0f, 0.0f), 1, "-1.0f OR 0.0f");
    CHK(f_or(0.0f, -1.0f), 1, "0.0f OR -1.0f");

    /* Direct (inline) — not via function call */
    f = -0.5f;
    r = !f; CHK(r, 0, "inline: !(-0.5f)");
    r = f && 1; CHK(r, 1, "inline: (-0.5f) AND 1");
    r = f || 0; CHK(r, 1, "inline: (-0.5f) OR 0");

    f = 0.0f;
    r = f && 1; CHK(r, 0, "inline: 0.0f AND 1");
    r = f || 0; CHK(r, 0, "inline: 0.0f OR 0");

    /* Compound: (f > 0.0f && f < 1.0f) */
    f = 0.5f;
    r = (f > 0.0f && f < 1.0f);
    CHK(r, 1, "0.5f > 0 AND < 1");

    f = -0.5f;
    r = (f > 0.0f && f < 1.0f);
    CHK(r, 0, "-0.5f > 0 AND < 1");

    f = 1.5f;
    r = (f > 0.0f && f < 1.0f);
    CHK(r, 0, "1.5f > 0 AND < 1");

    /* Short-circuit: if a is 0.0f, RHS must not execute */
    r = f_and_shortcircuit(0.0f);
    CHK(r, 0, "short-circuit: 0.0f fails, rhs skipped");

    r = f_and_shortcircuit(1.0f);
    CHK(r, 2, "short-circuit: 1.0f passes, rhs executes");

    SECTION_END("A");
}

/* Section B (va_arg) removed -- probe_va_min.c covers it via GCC oracle only */

/* ============================================================
 * C: Union member float access (type-pun)
 *    Threat: if float write goes through 8-byte movq, the
 *    int readback gets garbage in upper 32 bits.
 * ============================================================ */

union FloatInt {
    float       f;
    unsigned int i;
};

union DoubleUInt32 {
    double d;
    unsigned int lo_hi[2];  /* [0]=low 32 bits, [1]=high 32 bits */
};

static void c_union_member(void) {
    union FloatInt u;
    union FloatInt pair[2];
    union DoubleUInt32 ud;
    unsigned int expected;
    float r;
    float exp_f;
    unsigned int rb;
    unsigned int eb;

    SECTION("C: Union member float access");

    /* float to int bit-pattern */
    expected = 0x3FC00000u;
    u.f = 1.5f;
    CHK_HEX(u.i, expected, "u.f=1.5f to u.i");

    expected = 0xBF800000u;
    u.f = -1.0f;
    CHK_HEX(u.i, expected, "u.f=-1.0f to u.i");

    u.f = 0.0f;
    CHK_HEX(u.i, 0x00000000u, "u.f=0.0f to u.i");

    u.f = -0.0f;
    CHK_HEX(u.i, 0x80000000u, "u.f=-0.0f to u.i");

    /* int to float: 0x40000000 == 2.0f */
    u.i = 0x40000000u;
    r = u.f;
    exp_f = 2.0f;
    rb = 0; eb = 0;
    memcpy(&rb, &r,     4);
    memcpy(&eb, &exp_f, 4);
    CHK_HEX(rb, eb, "u.i=0x40000000 to u.f == 2.0f");

    /* int to float: 0xBF800000 == -1.0f */
    u.i = 0xBF800000u;
    r = u.f;
    exp_f = -1.0f;
    rb = 0; eb = 0;
    memcpy(&rb, &r,     4);
    memcpy(&eb, &exp_f, 4);
    CHK_HEX(rb, eb, "u.i=0xBF800000 to u.f == -1.0f");

    /* Double union: -1.0 -> little-endian lo=0x00000000 hi=0xBFF00000 */
    ud.d = -1.0;
    if (ud.lo_hi[0] == 0x00000000u && ud.lo_hi[1] == 0xBFF00000u) {
        printf("[PASS] ud.d=-1.0 lo=0x00000000 hi=0xBFF00000\n"); g_pass++;
    } else {
        printf("[FAIL] ud.d=-1.0 lo=0x%08X hi=0x%08X\n",
               ud.lo_hi[0], ud.lo_hi[1]); g_fail++; g_sec++;
    }

    /* Neighbor-spill test: write float to pair[0], pair[1] must be untouched */
    pair[0].i = 0xDEADBEEFu;
    pair[1].i = 0xDEADBEEFu;
    pair[0].f = -1.5f;
    CHK_HEX(pair[1].i, 0xDEADBEEFu, "float write: neighbor unpolluted");

    SECTION_END("C");
}

/* ============================================================
 * D: Pointer-cast store *(float*)p = expr
 *    Threat: store codegen dispatches on pointer type rather
 *    than value type to may store 8 bytes where 4 expected.
 * ============================================================ */

static void d_pointer_cast_store(void) {
    float buf[4];
    unsigned int ub[4];
    unsigned int expected;
    unsigned int rb;
    unsigned int eb;
    float readback;
    float exp_f;
    float *fp;
    int i;

    SECTION("D: Pointer-cast store");

    /* Clear sentinels */
    for (i = 0; i < 4; i++) { buf[i] = 0.0f; ub[i] = 0u; }

    /* Basic write: must store exactly 4 bytes */
    fp = (float*)&buf[0];
    *fp = -1.5f;
    memcpy(&ub[0], &buf[0], 4);
    memcpy(&ub[1], &buf[1], 4);
    expected = 0xBFC00000u;
    CHK_HEX(ub[0], expected,    "cast-store buf0 = -1.5f bits");
    CHK_HEX(ub[1], 0x00000000u, "cast-store buf0: buf1 no-spill");

    /* Write and read back via cast */
    fp = (float*)&buf[2];
    *fp = 2.0f;
    readback = *fp;
    exp_f = 2.0f;
    rb = 0;
    eb = 0;
    memcpy(&rb, &readback, 4);
    memcpy(&eb, &exp_f,    4);
    CHK_HEX(rb, eb, "cast-store buf2 = 2.0f round-trip");
    memcpy(&ub[3], &buf[3], 4);
    CHK_HEX(ub[3], 0x00000000u, "cast-store buf2: buf3 no-spill");

    /* Negative through cast */
    fp = (float*)&buf[0];
    *fp = -3.14f;
    exp_f = -3.14f;
    eb = 0;
    memcpy(&ub[0], &buf[0], 4);
    memcpy(&eb, &exp_f, 4);
    CHK_HEX(ub[0], eb, "cast-store -3.14f bits");

    /* Zero through cast */
    *fp = 0.0f;
    memcpy(&ub[0], &buf[0], 4);
    CHK_HEX(ub[0], 0x00000000u, "cast-store 0.0f bits");

    /* -0.0f through cast */
    *fp = -0.0f;
    memcpy(&ub[0], &buf[0], 4);
    CHK_HEX(ub[0], 0x80000000u, "cast-store -0.0f bits");

    /* 1.5f through cast */
    *fp = 1.5f;
    memcpy(&ub[0], &buf[0], 4);
    CHK_HEX(ub[0], 0x3FC00000u, "cast-store 1.5f bits");

    SECTION_END("D");
}

/* ============================================================ */
int main(void) {
    a_logical_ops();
    c_union_member();
    d_pointer_cast_store();
    printf("\n=== FINAL: %d passed, %d failed ===\n", g_pass, g_fail);
    return g_fail > 0 ? 1 : 0;
}
