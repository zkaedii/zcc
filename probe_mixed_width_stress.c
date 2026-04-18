/*
 * probe_mixed_width_stress.c -- T7 stress extension: mixed float/double
 * focusing on sign-bit preservation when float operand is widened to double.
 *
 * Threat model (from session analysis):
 *   If the mixed-width codegen path loads a float operand via movq (8-byte)
 *   before the double arithmetic, then -1.5f (0xBFC00000) zero-extends to
 *   0x00000000BFC00000 — a tiny positive denorm double — and every result
 *   involving a negative float operand would have wrong sign.
 *   The CG-FLOAT-010 and CG-FLOAT-011 bugs both had exactly this shape.
 *
 * Oracle-first: diff <(gcc -O0 -w probe_mixed_width_stress.c && ./a.out) \
 *                    <(./zcc probe_mixed_width_stress.c -o /tmp/m.s && \
 *                      gcc -fno-pie -no-pie -O0 /tmp/m.s && ./a.out)
 */
#include <stdio.h>
#include <string.h>

static int g_pass = 0;
static int g_fail = 0;

#define CHK_D(expr, expected, label) \
    do { \
        double _g = (double)(expr); \
        double _e = (double)(expected); \
        unsigned long _gb; unsigned long _eb; \
        memcpy(&_gb, &_g, 8); memcpy(&_eb, &_e, 8); \
        if (_gb == _eb) { \
            printf("[PASS] %s = %.10f\n", (label), _g); g_pass++; \
        } else { \
            printf("[FAIL] %s  expected=%.10f (0x%016lX)  got=%.10f (0x%016lX)\n", \
                   (label), _e, _eb, _g, _gb); g_fail++; \
        } \
    } while(0)

#define CHK_I(expr, expected, label) \
    do { int _g=(int)(expr), _e=(int)(expected); \
         if (_g==_e) { printf("[PASS] %s\n",(label)); g_pass++; } \
         else { printf("[FAIL] %s  expected=%d got=%d\n",(label),_e,_g); g_fail++; } \
    } while(0)

/* All arithmetic: float operand, double operand, double result */
static double fd_add(float a, double b) { return a + b; }
static double fd_sub(float a, double b) { return a - b; }
static double fd_mul(float a, double b) { return a * b; }
static double fd_div(float a, double b) { return a / b; }

/* Reversed: double first, float second */
static double df_add(double a, float b)  { return a + b; }
static double df_sub(double a, float b)  { return a - b; }
static double df_mul(double a, float b)  { return a * b; }
static double df_div(double a, float b)  { return a / b; }

/* Mixed comparisons: all 6 operators, neg float/neg double */
static int fd_lt(float a, double b) { return a < b; }
static int fd_gt(float a, double b) { return a > b; }
static int fd_le(float a, double b) { return a <= b; }
static int fd_ge(float a, double b) { return a >= b; }
static int fd_eq(float a, double b) { return a == b; }
static int fd_ne(float a, double b) { return a != b; }
static int df_lt(double a, float b) { return a < b; }
static int df_gt(double a, float b) { return a > b; }

/* The canonical pressure case from session analysis */
static double canonical(void) { return -1.5f * 2.0; }  /* must be -3.0 */

