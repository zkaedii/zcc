/*
 * jit_telemetry.h — JIT Execution Telemetry + Gas Metering
 *
 * Phase III-1/III-2 of the Leviathan Roadmap.
 *
 * Provides inline counters and gas metering for JIT'd EVM code.
 * The JIT lowering emits calls to these functions at each IR node.
 *
 * Usage:
 *   jit_telem_reset();
 *   // ... execute JIT'd code ...
 *   jit_telem_t *t = jit_telem_get();
 *   printf("Gas used: %ld\n", t->gas_used);
 */

#ifndef JIT_TELEMETRY_H
#define JIT_TELEMETRY_H

#include <stdint.h>

/* ── Gas costs (EVM Yellow Paper, Berlin schedule) ──────────────────── */

#define EVM_GAS_ZERO          0    /* STOP, RETURN, REVERT */
#define EVM_GAS_BASE          2    /* ADDRESS, ORIGIN, CALLER, etc. */
#define EVM_GAS_VERYLOW       3    /* ADD, SUB, NOT, LT, GT, etc. */
#define EVM_GAS_LOW           5    /* MUL, DIV, SDIV */
#define EVM_GAS_MID           8    /* ADDMOD, MULMOD, JUMP */
#define EVM_GAS_HIGH         10    /* JUMPI */
#define EVM_GAS_SLOAD       100    /* Berlin: warm SLOAD */
#define EVM_GAS_SLOAD_COLD 2100    /* Berlin: cold SLOAD */
#define EVM_GAS_SSTORE     100     /* Warm SSTORE (minimum, actual varies) */
#define EVM_GAS_SSTORE_SET 20000   /* SSTORE: zero → non-zero */
#define EVM_GAS_LOG         375    /* LOG0 base */
#define EVM_GAS_LOG_TOPIC   375    /* Per topic */
#define EVM_GAS_SHA3         30    /* SHA3 base */
#define EVM_GAS_COPY          3    /* Per-word memory copy */
#define EVM_GAS_CALL       100     /* Warm CALL base */
#define EVM_GAS_CREATE    32000    /* CREATE */
#define EVM_GAS_PUSH          3    /* PUSH1..PUSH32 */
#define EVM_GAS_DUP           3    /* DUP1..DUP16 */
#define EVM_GAS_SWAP          3    /* SWAP1..SWAP16 */
#define EVM_GAS_MLOAD         3    /* MLOAD */
#define EVM_GAS_MSTORE        3    /* MSTORE */
#define EVM_GAS_POP           2    /* POP */

/* ── Telemetry counters ─────────────────────────────────────────────── */

typedef struct {
    /* Execution counts */
    long insn_count;          /* total IR nodes executed */
    long arith_count;         /* ADD, SUB, MUL, DIV, MOD */
    long logic_count;         /* AND, OR, XOR, NOT, SHL, SHR */
    long cmp_count;           /* EQ, NE, LT, LE, GT, GE */
    long branch_count;        /* BR + BR_IF */
    long branch_taken;        /* BR_IF that actually jumped */
    long load_count;          /* IR_LOAD (includes SLOAD) */
    long store_count;         /* IR_STORE (includes SSTORE) */
    long call_count;          /* IR_CALL */
    long const_count;         /* IR_CONST */
    long stack_peak;          /* maximum EVM stack depth observed */
    long mem_peak;            /* highest memory offset accessed */

    /* Storage-specific */
    long sload_count;         /* __evm_sload calls */
    long sstore_count;        /* __evm_sstore calls */
    long sstore_zero_to_nz;   /* 0→non-zero transitions (expensive) */
    long sstore_nz_to_zero;   /* non-zero→0 transitions (refund) */

    /* Gas metering */
    long gas_limit;           /* initial gas budget */
    long gas_used;            /* total gas consumed */
    long gas_remaining;       /* gas_limit - gas_used */
    int  out_of_gas;          /* 1 if execution halted due to OOG */
} jit_telem_t;

extern jit_telem_t g_jit_telem;

/* Reset all counters before a new execution */
static inline void jit_telem_reset(void) {
    long saved_limit = g_jit_telem.gas_limit;
    memset(&g_jit_telem, 0, sizeof(g_jit_telem));
    g_jit_telem.gas_limit = saved_limit ? saved_limit : 10000000; /* 10M default */
    g_jit_telem.gas_remaining = g_jit_telem.gas_limit;
}

/* Get current telemetry state */
static inline jit_telem_t *jit_telem_get(void) {
    return &g_jit_telem;
}

/* Set gas limit */
static inline void jit_telem_set_gas(long limit) {
    g_jit_telem.gas_limit = limit;
    g_jit_telem.gas_remaining = limit;
}

/* ── Inline counter functions (called from JIT'd code) ──────────────── */

/* Charge gas — returns 0 if OK, 1 if out-of-gas */
static int jit_telem_charge_gas(long cost) {
    g_jit_telem.gas_used += cost;
    g_jit_telem.gas_remaining -= cost;
    if (g_jit_telem.gas_remaining < 0) {
        g_jit_telem.out_of_gas = 1;
        return 1;
    }
    return 0;
}

static void jit_telem_count_insn(void) {
    g_jit_telem.insn_count++;
}

static void jit_telem_count_arith(void) {
    g_jit_telem.arith_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_VERYLOW);
}

static void jit_telem_count_logic(void) {
    g_jit_telem.logic_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_VERYLOW);
}

static void jit_telem_count_cmp(void) {
    g_jit_telem.cmp_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_VERYLOW);
}

static void jit_telem_count_branch(void) {
    g_jit_telem.branch_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_HIGH);
}

static void jit_telem_count_sload(void) {
    g_jit_telem.sload_count++;
    g_jit_telem.load_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_SLOAD);
}

static void jit_telem_count_sstore(void) {
    g_jit_telem.sstore_count++;
    g_jit_telem.store_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_SSTORE_SET);
}

static void jit_telem_count_load(void) {
    g_jit_telem.load_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_MLOAD);
}

static void jit_telem_count_store(void) {
    g_jit_telem.store_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_MSTORE);
}

static void jit_telem_count_call(void) {
    g_jit_telem.call_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_CALL);
}

static void jit_telem_count_const(void) {
    g_jit_telem.const_count++;
    g_jit_telem.insn_count++;
    jit_telem_charge_gas(EVM_GAS_PUSH);
}

#endif /* JIT_TELEMETRY_H */
