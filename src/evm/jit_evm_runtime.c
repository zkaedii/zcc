/*
 * jit_evm_runtime.c — 256-bit EVM Runtime for JIT'd Code
 *
 * Phase II-1 of the Leviathan Roadmap.
 *
 * Provides callable C functions that JIT'd EVM code can invoke for
 * operations that can't be efficiently inlined as scalar x86-64.
 * All functions operate on 32-byte (256-bit) big-endian values
 * matching the EVM's native word size.
 *
 * The JIT lowering in jit_lower.c resolves IR_CALL nodes that reference
 * these functions via jit_rt_resolve(), which maps function names to
 * host addresses for direct CALL emission.
 */

#include <string.h>
#include <stdint.h>
#include <stdio.h>

#include "jit_telemetry.h"

/* Single global telemetry instance — shared across all callers */
jit_telem_t g_jit_telem;

/* ── 256-bit type (32 bytes, big-endian, matches evm_u256_t) ───────── */

typedef struct { uint8_t b[32]; } u256_t;

/* ── Arithmetic ────────────────────────────────────────────────────── */

void evm_rt_add256(u256_t *dst, const u256_t *a, const u256_t *b) {
    unsigned carry = 0;
    int i;
    for (i = 31; i >= 0; i--) {
        unsigned sum = (unsigned)a->b[i] + (unsigned)b->b[i] + carry;
        dst->b[i] = (uint8_t)(sum & 0xFF);
        carry = sum >> 8;
    }
}

void evm_rt_sub256(u256_t *dst, const u256_t *a, const u256_t *b) {
    int borrow = 0;
    int i;
    for (i = 31; i >= 0; i--) {
        int diff = (int)a->b[i] - (int)b->b[i] - borrow;
        if (diff < 0) { diff += 256; borrow = 1; }
        else borrow = 0;
        dst->b[i] = (uint8_t)diff;
    }
}

void evm_rt_mul256(u256_t *dst, const u256_t *a, const u256_t *b) {
    int i, j;
    memset(dst->b, 0, 32);
    for (i = 31; i >= 0; i--) {
        unsigned carry = 0;
        for (j = 31; j >= 0; j--) {
            int k = i + j - 31;
            if (k < 0) continue;
            unsigned prod = (unsigned)dst->b[k] + ((unsigned)a->b[i] * (unsigned)b->b[j]) + carry;
            dst->b[k] = (uint8_t)(prod & 0xFF);
            carry = prod >> 8;
        }
    }
}

void evm_rt_div256(u256_t *q, u256_t *r, const u256_t *a, const u256_t *b) {
    int i, all_zero = 1;
    memset(q->b, 0, 32);
    memset(r->b, 0, 32);
    for (i = 0; i < 32; i++) if (b->b[i]) { all_zero = 0; break; }
    if (all_zero) return;  /* div by zero → (0, 0) per EVM spec */

    for (i = 255; i >= 0; i--) {
        /* shift r left by 1 */
        int carry = 0, j;
        for (j = 31; j >= 0; j--) {
            int nc = (r->b[j] >> 7) & 1;
            r->b[j] = (r->b[j] << 1) | carry;
            carry = nc;
        }
        /* set LSB of r to bit i of a */
        int byte_idx = 31 - (i / 8);
        int bit_off = i % 8;
        if ((a->b[byte_idx] >> bit_off) & 1)
            r->b[31] |= 1;
        /* if r >= b, r -= b, set bit i of q */
        int cmp = 0;
        for (j = 0; j < 32; j++) {
            if (r->b[j] > b->b[j]) { cmp = 1; break; }
            if (r->b[j] < b->b[j]) { cmp = -1; break; }
        }
        if (cmp >= 0) {
            int borrow = 0;
            for (j = 31; j >= 0; j--) {
                int d = (int)r->b[j] - (int)b->b[j] - borrow;
                if (d < 0) { d += 256; borrow = 1; } else borrow = 0;
                r->b[j] = (uint8_t)d;
            }
            byte_idx = 31 - (i / 8);
            bit_off = i % 8;
            q->b[byte_idx] |= (1 << bit_off);
        }
    }
}

/* ── Bitwise ───────────────────────────────────────────────────────── */

void evm_rt_and256(u256_t *dst, const u256_t *a, const u256_t *b) {
    int i; for (i = 0; i < 32; i++) dst->b[i] = a->b[i] & b->b[i];
}