int main(void) {
    printf("=== T7-STRESS: Mixed float/double sign-bit preservation ===\n\n");

    /* Key diagnostic: if float loaded via movq before widening, all
     * negative-float results will be wrong sign. */
    CHK_D(canonical(), -3.0, "-1.5f * 2.0 == -3.0");

    printf("\n--- Arithmetic: negative float op positive double ---\n");
    CHK_D(fd_add(-1.5f,  2.0),  0.5, "(-1.5f) + 2.0");
    CHK_D(fd_add(-2.0f,  1.0),  -1.0, "(-2.0f) + 1.0");
    CHK_D(fd_sub(-1.5f,  1.0),  -2.5, "(-1.5f) - 1.0");
    CHK_D(fd_sub(-1.0f, -2.0),   1.0, "(-1.0f) - (-2.0)");
    CHK_D(fd_mul(-1.5f,  2.0),  -3.0, "(-1.5f) * 2.0");
    CHK_D(fd_mul(-2.0f, -3.0),   6.0, "(-2.0f) * (-3.0)");
    CHK_D(fd_mul(-1.0f,  1.0),  -1.0, "(-1.0f) * 1.0");
    CHK_D(fd_div(-4.0f,  2.0),  -2.0, "(-4.0f) / 2.0");
    CHK_D(fd_div(-3.0f, -1.0),   3.0, "(-3.0f) / (-1.0)");

    printf("\n--- Arithmetic: positive float op negative double ---\n");
    CHK_D(fd_add( 1.5f, -2.0),  -0.5, "1.5f + (-2.0)");
    CHK_D(fd_sub( 1.0f, -2.0),   3.0, "1.0f - (-2.0)");
    CHK_D(fd_mul( 2.0f, -3.0),  -6.0, "2.0f * (-3.0)");
    CHK_D(fd_div( 4.0f, -2.0),  -2.0, "4.0f / (-2.0)");

    printf("\n--- Arithmetic: double first, negative float second ---\n");
    CHK_D(df_add( 2.0, -1.5f),   0.5, "2.0 + (-1.5f)");
    CHK_D(df_sub( 1.0, -1.0f),   2.0, "1.0 - (-1.0f)");
    CHK_D(df_mul( 3.0, -2.0f),  -6.0, "3.0 * (-2.0f)");
    CHK_D(df_div(-4.0, -2.0f),   2.0, "(-4.0) / (-2.0f)");
    CHK_D(df_mul(-1.0, -1.5f),   1.5, "(-1.0) * (-1.5f)");

    printf("\n--- Comparisons: negative float vs double ---\n");
    CHK_I(fd_lt(-1.5f,  0.0),  1, "(-1.5f) < 0.0");
    CHK_I(fd_gt(-1.5f,  0.0),  0, "(-1.5f) > 0.0");
    CHK_I(fd_lt(-1.5f, -1.0),  1, "(-1.5f) < (-1.0)");
    CHK_I(fd_gt(-0.5f, -1.0),  1, "(-0.5f) > (-1.0)");
    CHK_I(fd_le(-2.0f, -2.0),  1, "(-2.0f) <= (-2.0)");
    CHK_I(fd_ge(-2.0f, -2.0),  1, "(-2.0f) >= (-2.0)");
    CHK_I(fd_eq(-1.5f, -1.5),  1, "(-1.5f) == (-1.5)");
    CHK_I(fd_ne(-1.5f, -1.0),  1, "(-1.5f) != (-1.0)");
    CHK_I(df_lt(-2.0, -1.5f),  1, "(-2.0) < (-1.5f)");
    CHK_I(df_gt(-1.5f, -2.0),  1, "(-1.5f) > (-2.0) [df path]");

    printf("\n--- Extreme magnitude: very large / very small ---\n");
    {
        float  large_f = 3.4028235e+38f;  /* near FLT_MAX */
        double small_d = 1.0e-300;        /* near double subnormal boundary */
        CHK_D(df_mul(-1.0, large_f),  (double)(-large_f), "(-1.0) * FLT_MAX_f sign");
        CHK_I(fd_lt(-large_f, 0.0),   1, "(-FLT_MAX_f) < 0.0");
        CHK_I(fd_gt( large_f, 0.0),   1, "FLT_MAX_f > 0.0");
        CHK_I(fd_lt(-large_f, small_d), 1, "(-FLT_MAX_f) < 1e-300");
    }

    /* Inline mixed-width (not via function call — direct expression path) */
    printf("\n--- Direct (inline) mixed-width expressions ---\n");
    {
        float  f = -1.5f;
        double d =  2.0;
        double r;
        r = f * d;
        CHK_D(r, -3.0, "inline: (-1.5f) * 2.0");
        r = d + f;
        CHK_D(r,  0.5, "inline: 2.0 + (-1.5f)");
        r = f / d;
        CHK_D(r, -0.75, "inline: (-1.5f) / 2.0");
    }

    printf("\n=== RESULTS: %d passed, %d failed ===\n", g_pass, g_fail);
    return g_fail > 0 ? 1 : 0;
}
