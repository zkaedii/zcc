#include <stdio.h>

/* probe_float_cmp.c -- Float comparison operator probe
 * ERR-0028 status: ORACLE-VERIFIED (functions return float, intentional)
 * Run: diff <(gcc -O0 probe_float_cmp.c -o /tmp/fc.gcc && /tmp/fc.gcc) \
 *           <(./zcc probe_float_cmp.c -o /tmp/fc.s && gcc -fno-pie -no-pie -O0 /tmp/fc.s -o /tmp/fc.zcc && /tmp/fc.zcc)
 */

static int f_lt(float a, float b)  { return a < b;  }
static int f_gt(float a, float b)  { return a > b;  }
static int f_le(float a, float b)  { return a <= b; }
static int f_ge(float a, float b)  { return a >= b; }
static int f_eq(float a, float b)  { return a == b; }
static int f_ne(float a, float b)  { return a != b; }

static int d_lt(double a, double b) { return a < b;  }
static int d_gt(double a, double b) { return a > b;  }
static int d_le(double a, double b) { return a <= b; }
static int d_ge(double a, double b) { return a >= b; }
static int d_eq(double a, double b) { return a == b; }
static int d_ne(double a, double b) { return a != b; }

/* Mixed: float compared to float literal (may widen) */
static int f_lt_lit(float a) { return a < 0.0f;  }
static int f_gt_lit(float a) { return a > 0.0f;  }
static int f_eq_lit(float a) { return a == 1.5f; }

/* Float in if/while condition */
static int f_if_nonzero(float a) { if (a) return 1; return 0; }
static int f_ternary(float a, float b) { return a < b ? 1 : 0; }

int main(void) {
    int pass = 0;
    int fail = 0;

#define CHK(expr, expected, label) \
    do { int _got = (expr); \
         if (_got == (expected)) { printf("[PASS] %s\n", label); pass++; } \
         else { printf("[FAIL] %s  expected=%d got=%d\n", label, expected, _got); fail++; } \
    } while(0)

    /* --- float comparisons --- */
    CHK(f_lt(1.0f, 2.0f),  1, "float: 1.0 < 2.0");
    CHK(f_lt(2.0f, 1.0f),  0, "float: 2.0 < 1.0");
    CHK(f_lt(1.0f, 1.0f),  0, "float: 1.0 < 1.0 (eq)");
    CHK(f_gt(2.0f, 1.0f),  1, "float: 2.0 > 1.0");
    CHK(f_gt(1.0f, 2.0f),  0, "float: 1.0 > 2.0");
    CHK(f_le(1.0f, 2.0f),  1, "float: 1.0 <= 2.0");
    CHK(f_le(1.0f, 1.0f),  1, "float: 1.0 <= 1.0");
    CHK(f_le(2.0f, 1.0f),  0, "float: 2.0 <= 1.0");
    CHK(f_ge(2.0f, 1.0f),  1, "float: 2.0 >= 1.0");
    CHK(f_ge(1.0f, 1.0f),  1, "float: 1.0 >= 1.0");
    CHK(f_ge(1.0f, 2.0f),  0, "float: 1.0 >= 2.0");
    CHK(f_eq(1.5f, 1.5f),  1, "float: 1.5 == 1.5");
    CHK(f_eq(1.5f, 1.0f),  0, "float: 1.5 == 1.0");
    CHK(f_ne(1.5f, 1.0f),  1, "float: 1.5 != 1.0");
    CHK(f_ne(1.5f, 1.5f),  0, "float: 1.5 != 1.5");

    /* --- negative float comparisons --- */
    CHK(f_lt(-1.0f, 0.0f),  1, "float: -1.0 < 0.0");
    CHK(f_gt(-1.0f, 0.0f),  0, "float: -1.0 > 0.0");
    CHK(f_lt(-2.0f, -1.0f), 1, "float: -2.0 < -1.0");
    CHK(f_gt(-1.0f, -2.0f), 1, "float: -1.0 > -2.0");

    /* --- double comparisons --- */
    CHK(d_lt(1.0, 2.0),  1, "double: 1.0 < 2.0");
    CHK(d_gt(2.0, 1.0),  1, "double: 2.0 > 1.0");
    CHK(d_le(1.0, 1.0),  1, "double: 1.0 <= 1.0");
    CHK(d_ge(1.0, 1.0),  1, "double: 1.0 >= 1.0");
    CHK(d_eq(1.5, 1.5),  1, "double: 1.5 == 1.5");
    CHK(d_ne(1.5, 1.0),  1, "double: 1.5 != 1.0");
    CHK(d_lt(-2.0, -1.0), 1, "double: -2.0 < -1.0");

    /* --- float literal comparisons --- */
    CHK(f_lt_lit(-0.5f), 1, "float: -0.5 < 0.0f");
    CHK(f_lt_lit(0.5f),  0, "float: 0.5 < 0.0f");
    CHK(f_gt_lit(0.5f),  1, "float: 0.5 > 0.0f");
    CHK(f_gt_lit(-0.5f), 0, "float: -0.5 > 0.0f");
    CHK(f_eq_lit(1.5f),  1, "float: 1.5 == 1.5f");
    CHK(f_eq_lit(1.0f),  0, "float: 1.0 == 1.5f");

    /* --- float in boolean context --- */
    CHK(f_if_nonzero(1.0f),  1, "float: if(1.0f)");
    CHK(f_if_nonzero(0.0f),  0, "float: if(0.0f)");
    CHK(f_if_nonzero(-1.0f), 1, "float: if(-1.0f)");
    CHK(f_ternary(1.0f, 2.0f), 1, "float: 1.0f < 2.0f ? 1:0");
    CHK(f_ternary(2.0f, 1.0f), 0, "float: 2.0f < 1.0f ? 1:0");

    printf("\n=== RESULTS: %d passed, %d failed ===\n", pass, fail);
    return fail > 0 ? 1 : 0;
}