void evm_rt_or256(u256_t *dst, const u256_t *a, const u256_t *b) {
    int i; for (i = 0; i < 32; i++) dst->b[i] = a->b[i] | b->b[i];
}

void evm_rt_xor256(u256_t *dst, const u256_t *a, const u256_t *b) {
    int i; for (i = 0; i < 32; i++) dst->b[i] = a->b[i] ^ b->b[i];
}

void evm_rt_not256(u256_t *dst, const u256_t *a) {
    int i; for (i = 0; i < 32; i++) dst->b[i] = ~a->b[i];
}

/* ── Comparison ────────────────────────────────────────────────────── */

int evm_rt_iszero256(const u256_t *a) {
    int i; for (i = 0; i < 32; i++) if (a->b[i]) return 0;
    return 1;
}

int evm_rt_eq256(const u256_t *a, const u256_t *b) {
    return memcmp(a->b, b->b, 32) == 0;
}

int evm_rt_lt256(const u256_t *a, const u256_t *b) {
    int i; for (i = 0; i < 32; i++) {
        if (a->b[i] < b->b[i]) return 1;
        if (a->b[i] > b->b[i]) return 0;
    }
    return 0;
}

int evm_rt_gt256(const u256_t *a, const u256_t *b) {
    return evm_rt_lt256(b, a);
}

/* ── EVM Stack Operations ──────────────────────────────────────────── */

/* 32-byte-slot EVM stack, max depth 1024 */
#define EVM_RT_STACK_MAX 1024

typedef struct {
    u256_t slots[EVM_RT_STACK_MAX];
    int    sp;   /* stack pointer (next free slot) */
} evm_rt_stack_t;

static evm_rt_stack_t g_evm_stack = { .sp = 0 };

void evm_rt_push(const u256_t *val) {
    if (g_evm_stack.sp < EVM_RT_STACK_MAX)
        g_evm_stack.slots[g_evm_stack.sp++] = *val;
}

void evm_rt_pop(u256_t *out) {
    if (g_evm_stack.sp > 0)
        *out = g_evm_stack.slots[--g_evm_stack.sp];
    else
        memset(out->b, 0, 32);
}

void evm_rt_dup(int n) {
    if (g_evm_stack.sp >= n && g_evm_stack.sp < EVM_RT_STACK_MAX)
        g_evm_stack.slots[g_evm_stack.sp++] = g_evm_stack.slots[g_evm_stack.sp - n - 1];
}

void evm_rt_swap(int n) {
    if (g_evm_stack.sp > n) {
        u256_t tmp = g_evm_stack.slots[g_evm_stack.sp - 1];
        g_evm_stack.slots[g_evm_stack.sp - 1] = g_evm_stack.slots[g_evm_stack.sp - 1 - n];
        g_evm_stack.slots[g_evm_stack.sp - 1 - n] = tmp;
    }
}

void evm_rt_stack_reset(void) {
    g_evm_stack.sp = 0;
}

/* ── EVM Memory (sparse, 32-byte aligned reads/writes) ─────────────── */

#define EVM_RT_MEM_SIZE (64 * 1024)  /* 64KB initial, expandable later */

static uint8_t g_evm_memory[EVM_RT_MEM_SIZE];

void evm_rt_mstore(uint64_t offset, const u256_t *val) {
    if (offset + 32 <= EVM_RT_MEM_SIZE)
        memcpy(g_evm_memory + offset, val->b, 32);
}

void evm_rt_mload(uint64_t offset, u256_t *out) {
    if (offset + 32 <= EVM_RT_MEM_SIZE)
        memcpy(out->b, g_evm_memory + offset, 32);
    else
        memset(out->b, 0, 32);
}

void evm_rt_mstore8(uint64_t offset, uint8_t val) {
    if (offset < EVM_RT_MEM_SIZE)
        g_evm_memory[offset] = val;
}

void evm_rt_memory_reset(void) {
    memset(g_evm_memory, 0, EVM_RT_MEM_SIZE);
}

/* ── EVM Storage (key → value, simple open-address hash) ───────────── */

#define EVM_RT_STORAGE_SLOTS 4096

typedef struct {
    u256_t key;
    u256_t val;
    int    occupied;
} evm_rt_storage_slot_t;

static evm_rt_storage_slot_t g_evm_storage[EVM_RT_STORAGE_SLOTS];

