/*
 * probe_float_cmp_v2.c -- Float operator surface probe (comprehensive)
 *
 * Seams covered (vs v1):
 *   T1: All 6 comparison operators, float and double          (v1)
 *   T2: Negative operands in all 6 ops                       (v1, 6 failures caught CG-FLOAT-010)
 *   T3: Literal comparisons (a < 0.0f, a == 1.5f)           (v1)
 *   T4: Float in boolean context via function call            (v1)
 *   NEW T5:  Float directly in if/while/for condition (not wrapped)
 *   NEW T6:  Float unary ++/-- prefix and postfix
 *   NEW T7:  Mixed float+double in binary/comparison expr
 *   NEW T8:  Float in struct member access + comparison
 *   NEW T9:  Float as function argument promoted from literal
 *   NEW T10: Exhaustive sign x magnitude matrix (16 pairs)
 *   NEW T11: Special values: +0.0f, -0.0f, FLT_MAX, small denormal proxy
 *   NEW T12: Float in while/for loop accumulation (compound assign seam)
 *
 * Oracle-first methodology (ZCC_TEST_STANDARDS.md S2):
 *   gcc -O0 -w probe_float_cmp_v2.c -o /tmp/fcv2.gcc
 *   ./zcc probe_float_cmp_v2.c -o /tmp/fcv2.s
 *   gcc -fno-pie -no-pie -O0 -w /tmp/fcv2.s -o /tmp/fcv2.zcc
 *   diff <(/tmp/fcv2.gcc) <(/tmp/fcv2.zcc) && echo PASS
 *
 * ERR-0028: float-returning helpers are oracle-verified (intentional seam exercise)
 * ERR-0030: printf only, no fprintf(stderr)
 * ERR-0031: no epsilon; oracle diff is the truth source
 */
#include <stdio.h>
#include <string.h>

/* ── Counters ────────────────────────────────────────────────────────────── */
static int g_pass = 0;
static int g_fail = 0;
static int g_section_fail = 0;

#define CHK(expr, expected, label) \
    do { \
        int _g = (int)(expr); \
        int _e = (int)(expected); \
        if (_g == _e) { \
            printf("[PASS] %s\n", (label)); \
            g_pass++; \
        } else { \
            printf("[FAIL] %s  expected=%d got=%d\n", (label), _e, _g); \
            g_fail++; g_section_fail++; \
        } \
    } while(0)

/* Print decimal with enough digits to expose 1-ULP difference.
 * The oracle diff will catch any mismatch.  */
#define PRT_F(val, label) \
    printf("  [VAL] %-40s %.10f\n", (label), (double)(val))

#define SECTION(name) \
    do { g_section_fail = 0; \
         printf("\n=== %s ===\n", (name)); } while(0)

#define SECTION_END(name) \
    do { if (g_section_fail == 0) \
             printf("  [OK] %s clean\n", (name)); } while(0)

/* ── T1: Comparison operators, positive operands ────────────────────────── */
static int f_lt(float a, float b)  { return a < b;  }
static int f_gt(float a, float b)  { return a > b;  }
static int f_le(float a, float b)  { return a <= b; }
static int f_ge(float a, float b)  { return a >= b; }
static int f_eq(float a, float b)  { return a == b; }
static int f_ne(float a, float b)  { return a != b; }
static int d_lt(double a, double b) { return a < b; }
static int d_gt(double a, double b) { return a > b; }
static int d_le(double a, double b) { return a <= b; }
static int d_ge(double a, double b) { return a >= b; }
static int d_eq(double a, double b) { return a == b; }
static int d_ne(double a, double b) { return a != b; }

