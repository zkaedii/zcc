/*
 * probe_neg_zero_truth.c -- CG-FLOAT-012 family scope check
 *
 * Tests whether !float, f&&g, f||g all share the same broken
 * integer-bitwise truth test, or just !float alone.
 *
 * All operands use -0.0f which IEEE says equals 0.0f.
 * The bug: ZCC loads float bits as int, cmp eax,0 sees 0x80000000 != 0.
 *
 * Oracle: gcc -O0 -w probe_neg_zero_truth.c -o /tmp/nz.gcc
 *         ./zcc probe_neg_zero_truth.c -o /tmp/nz.s
 *         gcc -fno-pie -no-pie -O0 -w /tmp/nz.s -o /tmp/nz.zcc
 *         diff <(/tmp/nz.gcc) <(/tmp/nz.zcc)
 */
#include <stdio.h>

static int g_pass = 0;
static int g_fail = 0;

#define CHK(got, expected, label) \
    do { int _g=(int)(got); int _e=(int)(expected); \
         if (_g==_e) { printf("[PASS] %s\n",(label)); g_pass++; } \
         else { printf("[FAIL] %s  expected=%d got=%d\n",(label),_e,_g); \
                g_fail++; } } while(0)

/* Helpers force the truth test to go through codegen, not constant-fold */
static int f_not(float a)          { return !a; }
static int f_and(float a, float b) { return a && b; }
static int f_or(float a, float b)  { return a || b; }
static int f_if(float a)           { if (a) return 1; return 0; }

int main(void) {
    float neg_zero;
    float pos_one;
    float pos_zero;

    neg_zero = -0.0f;   /* 0x80000000 -- IEEE zero, but sign bit set */
    pos_one  =  1.0f;
    pos_zero =  0.0f;

    printf("=== CG-FLOAT-012 family: -0.0f truth test ===\n");
    printf("  neg_zero bits should be 0x80000000, value == 0.0f\n\n");

    /* !(-0.0f) must be 1 because -0.0 == 0.0 per IEEE */
    CHK(f_not(neg_zero), 1, "!(-0.0f) == 1");

    /* (-0.0f) && 1.0f must be 0 (-0.0f is falsy) */
    CHK(f_and(neg_zero, pos_one), 0, "(-0.0f) && 1.0f == 0");

    /* (-0.0f) || 0.0f must be 0 (both falsy) */
    CHK(f_or(neg_zero, pos_zero), 0, "(-0.0f) || 0.0f == 0");

    /* (-0.0f) || 1.0f must be 1 (second operand truthy) */
    CHK(f_or(neg_zero, pos_one), 1, "(-0.0f) || 1.0f == 1");

    /* if (-0.0f) branch must NOT be taken */
    CHK(f_if(neg_zero), 0, "if(-0.0f) not taken");

    printf("\n=== Positive control: these must all pass regardless ===\n");
    CHK(f_not(pos_zero), 1,  "!(0.0f) == 1");
    CHK(f_not(pos_one),  0,  "!(1.0f) == 0");
    CHK(f_and(pos_one, pos_one), 1, "1.0f && 1.0f == 1");
    CHK(f_or(pos_zero, pos_zero), 0, "0.0f || 0.0f == 0");
    CHK(f_if(pos_one),   1, "if(1.0f) taken");
    CHK(f_if(pos_zero),  0, "if(0.0f) not taken");

    printf("\n=== FINAL: %d passed, %d failed ===\n", g_pass, g_fail);
    return g_fail > 0 ? 1 : 0;
}