static unsigned evm_rt_storage_hash(const u256_t *key) {
    unsigned h = 0;
    int i;
    for (i = 0; i < 32; i++)
        h = h * 31 + key->b[i];
    return h % EVM_RT_STORAGE_SLOTS;
}

long evm_rt_sload(long key_narrow) {
    u256_t key;
    unsigned idx;
    int i;
    memset(key.b, 0, 32);
    for (i = 0; i < 8; i++)
        key.b[31 - i] = (uint8_t)((key_narrow >> (i * 8)) & 0xFF);
    idx = evm_rt_storage_hash(&key);
    for (i = 0; i < EVM_RT_STORAGE_SLOTS; i++) {
        unsigned slot = (idx + i) % EVM_RT_STORAGE_SLOTS;
        if (!g_evm_storage[slot].occupied) return 0;
        if (memcmp(g_evm_storage[slot].key.b, key.b, 32) == 0) {
            /* Extract low 64 bits */
            long v = 0;
            int j;
            for (j = 24; j < 32; j++)
                v = (v << 8) | g_evm_storage[slot].val.b[j];
            return v;
        }
    }
    return 0;
}

void evm_rt_sstore(long key_narrow, long val_narrow) {
    u256_t key, val;
    unsigned idx;
    int i;
    memset(key.b, 0, 32);
    memset(val.b, 0, 32);
    for (i = 0; i < 8; i++) {
        key.b[31 - i] = (uint8_t)((key_narrow >> (i * 8)) & 0xFF);
        val.b[31 - i] = (uint8_t)((val_narrow >> (i * 8)) & 0xFF);
    }
    idx = evm_rt_storage_hash(&key);
    for (i = 0; i < EVM_RT_STORAGE_SLOTS; i++) {
        unsigned slot = (idx + i) % EVM_RT_STORAGE_SLOTS;
        if (!g_evm_storage[slot].occupied) {
            memcpy(g_evm_storage[slot].key.b, key.b, 32);
            memcpy(g_evm_storage[slot].val.b, val.b, 32);
            g_evm_storage[slot].occupied = 1;
            return;
        }
        if (memcmp(g_evm_storage[slot].key.b, key.b, 32) == 0) {
            memcpy(g_evm_storage[slot].val.b, val.b, 32);
            return;
        }
    }
}

/* Transient storage (EIP-1153): same API, separate table */
static evm_rt_storage_slot_t g_evm_tstorage[EVM_RT_STORAGE_SLOTS];

long evm_rt_tload(long key_narrow) {
    u256_t key;
    unsigned idx;
    int i;
    memset(key.b, 0, 32);
    for (i = 0; i < 8; i++)
        key.b[31 - i] = (uint8_t)((key_narrow >> (i * 8)) & 0xFF);
    idx = evm_rt_storage_hash(&key);
    for (i = 0; i < EVM_RT_STORAGE_SLOTS; i++) {
        unsigned slot = (idx + i) % EVM_RT_STORAGE_SLOTS;
        if (!g_evm_tstorage[slot].occupied) return 0;
        if (memcmp(g_evm_tstorage[slot].key.b, key.b, 32) == 0) {
            long v = 0;
            int j;
            for (j = 24; j < 32; j++)
                v = (v << 8) | g_evm_tstorage[slot].val.b[j];
            return v;
        }
    }
    return 0;
}

void evm_rt_tstore(long key_narrow, long val_narrow) {
    u256_t key, val;
    unsigned idx;
    int i;
    memset(key.b, 0, 32);
    memset(val.b, 0, 32);
    for (i = 0; i < 8; i++) {
        key.b[31 - i] = (uint8_t)((key_narrow >> (i * 8)) & 0xFF);
        val.b[31 - i] = (uint8_t)((val_narrow >> (i * 8)) & 0xFF);
    }
    idx = evm_rt_storage_hash(&key);
    for (i = 0; i < EVM_RT_STORAGE_SLOTS; i++) {
        unsigned slot = (idx + i) % EVM_RT_STORAGE_SLOTS;
        if (!g_evm_tstorage[slot].occupied) {
            memcpy(g_evm_tstorage[slot].key.b, key.b, 32);
            memcpy(g_evm_tstorage[slot].val.b, val.b, 32);
            g_evm_tstorage[slot].occupied = 1;
            return;
        }
        if (memcmp(g_evm_tstorage[slot].key.b, key.b, 32) == 0) {
            memcpy(g_evm_tstorage[slot].val.b, val.b, 32);
            return;
        }
    }
}