static void t1_basic_comparisons(void) {
    SECTION("T1: Basic comparisons (positive operands)");
    CHK(f_lt(1.0f, 2.0f),  1, "float 1.0 < 2.0");
    CHK(f_lt(2.0f, 1.0f),  0, "float 2.0 < 1.0");
    CHK(f_lt(1.0f, 1.0f),  0, "float 1.0 < 1.0");
    CHK(f_gt(2.0f, 1.0f),  1, "float 2.0 > 1.0");
    CHK(f_gt(1.0f, 2.0f),  0, "float 1.0 > 2.0");
    CHK(f_le(1.0f, 2.0f),  1, "float 1.0 <= 2.0");
    CHK(f_le(1.0f, 1.0f),  1, "float 1.0 <= 1.0");
    CHK(f_le(2.0f, 1.0f),  0, "float 2.0 <= 1.0");
    CHK(f_ge(2.0f, 1.0f),  1, "float 2.0 >= 1.0");
    CHK(f_ge(1.0f, 1.0f),  1, "float 1.0 >= 1.0");
    CHK(f_ge(1.0f, 2.0f),  0, "float 1.0 >= 2.0");
    CHK(f_eq(1.5f, 1.5f),  1, "float 1.5 == 1.5");
    CHK(f_eq(1.5f, 1.0f),  0, "float 1.5 == 1.0");
    CHK(f_ne(1.5f, 1.0f),  1, "float 1.5 != 1.0");
    CHK(f_ne(1.5f, 1.5f),  0, "float 1.5 != 1.5");
    CHK(d_lt(1.0, 2.0),    1, "double 1.0 < 2.0");
    CHK(d_gt(2.0, 1.0),    1, "double 2.0 > 1.0");
    CHK(d_le(1.0, 1.0),    1, "double 1.0 <= 1.0");
    CHK(d_ge(1.0, 1.0),    1, "double 1.0 >= 1.0");
    CHK(d_eq(1.5, 1.5),    1, "double 1.5 == 1.5");
    CHK(d_ne(1.5, 1.0),    1, "double 1.5 != 1.0");
    SECTION_END("T1");
}

/* ── T2: Negative operands (killed CG-FLOAT-010) ───────────────────────── */
static void t2_negative_operands(void) {
    SECTION("T2: Negative operands");
    CHK(f_lt(-1.0f, 0.0f),   1, "float -1.0 < 0.0");
    CHK(f_gt(-1.0f, 0.0f),   0, "float -1.0 > 0.0");
    CHK(f_lt(-2.0f, -1.0f),  1, "float -2.0 < -1.0");
    CHK(f_gt(-1.0f, -2.0f),  1, "float -1.0 > -2.0");
    CHK(f_le(-1.0f, -1.0f),  1, "float -1.0 <= -1.0");
    CHK(f_ge(-1.0f, -1.0f),  1, "float -1.0 >= -1.0");
    CHK(f_le(-1.0f,  0.0f),  1, "float -1.0 <= 0.0");
    CHK(f_ge( 0.0f, -1.0f),  1, "float 0.0 >= -1.0");
    CHK(f_eq(-1.5f, -1.5f),  1, "float -1.5 == -1.5");
    CHK(f_ne(-1.5f, -1.0f),  1, "float -1.5 != -1.0");
    CHK(d_lt(-2.0, -1.0),    1, "double -2.0 < -1.0");
    CHK(d_gt(-1.0, -2.0),    1, "double -1.0 > -2.0");
    CHK(d_le(-1.0, -1.0),    1, "double -1.0 <= -1.0");
    SECTION_END("T2");
}

/* ── T3: Literal comparisons ────────────────────────────────────────────── */
static int f_lt_zero(float a)  { return a < 0.0f; }
static int f_gt_zero(float a)  { return a > 0.0f; }
static int f_le_zero(float a)  { return a <= 0.0f; }
static int f_ge_zero(float a)  { return a >= 0.0f; }
static int f_eq_lit(float a)   { return a == 1.5f; }
static int f_ne_zero(float a)  { return a != 0.0f; }

static void t3_literal_comparisons(void) {
    SECTION("T3: Literal comparisons");
    CHK(f_lt_zero(-0.5f),  1, "float -0.5 < 0.0f");
    CHK(f_lt_zero( 0.5f),  0, "float  0.5 < 0.0f");
    CHK(f_lt_zero( 0.0f),  0, "float  0.0 < 0.0f");
    CHK(f_gt_zero( 0.5f),  1, "float  0.5 > 0.0f");
    CHK(f_gt_zero(-0.5f),  0, "float -0.5 > 0.0f");
    CHK(f_le_zero( 0.0f),  1, "float  0.0 <= 0.0f");
    CHK(f_le_zero(-0.1f),  1, "float -0.1 <= 0.0f");
    CHK(f_ge_zero( 0.0f),  1, "float  0.0 >= 0.0f");
    CHK(f_ge_zero(-0.1f),  0, "float -0.1 >= 0.0f");
    CHK(f_eq_lit(1.5f),    1, "float  1.5 == 1.5f");
    CHK(f_eq_lit(1.0f),    0, "float  1.0 == 1.5f");
    CHK(f_ne_zero(1.0f),   1, "float  1.0 != 0.0f");
    CHK(f_ne_zero(0.0f),   0, "float  0.0 != 0.0f");
    SECTION_END("T3");
}

