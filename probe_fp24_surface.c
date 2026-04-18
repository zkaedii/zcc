#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "src/zkaedi_fpx.h"
#include "src/zkaedi_fpx.c"

/* ---- Tier 1: Special Cases & Tie-Breaking ---- */
int test_tier1(void) {
    int fails = 0;
    fp24_t p_zero = fp24_from_double(0.0);
    fp24_t n_zero = fp24_from_double(-0.0);
    if (p_zero != FP24_ZERO) { printf("T1 Fail: +0.0 (got 0x%06X)\n", p_zero); fails++; }
    if (n_zero != FP24_NEG_ZERO) { printf("T1 Fail: -0.0 (got 0x%06X)\n", n_zero); fails++; }

    /* +/-Inf */
    fp24_t p_inf = fp24_from_double(1e300 * 1e300);
    if (p_inf != FP24_INF) { printf("T1 Fail: +Inf (got 0x%06X)\n", p_inf); fails++; }
    fp24_t n_inf = fp24_from_double(-(1e300 * 1e300));
    if (n_inf != FP24_NEG_INF) { printf("T1 Fail: -Inf (got 0x%06X)\n", n_inf); fails++; }

    /* NaN round-trip */
    fp24_t nan_in = FP24_NAN;
    double d_nan = fp24_to_double(nan_in);
    unsigned long long d_nan_bits;
    memcpy(&d_nan_bits, &d_nan, 8);
    if (((d_nan_bits >> 52) & 0x7FF) != 0x7FF || !(d_nan_bits & 0xFFFFFFFFFFFFFULL)) {
        printf("T1 Fail: FP24_NAN does not expand to a double NaN\n"); fails++;
    }

    /* Subnormal FTZ symmetry — direct bit pattern tests (CG-FPX-FTZ-001) */
    {
        /* smallest positive subnormal fp24: exp=0, mant=1 */
        fp24_t sub_pos = (fp24_t)1;
        double d_sub_pos = fp24_to_double(sub_pos);
        unsigned long long bits_pos;
        memcpy(&bits_pos, &d_sub_pos, 8);
        if (bits_pos != 0ULL) {   /* must be +0.0 exactly */
            printf("T1 Fail: fp24_to_double(subnormal 0x000001) = 0x%016llX (want +0.0 = 0x0)\n", bits_pos);
            fails++;
        }
        /* largest negative subnormal fp24: sign=1, exp=0, mant=0x7FFF */
        fp24_t sub_neg = (fp24_t)(FP24_SIGN_MASK | 0x7FFF);
        double d_sub_neg = fp24_to_double(sub_neg);
        unsigned long long bits_neg;
        memcpy(&bits_neg, &d_sub_neg, 8);
        if (bits_neg != (1ULL << 63)) {  /* must be -0.0 exactly */
            printf("T1 Fail: fp24_to_double(neg subnormal 0x%06X) = 0x%016llX (want -0.0 = 0x8000000000000000)\n",
                   sub_neg & FP24_FULL_MASK, bits_neg);
            fails++;
        }
    }

    /* Tie-breaking: round-half-to-even */
    {
        unsigned long long base_bits = (1023ULL << 52); /* 1.0 in double */
        /* tie to even (mant=0 is even): bit 36 set, bits 0-35 clear => round down */
        unsigned long long tie_down_bits = base_bits | (1ULL << 36);
        /* tie to odd (mant=1 is odd): bit 37 set (odd mant), bit 36 set => round up */
        unsigned long long tie_up_bits = base_bits | (1ULL << 37) | (1ULL << 36);
        double d_down, d_up;
        memcpy(&d_down, &tie_down_bits, 8);
        memcpy(&d_up, &tie_up_bits, 8);
        fp24_t f_down = fp24_from_double(d_down);
        fp24_t f_up = fp24_from_double(d_up);
        if ((f_down & FP24_MANT_MASK) != 0) {
            printf("T1 Fail: tie-even-down rounded incorrectly (mant=0x%04X want 0)\n", f_down & FP24_MANT_MASK);
            fails++;
        }
        if ((f_up & FP24_MANT_MASK) != 2) {
            printf("T1 Fail: tie-odd-up rounded incorrectly (mant=0x%04X want 2)\n", f_up & FP24_MANT_MASK);
            fails++;
        }
    }

    if (fails == 0) printf("[T1] Special cases, FTZ symmetry & tie-breaking: PASS\n");
    return fails;
}