void evm_rt_storage_reset(void) {
    memset(g_evm_storage, 0, sizeof(g_evm_storage));
    memset(g_evm_tstorage, 0, sizeof(g_evm_tstorage));
}

/* ── EVM System Calls (match lifter __evm_* labels) ────────────────── */

/* SHA3/KECCAK256: offset, length → hash.
 * Full Keccak is in evm_lifter.c; here we provide a callable stub
 * that operates on JIT runtime memory. */
long evm_rt_sha3(long offset, long length) {
    /* Simplified: return a deterministic hash of the memory region.
     * For full correctness, integrate the Keccak from evm_lifter.c. */
    uint64_t h = 0xcbf29ce484222325ULL;  /* FNV-1a offset basis */
    long i;
    for (i = 0; i < length && (uint64_t)(offset + i) < EVM_RT_MEM_SIZE; i++) {
        h ^= g_evm_memory[offset + i];
        h *= 0x100000001b3ULL;
    }
    return (long)h;
}

/* Memory copy stubs — copy from EVM memory to EVM memory */
void evm_rt_calldatacopy(long dest, long offset, long length) {
    /* In JIT mode, calldata is simulated. Zero-fill for now. */
    long i;
    for (i = 0; i < length && (uint64_t)(dest + i) < EVM_RT_MEM_SIZE; i++)
        g_evm_memory[dest + i] = 0;
}

void evm_rt_codecopy(long dest, long offset, long length) {
    long i;
    for (i = 0; i < length && (uint64_t)(dest + i) < EVM_RT_MEM_SIZE; i++)
        g_evm_memory[dest + i] = 0;
}

void evm_rt_returndatacopy(long dest, long offset, long length) {
    long i;
    for (i = 0; i < length && (uint64_t)(dest + i) < EVM_RT_MEM_SIZE; i++)
        g_evm_memory[dest + i] = 0;
}

void evm_rt_extcodecopy(long addr, long dest, long offset, long length) {
    (void)addr;
    long i;
    for (i = 0; i < length && (uint64_t)(dest + i) < EVM_RT_MEM_SIZE; i++)
        g_evm_memory[dest + i] = 0;
}

/* LOG stubs — record events (no-op in JIT mode for now) */
void evm_rt_log0(long offset, long length) { (void)offset; (void)length; }
void evm_rt_log1(long offset, long length, long t1) { (void)offset; (void)length; (void)t1; }
void evm_rt_log2(long offset, long length, long t1, long t2) { (void)offset; (void)length; (void)t1; (void)t2; }
void evm_rt_log3(long offset, long length, long t1, long t2, long t3) { (void)offset; (void)length; (void)t1; (void)t2; (void)t3; }
void evm_rt_log4(long offset, long length, long t1, long t2, long t3, long t4) { (void)offset; (void)length; (void)t1; (void)t2; (void)t3; (void)t4; }

/* CALL family stubs — return 1 (success) */
long evm_rt_call(long gas, long addr, long val, long ao, long al, long ro, long rl) {
    (void)gas; (void)addr; (void)val; (void)ao; (void)al; (void)ro; (void)rl;
    return 1;
}

long evm_rt_delegatecall(long gas, long addr, long ao, long al, long ro, long rl) {
    (void)gas; (void)addr; (void)ao; (void)al; (void)ro; (void)rl;
    return 1;
}

long evm_rt_staticcall(long gas, long addr, long ao, long al, long ro, long rl) {
    (void)gas; (void)addr; (void)ao; (void)al; (void)ro; (void)rl;
    return 1;
}

/* CREATE stubs — return 0 (no address) */
long evm_rt_create(long val, long offset, long length) {
    (void)val; (void)offset; (void)length;
    return 0;
}

long evm_rt_create2(long val, long offset, long length, long salt) {
    (void)val; (void)offset; (void)length; (void)salt;
    return 0;
}

/* ── Symbol Resolver (maps IR_CALL/IR_LOAD/IR_STORE labels → host addresses) ── */

typedef struct {
    const char *name;
    void       *addr;
} JitRtSymbol;