/* ── T4: Boolean context via function call (v1 baseline) ────────────────── */
static int f_bool_fn(float a)         { if (a) return 1; return 0; }
static int f_ternary(float a, float b) { return a < b ? 1 : 0; }

static void t4_bool_via_call(void) {
    SECTION("T4: Boolean context via function call");
    CHK(f_bool_fn( 1.0f),  1, "if(1.0f)");
    CHK(f_bool_fn( 0.0f),  0, "if(0.0f)");
    CHK(f_bool_fn(-1.0f),  1, "if(-1.0f)");
    CHK(f_bool_fn( 0.5f),  1, "if(0.5f)");
    CHK(f_bool_fn(-0.5f),  1, "if(-0.5f)");
    CHK(f_ternary(1.0f, 2.0f), 1, "1.0f < 2.0f ? 1:0");
    CHK(f_ternary(2.0f, 1.0f), 0, "2.0f < 1.0f ? 1:0");
    CHK(f_ternary(-1.0f, 0.0f), 1, "-1.0f < 0.0f ? 1:0");
    SECTION_END("T4");
}

/* ── T5: Float directly in control-flow condition (NEW) ─────────────────── */
/* These go through the AST condition path, not a function-call wrapper.
 * Distinct codepath from T4 — the condition is inlined at the if/while/for node. */
static void t5_direct_control_flow(void) {
    float x;
    int r;
    SECTION("T5: Direct control-flow conditions (not via function call)");

    /* if (float_var) */
    x = 1.5f;
    if (x) r = 1; else r = 0;
    CHK(r, 1, "if(1.5f) direct");

    x = 0.0f;
    if (x) r = 1; else r = 0;
    CHK(r, 0, "if(0.0f) direct");

    x = -1.5f;
    if (x) r = 1; else r = 0;
    CHK(r, 1, "if(-1.5f) direct");

    /* if (float_var < float_var) */
    {
        float a;
        float b;
        a = -2.0f;
        b = -1.0f;
        if (a < b) r = 1; else r = 0;
        CHK(r, 1, "if (-2.0f < -1.0f) direct");
        if (b < a) r = 1; else r = 0;
        CHK(r, 0, "if (-1.0f < -2.0f) direct");
        if (a > b) r = 1; else r = 0;
        CHK(r, 0, "if (-2.0f > -1.0f) direct");
    }

    /* while loop counting via float condition */
    {
        float f;
        int count;
        f = 0.0f;
        count = 0;
        while (f < 3.0f) {
            count++;
            f = f + 1.0f;
        }
        CHK(count, 3, "while(f < 3.0f) loop count");
    }

    /* for loop counting via float condition */
    {
        float f;
        int count;
        count = 0;
        for (f = -2.0f; f <= 2.0f; f = f + 1.0f) {
            count++;
        }
        CHK(count, 5, "for(f=-2..2) loop count");
    }

    /* Nested: for with inner if on float comparison */
    {
        float f;
        int neg_count;
        neg_count = 0;
        for (f = -3.0f; f <= 3.0f; f = f + 1.0f) {
            if (f < 0.0f) {
                neg_count++;
            }
        }
        CHK(neg_count, 3, "count negatives in [-3..3]");
    }
    SECTION_END("T5");
}

