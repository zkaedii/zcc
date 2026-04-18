/*
 * probe_unproved_quick.c -- Clears two cheap rows from the § 10 gap table:
 *   (A) double ++/-- (all 4 forms)
 *   (B) ternary with float branches, negative taken path
 *
 * Oracle-first. diff must be empty.
 * ERR-0028: float/double-returning helpers — oracle-verified, intentional.
 */
#include <stdio.h>
#include <string.h>

static int g_pass = 0;
static int g_fail = 0;

#define CHK_D(got, expected, label) \
    do { double _g=(double)(got), _e=(double)(expected); \
         unsigned long _gb=0, _eb=0; \
         memcpy(&_gb,&_g,8); memcpy(&_eb,&_e,8); \
         if (_gb==_eb) { printf("[PASS] %s = %.10f\n",(label),_g); g_pass++; } \
         else { printf("[FAIL] %s  expect=%.10f(0x%016lX) got=%.10f(0x%016lX)\n", \
                (label),_e,_eb,_g,_gb); g_fail++; } } while(0)

#define CHK_F(got, expected, label) \
    do { float _g=(float)(got), _e=(float)(expected); \
         unsigned int _gb=0, _eb=0; \
         memcpy(&_gb,&_g,4); memcpy(&_eb,&_e,4); \
         if (_gb==_eb) { printf("[PASS] %s = %.10f\n",(label),(double)_g); g_pass++; } \
         else { printf("[FAIL] %s  expect=%.10f(0x%08X) got=%.10f(0x%08X)\n", \
                (label),(double)_e,_eb,(double)_g,_gb); g_fail++; } } while(0)

/* ── (A) double ++/-- ─────────────────────────────────────────────────── */
static void a_double_incr_decr(void) {
    double x;
    double y;
    int count;

    printf("\n=== A: double ++/-- ===\n");

    /* prefix ++ */
    x = 1.5;
    ++x;
    CHK_D(x, 2.5, "prefix++ 1.5 -> 2.5");

    x = -1.5;
    ++x;
    CHK_D(x, -0.5, "prefix++ -1.5 -> -0.5");

    /* prefix -- */
    x = 2.5;
    --x;
    CHK_D(x, 1.5, "prefix-- 2.5 -> 1.5");

    x = 0.5;
    --x;
    CHK_D(x, -0.5, "prefix-- 0.5 -> -0.5");

    /* postfix ++ */
    x = 1.5;
    y = x++;
    CHK_D(y, 1.5, "postfix++ returns old (1.5)");
    CHK_D(x, 2.5, "postfix++ increments to 2.5");

    x = -0.5;
    y = x++;
    CHK_D(y, -0.5, "postfix++ returns old (-0.5)");
    CHK_D(x,  0.5, "postfix++ increments -0.5 -> 0.5");

    /* postfix -- */
    x = 2.5;
    y = x--;
    CHK_D(y, 2.5, "postfix-- returns old (2.5)");
    CHK_D(x, 1.5, "postfix-- decrements to 1.5");

    x = 0.5;
    y = x--;
    CHK_D(y,  0.5, "postfix-- returns old (0.5)");
    CHK_D(x, -0.5, "postfix-- decrements 0.5 -> -0.5");

    /* loop via postfix -- going negative */
    x = 2.0;
    count = 0;
    while (x-- > -1.0) {
        count++;
    }
    /* postfix x-- evaluates old value for comparison:
     * iter1: 2.0 > -1.0 yes → count=1, x=1.0
     * iter2: 1.0 > -1.0 yes → count=2, x=0.0
     * iter3: 0.0 > -1.0 yes → count=3, x=-1.0
     * iter4: -1.0 > -1.0 NO  → exits. 3 iterations. */
    if (count == 3) { printf("[PASS] while(x-- > -1.0) count=3\n"); g_pass++; }
    else            { printf("[FAIL] while(x-- > -1.0) expected=3 got=%d\n", count); g_fail++; }

    /* prefix in expression context */
    x = 1.0;
    if (++x > 1.5) { printf("[PASS] (++1.0 > 1.5) == true\n"); g_pass++; }
    else           { printf("[FAIL] (++1.0 > 1.5) should be true\n"); g_fail++; }
}

/* ── (B) ternary with float branches, negative values ────────────────── */
static float f_ternary_neg(int cond) {
    return cond ? -0.1f : 0.2f;   /* negative taken path */
}
static float f_ternary_pos(int cond) {
    return cond ? 0.2f : -0.1f;   /* negative not-taken path */
}
static double d_ternary_neg(int cond) {
    return cond ? -1.5 : 2.0;
}
static float f_ternary_both_neg(int cond) {
    return cond ? -1.0f : -2.0f;  /* both branches negative */
}

/* Direct inline ternary (not via function) */
static void b_ternary_float_branches(void) {
    float r_f;
    double r_d;
    int cond;

    printf("\n=== B: ternary with float branches ===\n");

    /* Taken path is negative float */
    r_f = f_ternary_neg(1);
    CHK_F(r_f, -0.1f, "cond=1 ? -0.1f : 0.2f  [negative taken]");

    /* Not-taken path is negative float */
    r_f = f_ternary_neg(0);
    CHK_F(r_f,  0.2f, "cond=0 ? -0.1f : 0.2f  [positive taken]");

    r_f = f_ternary_pos(1);
    CHK_F(r_f,  0.2f, "cond=1 ? 0.2f : -0.1f  [positive taken]");

    r_f = f_ternary_pos(0);
    CHK_F(r_f, -0.1f, "cond=0 ? 0.2f : -0.1f  [negative not-taken]");

    /* Both branches negative */
    r_f = f_ternary_both_neg(1);
    CHK_F(r_f, -1.0f, "cond=1 ? -1.0f : -2.0f");

    r_f = f_ternary_both_neg(0);
    CHK_F(r_f, -2.0f, "cond=0 ? -1.0f : -2.0f");

    /* Double ternary */
    r_d = d_ternary_neg(1);
    CHK_D(r_d, -1.5, "cond=1 ? -1.5 : 2.0  [neg double taken]");

    r_d = d_ternary_neg(0);
    CHK_D(r_d,  2.0, "cond=0 ? -1.5 : 2.0  [pos double taken]");

    /* Direct (inline) ternary — not via function call */
    cond = 1;
    r_f = cond ? -1.5f : 2.0f;
    CHK_F(r_f, -1.5f, "inline: cond=1 ? -1.5f : 2.0f");

    cond = 0;
    r_f = cond ? -1.5f : 2.0f;
    CHK_F(r_f,  2.0f, "inline: cond=0 ? -1.5f : 2.0f");

    /* Ternary as expression in arithmetic */
    {
        float a;
        float b;
        a = (1 ? -1.0f : 2.0f) + 0.5f;   /* -1.0 + 0.5 = -0.5 */
        CHK_F(a, -0.5f, "(-1.0f ternary) + 0.5f = -0.5f");

        b = (0 ? -1.0f : 2.0f) * -1.0f;  /* 2.0 * -1.0 = -2.0 */
        CHK_F(b, -2.0f, "(2.0f ternary) * -1.0f = -2.0f");
    }
}

int main(void) {
    a_double_incr_decr();
    b_ternary_float_branches();
    printf("\n=== FINAL: %d passed, %d failed ===\n", g_pass, g_fail);
    return g_fail > 0 ? 1 : 0;
}