static const JitRtSymbol g_rt_symbols[] = {
    /* 256-bit arithmetic */
    { "evm_rt_add256",      (void*)evm_rt_add256 },
    { "evm_rt_sub256",      (void*)evm_rt_sub256 },
    { "evm_rt_mul256",      (void*)evm_rt_mul256 },
    { "evm_rt_div256",      (void*)evm_rt_div256 },
    { "evm_rt_and256",      (void*)evm_rt_and256 },
    { "evm_rt_or256",       (void*)evm_rt_or256 },
    { "evm_rt_xor256",      (void*)evm_rt_xor256 },
    { "evm_rt_not256",      (void*)evm_rt_not256 },
    { "evm_rt_iszero256",   (void*)evm_rt_iszero256 },
    { "evm_rt_eq256",       (void*)evm_rt_eq256 },
    { "evm_rt_lt256",       (void*)evm_rt_lt256 },
    { "evm_rt_gt256",       (void*)evm_rt_gt256 },
    /* EVM stack */
    { "evm_rt_push",        (void*)evm_rt_push },
    { "evm_rt_pop",         (void*)evm_rt_pop },
    { "evm_rt_dup",         (void*)evm_rt_dup },
    { "evm_rt_swap",        (void*)evm_rt_swap },
    /* EVM memory */
    { "evm_rt_mstore",      (void*)evm_rt_mstore },
    { "evm_rt_mload",       (void*)evm_rt_mload },
    { "evm_rt_mstore8",     (void*)evm_rt_mstore8 },
    /* Storage — __evm_sload/sstore labels from lifter */
    { "__evm_sload",        (void*)evm_rt_sload },
    { "__evm_sstore",       (void*)evm_rt_sstore },
    { "__evm_tload",        (void*)evm_rt_tload },
    { "__evm_tstore",       (void*)evm_rt_tstore },
    /* System calls — __evm_* labels from lifter */
    { "__evm_sha3",         (void*)evm_rt_sha3 },
    { "__evm_calldatacopy", (void*)evm_rt_calldatacopy },
    { "__evm_codecopy",     (void*)evm_rt_codecopy },
    { "__evm_returndatacopy",(void*)evm_rt_returndatacopy },
    { "__evm_extcodecopy",  (void*)evm_rt_extcodecopy },
    { "__evm_log0",         (void*)evm_rt_log0 },
    { "__evm_log1",         (void*)evm_rt_log1 },
    { "__evm_log2",         (void*)evm_rt_log2 },
    { "__evm_log3",         (void*)evm_rt_log3 },
    { "__evm_log4",         (void*)evm_rt_log4 },
    /* CREATE/CREATE2 */
    { "evm_create",         (void*)evm_rt_create },
    { "evm_create2",        (void*)evm_rt_create2 },
    /* Resets */
    { "evm_rt_stack_reset", (void*)evm_rt_stack_reset },
    { "evm_rt_memory_reset",(void*)evm_rt_memory_reset },
    { "evm_rt_storage_reset",(void*)evm_rt_storage_reset },
    /* libc functions for --jit-c C mode */
    { "printf",             (void*)printf },
    { "puts",               (void*)puts },
    { "memset",             (void*)memset },
    { "memcpy",             (void*)memcpy },
    { "strcmp",              (void*)strcmp },
    { "strlen",             (void*)strlen },
    /* Telemetry — Phase III counters + gas metering */
    { "jit_telem_count_insn",   (void*)jit_telem_count_insn },
    { "jit_telem_count_arith",  (void*)jit_telem_count_arith },
    { "jit_telem_count_logic",  (void*)jit_telem_count_logic },
    { "jit_telem_count_cmp",    (void*)jit_telem_count_cmp },
    { "jit_telem_count_branch", (void*)jit_telem_count_branch },
    { "jit_telem_count_sload",  (void*)jit_telem_count_sload },
    { "jit_telem_count_sstore", (void*)jit_telem_count_sstore },
    { "jit_telem_count_load",   (void*)jit_telem_count_load },
    { "jit_telem_count_store",  (void*)jit_telem_count_store },
    { "jit_telem_count_call",   (void*)jit_telem_count_call },
    { "jit_telem_count_const",  (void*)jit_telem_count_const },
    { "jit_telem_charge_gas",   (void*)jit_telem_charge_gas },
    { NULL, NULL }
};

void *jit_rt_resolve(const char *name) {
    int i;
    if (!name) return NULL;
    for (i = 0; g_rt_symbols[i].name; i++) {
        if (strcmp(g_rt_symbols[i].name, name) == 0)
            return g_rt_symbols[i].addr;
    }
    return NULL;
}