/* ── T6: Unary ++/-- on float (NEW) ─────────────────────────────────────── */
static void t6_unary_increment(void) {
    float x;
    float y;
    int r;
    SECTION("T6: Float unary ++/-- (prefix and postfix)");

    /* prefix ++ */
    x = 1.5f;
    ++x;
    CHK(f_eq(x, 2.5f), 1, "prefix++ 1.5 -> 2.5");

    x = -1.5f;
    ++x;
    CHK(f_eq(x, -0.5f), 1, "prefix++ -1.5 -> -0.5");

    /* prefix -- */
    x = 2.5f;
    --x;
    CHK(f_eq(x, 1.5f), 1, "prefix-- 2.5 -> 1.5");

    x = 0.5f;
    --x;
    CHK(f_eq(x, -0.5f), 1, "prefix-- 0.5 -> -0.5");

    /* postfix ++ returns old value */
    x = 1.5f;
    y = x++;
    CHK(f_eq(y, 1.5f), 1, "postfix++ returns old (y==1.5)");
    CHK(f_eq(x, 2.5f), 1, "postfix++ increments x to 2.5");

    /* postfix -- returns old value */
    x = 2.5f;
    y = x--;
    CHK(f_eq(y, 2.5f), 1, "postfix-- returns old (y==2.5)");
    CHK(f_eq(x, 1.5f), 1, "postfix-- decrements x to 1.5");

    /* Loop via float postfix increment */
    {
        float f;
        int count;
        count = 0;
        f = 0.0f;
        while (f++ < 3.0f) {
            count++;
        }
        CHK(count, 3, "while(f++ < 3.0f) count=3");
    }

    /* Prefix in expression context */
    x = 1.0f;
    r = (++x > 1.5f) ? 1 : 0;
    CHK(r, 1, "(++1.0f > 1.5f) == 1");

    SECTION_END("T6");
}

/* ── T7: Mixed float/double expressions (NEW) ───────────────────────────── */
static int fd_lt(float a, double b)  { return a < b; }
static int fd_gt(float a, double b)  { return a > b; }
static int fd_eq(float a, double b)  { return a == b; }
static int df_lt(double a, float b)  { return a < b; }

/* Float widened to double for binary op, then result */
static double f_plus_d(float a, double b)  { return a + b; }
static double d_plus_f(double a, float b)  { return a + b; }
static double f_times_d(float a, double b) { return a * b; }

static void t7_mixed_float_double(void) {
    SECTION("T7: Mixed float/double expressions");

    CHK(fd_lt(1.0f, 2.0),    1, "float 1.0f < double 2.0");
    CHK(fd_lt(2.0f, 1.0),    0, "float 2.0f < double 1.0");
    CHK(fd_lt(-1.0f, 0.0),   1, "float -1.0f < double 0.0");
    CHK(fd_gt(-1.0f, 0.0),   0, "float -1.0f > double 0.0");
    CHK(fd_eq(1.5f, 1.5),    1, "float 1.5f == double 1.5");
    CHK(df_lt(-2.0, -1.0f),  1, "double -2.0 < float -1.0f");

    /* mixed arithmetic: 1.0f + 2.0 = 3.0 */
    {
        double r = f_plus_d(1.0f, 2.0);
        PRT_F(r, "1.0f + 2.0 =");
        CHK(d_eq(r, 3.0), 1, "1.0f + 2.0 == 3.0");
    }
    {
        double r = d_plus_f(2.0, 1.0f);
        CHK(d_eq(r, 3.0), 1, "2.0 + 1.0f == 3.0");
    }
    {
        double r = f_times_d(2.0f, 3.0);
        CHK(d_eq(r, 6.0), 1, "2.0f * 3.0 == 6.0");
    }
    /* negative mixed */
    CHK(fd_lt(-3.0f, -2.0),  1, "float -3.0f < double -2.0");
    CHK(fd_gt(-2.0f, -3.0),  1, "float -2.0f > double -3.0");

    SECTION_END("T7");
}

/* ── T8: Float in struct members (NEW) ──────────────────────────────────── */
struct Vec2 {
    float x;
    float y;
};

static int vec2_lt_x(struct Vec2 a, struct Vec2 b) { return a.x < b.x; }
static int vec2_eq_y(struct Vec2 a, struct Vec2 b) { return a.y == b.y; }
static float vec2_dot(struct Vec2 a, struct Vec2 b) { return a.x*b.x + a.y*b.y; }