/* ---- Tier 2: Exhaustive Round-Trip ---- */
int test_tier2(void) {
    unsigned int u;
    unsigned int fails = 0;
    printf("[T2] Starting exhaustive round-trip (16,777,216 patterns)...\n");
    for (u = 0; u < 0x1000000; u++) {
        fp24_t orig = (fp24_t)u;
        double d = fp24_to_double(orig);
        fp24_t back = fp24_from_double(d);

        if (fp24_isnan(orig)) {
            /* NaN -> any NaN is acceptable */
            if (!fp24_isnan(back)) {
                if (fails < 5) printf("T2 Fail: NaN 0x%06X did not round-trip to NaN\n", u);
                fails++;
            }
        } else {
            /* FTZ contract: subnormal fp24 (exp==0, mant!=0) maps to +-0 on both sides.
             * to_double returns +-0.0, so from_double returns 0 or FP24_NEG_ZERO.
             * This is CORRECT behavior after CG-FPX-FTZ-001. */
            int is_subnormal = ((orig & FP24_EXP_MASK) == 0) && ((orig & FP24_MANT_MASK) != 0);
            fp24_t expected_back = is_subnormal
                ? ((orig & FP24_SIGN_MASK) ? FP24_NEG_ZERO : FP24_ZERO)
                : orig;
            if (back != expected_back) {
                if (fails < 10) printf("T2 Fail: 0x%06X -> %.15g -> 0x%06X (want 0x%06X)\n",
                                       u, d, back, expected_back & FP24_FULL_MASK);
                fails++;
            }
        }

    }

    if (fails == 0) {
        printf("[T2] Exhaustive round-trip 16,777,216/16,777,216: PASS\n");
    } else {
        printf("[T2] Exhaustive round-trip: FAIL (%u errors)\n", fails);
    }
    return fails;
}

/* ---- Tier 3: Arithmetic Invariants ---- */
static unsigned int lcg_seed = 12345;
static unsigned int lcg_rand_fn(void) {
    lcg_seed = lcg_seed * 1664525 + 1013904223;
    return lcg_seed;
}

int test_tier3(void) {
    int fails = 0;
    int i;

    for (i = 0; i < 10000; i++) {
        fp24_t a = (fp24_t)(lcg_rand_fn() & 0xFFFFFF);
        fp24_t b = (fp24_t)(lcg_rand_fn() & 0xFFFFFF);
        if (fp24_isnan(a) || fp24_isnan(b)) continue;
        fp24_t r1 = fp24_add(a, b);
        fp24_t r2 = fp24_add(b, a);
        if (fp24_isnan(r1) && fp24_isnan(r2)) continue;
        if (r1 != r2) {
            if (!(fp24_iszero(r1) && fp24_iszero(r2))) {
                if (fails < 5) printf("T3 Fail: commutativity 0x%06X+0x%06X: 0x%06X vs 0x%06X\n", a, b, r1, r2);
                fails++;
            }
        }
    }

    /* Accumulation drift: sum 0.1 x 10,000 */
    {
        fp24_t acc = FP24_ZERO;
        fp24_t step = fp24_from_double(0.1);
        for (i = 0; i < 10000; i++) acc = fp24_add(acc, step);
        double expected = 1000.0;
        double actual = fp24_to_double(acc);
        double drift = actual - expected;
        if (drift < 0.0) drift = -drift;
        printf("[T3] Accumulation 0.1x10000 = %.2f (drift=%.2f, ~%.1f ULPs at 1000)\n",
               actual, drift, drift / fp24_to_double(fp24_from_double(0.0625)));
        if (drift > 200.0) {
            printf("T3 Fail: drift exceeds 200.0 threshold\n");
            fails++;
        }
    }

    if (fails == 0) printf("[T3] Arithmetic invariants: PASS\n");
    return fails;
}

int main(void) {
    int fails = 0;
    printf("=== ZKAEDI FP24 SURFACE PROBE v2 (post-FTZ symmetrization) ===\n\n");
    fails += test_tier1();
    fails += test_tier2();
    fails += test_tier3();
    if (fails == 0) {
        printf("\n=== ALL CLEAR: 0 failures ===\n");
        return 0;
    }
    printf("\n=== FAIL: %d total errors ===\n", fails);
    return 1;
}