static void t8_struct_members(void) {
    struct Vec2 a;
    struct Vec2 b;
    struct Vec2 c;
    float dot;
    SECTION("T8: Float struct member access + comparison");

    a.x =  1.0f; a.y =  2.0f;
    b.x =  3.0f; b.y =  4.0f;
    c.x = -1.0f; c.y = -2.0f;

    CHK(vec2_lt_x(a, b), 1, "a.x(1.0) < b.x(3.0)");
    CHK(vec2_lt_x(b, a), 0, "b.x(3.0) < a.x(1.0)");
    CHK(vec2_lt_x(c, a), 1, "c.x(-1.0) < a.x(1.0)");
    CHK(vec2_eq_y(a, a), 1, "a.y == a.y");
    CHK(vec2_eq_y(a, b), 0, "a.y(2.0) == b.y(4.0)");

    /* 1*1 + 2*2 = 5 */
    dot = vec2_dot(a, a);
    PRT_F(dot, "dot(a,a) = 1+4 =");
    CHK(f_eq(dot, 5.0f), 1, "dot(a,a) == 5.0");

    /* 1*(-1) + 2*(-2) = -5 */
    dot = vec2_dot(a, c);
    PRT_F(dot, "dot(a,c) = -1-4 =");
    CHK(f_eq(dot, -5.0f), 1, "dot(a,c) == -5.0");

    /* struct member direct comparison (not via function) */
    {
        int r;
        if (a.x < b.x) r = 1; else r = 0;
        CHK(r, 1, "a.x(1.0) < b.x(3.0) direct");
        if (c.x < 0.0f) r = 1; else r = 0;
        CHK(r, 1, "c.x(-1.0) < 0.0f direct");
    }
    SECTION_END("T8");
}

/* ── T9: Float argument promotion from literal (NEW) ────────────────────── */
/* Tests that float literal arguments are correctly widened/passed
 * through function call ABI, not accidentally double-promoted */
static float identity_f(float x)   { return x; }
static double identity_d(double x) { return x; }

static void t9_literal_arg_promotion(void) {
    float r_f;
    double r_d;
    SECTION("T9: Float literal argument promotion");

    r_f = identity_f(3.14f);
    PRT_F(r_f, "identity_f(3.14f) =");
    CHK(f_eq(r_f, 3.14f), 1, "identity_f(3.14f) round-trip");

    r_f = identity_f(-3.14f);
    CHK(f_eq(r_f, -3.14f), 1, "identity_f(-3.14f) round-trip");

    r_f = identity_f(0.0f);
    CHK(f_eq(r_f, 0.0f), 1, "identity_f(0.0f)");

    r_d = identity_d(2.718281828);
    PRT_F(r_d, "identity_d(2.71828) =");
    CHK(d_eq(r_d, 2.718281828), 1, "identity_d round-trip");

    r_d = identity_d(-1.0);
    CHK(d_eq(r_d, -1.0), 1, "identity_d(-1.0) round-trip");

    SECTION_END("T9");
}

/* ── T10: Exhaustive sign x magnitude matrix (NEW) ──────────────────────── */
static void t10_sign_magnitude_matrix(void) {
    /* 4 magnitudes x 2 signs = 8 values, all 28 ordered pairs */
    float vals[8];
    int i;
    int j;
    int n = 8;
    SECTION("T10: Sign x magnitude matrix (all ordered pairs)");
    vals[0] = -4.0f;
    vals[1] = -2.0f;
    vals[2] = -0.5f;
    vals[3] = -0.125f;
    vals[4] =  0.125f;
    vals[5] =  0.5f;
    vals[6] =  2.0f;
    vals[7] =  4.0f;

    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            float a;
            float b;
            int exp_lt;
            int exp_eq;
            char lbl[64];
            a = vals[i];
            b = vals[j];
            exp_lt = (a < b) ? 1 : 0;   /* computed by GCC at call site */
            exp_eq = (a == b) ? 1 : 0;
            sprintf(lbl, "%.3f < %.3f", (double)a, (double)b);
            CHK(f_lt(a, b), exp_lt, lbl);
            sprintf(lbl, "%.3f == %.3f", (double)a, (double)b);
            CHK(f_eq(a, b), exp_eq, lbl);
        }
    }
    SECTION_END("T10");
}

/* ── T11: Special values (NEW) ──────────────────────────────────────────── */
static void t11_special_values(void) {
    float pos_zero;
    float neg_zero;
    float large;
    float small;
    SECTION("T11: Special float values");

    pos_zero = 0.0f;
    neg_zero = -0.0f;
    large    = 3.4028235e+38f;   /* near FLT_MAX */
    small    = 1.175494e-38f;    /* near FLT_MIN (normal) */

    /* +0.0 == -0.0 in IEEE-754 */
    CHK(f_eq(pos_zero, neg_zero), 1, "+0.0f == -0.0f");
    CHK(f_lt(pos_zero, neg_zero), 0, "+0.0f < -0.0f (must be 0)");
    CHK(f_gt(pos_zero, neg_zero), 0, "+0.0f > -0.0f (must be 0)");
    CHK(f_le(pos_zero, neg_zero), 1, "+0.0f <= -0.0f");
    CHK(f_ge(pos_zero, neg_zero), 1, "+0.0f >= -0.0f");

    /* large value ordering */
    CHK(f_lt(1.0f, large),   1, "1.0 < FLT_MAX_ish");
    CHK(f_gt(large, 1.0f),   1, "FLT_MAX_ish > 1.0");
    CHK(f_lt(-large, 0.0f),  1, "-FLT_MAX_ish < 0.0");
    CHK(f_gt(0.0f, -large),  1, "0.0 > -FLT_MAX_ish");

    /* small normal value */
    CHK(f_gt(small, 0.0f),   1, "FLT_MIN_ish > 0.0");
    CHK(f_lt(-small, 0.0f),  1, "-FLT_MIN_ish < 0.0");

    /* large vs large */
    CHK(f_lt(large * 0.5f, large), 1, "FLT_MAX/2 < FLT_MAX");

    /* Printed values for oracle diff validation */
    PRT_F(pos_zero, "+0.0f =");
    PRT_F(neg_zero, "-0.0f =");
    PRT_F(large,    "FLT_MAX_ish =");
    PRT_F(small,    "FLT_MIN_ish =");
    SECTION_END("T11");
}

/* ── T12: Accumulation in loops (compound-assign + comparison seam) ──────── */
static void t12_loop_accumulation(void) {
    SECTION("T12: Loop accumulation (compound assign + cmp)");

    /* float += in while, result checked via comparison */
    {
        float acc;
        int steps;
        acc = 0.0f;
        steps = 0;
        while (acc < 1.0f) {
            acc += 0.25f;
            steps++;
        }
        CHK(steps, 4, "acc+=0.25 while<1.0: 4 steps");
        CHK(f_ge(acc, 1.0f), 1, "acc >= 1.0 after loop");
    }

    /* float -= going negative */
    {
        float acc;
        int steps;
        acc = 0.0f;
        steps = 0;
        while (acc > -1.0f) {
            acc -= 0.25f;
            steps++;
        }
        CHK(steps, 4, "acc-=0.25 while>-1.0: 4 steps");
        CHK(f_le(acc, -1.0f), 1, "acc <= -1.0 after loop");
    }

    /* float *= checked for sign preservation */
    {
        float x;
        x = -1.0f;
        x *= 2.0f;
        CHK(f_eq(x, -2.0f), 1, "-1.0f *= 2.0f = -2.0f");
        x *= -1.0f;
        CHK(f_eq(x, 2.0f), 1,  "-2.0f *= -1.0f = 2.0f");
    }

    /* float /= */
    {
        float x;
        x = -4.0f;
        x /= 2.0f;
        CHK(f_eq(x, -2.0f), 1, "-4.0f /= 2.0f = -2.0f");
    }

    SECTION_END("T12");
}

/* ── main ────────────────────────────────────────────────────────────────── */
int main(void) {
    t1_basic_comparisons();
    t2_negative_operands();
    t3_literal_comparisons();
    t4_bool_via_call();
    t5_direct_control_flow();
    t6_unary_increment();
    t7_mixed_float_double();
    t8_struct_members();
    t9_literal_arg_promotion();
    t10_sign_magnitude_matrix();
    t11_special_values();
    t12_loop_accumulation();

    printf("\n=== FINAL: %d passed, %d failed ===\n", g_pass, g_fail);
    return g_fail > 0 ? 1 : 0;
}
