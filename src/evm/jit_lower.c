/*
 * jit_lower.c — IR → x86-64 Binary Lowering for ZCC JIT
 *
 * Task I-2 of the Leviathan Roadmap.
 * Mirrors ir_to_x86.c but emits machine code bytes into a JITBuffer
 * instead of AT&T assembly text into a FILE*.
 *
 * Uses the same linear-scan register allocator (regalloc.h).
 * Uses the jit_x86_emit.h DSL — no raw hex in this file.
 */

#include "jit_x86_emit.h"
#include "../../ir.h"
#include "../../regalloc.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>

/* Forward declaration for EVM runtime symbol resolver */
extern void *jit_rt_resolve(const char *name);

/* ── Telemetry compile-time flag ────────────────────────────────────── */
/* Set to 1 to emit telemetry/gas instrumentation in JIT'd code.
 * When 0, zero overhead — no counter calls emitted. */
static int g_jit_telem_enabled = 1;

/* Emit a call to a telemetry counter function.
 * Saves/restores RAX since the counter may clobber it. */
static void jit_emit_telem_call(JITBuffer *buf, const char *counter_name) {
    void *fn = jit_rt_resolve(counter_name);
    if (!fn || !g_jit_telem_enabled) return;
    /* push rax (save any in-progress value) */
    jit_byte(buf, 0x50);
    /* movabs rax, <fn> */
    jit_mov_reg_imm64(buf, X86_RAX, (int64_t)(uintptr_t)fn);
    /* call rax */
    jit_byte(buf, 0xFF);
    jit_byte(buf, 0xD0);
    /* pop rax (restore) */
    jit_byte(buf, 0x58);
}

/* ── Stack slot tracker (mirrors ir_to_x86.c) ─────────────────────── */

#define JIT_MAX_VARS 4096

typedef struct {
    char name[IR_NAME_MAX];
    int  offset;        /* negative offset from RBP */
} JitVar;

typedef struct {
    JitVar vars[JIT_MAX_VARS];
    int    num_vars;
    int    next_offset;  /* next available stack offset (grows negative) */
} JitVarTable;

static int jvt_get_or_create(JitVarTable *t, const char *name) {
    int i;
    if (!name || name[0] == '\0' || name[0] == '-') return 0;

    for (i = 0; i < t->num_vars; i++) {
        if (strcmp(t->vars[i].name, name) == 0)
            return t->vars[i].offset;
    }

    if (t->num_vars >= JIT_MAX_VARS) {
        fprintf(stderr, "[jit_lower] FATAL: variable table overflow\n");
        return 0;
    }

    strncpy(t->vars[t->num_vars].name, name, IR_NAME_MAX - 1);
    t->vars[t->num_vars].name[IR_NAME_MAX - 1] = '\0';
    t->vars[t->num_vars].offset = t->next_offset;
    int off = t->next_offset;
    t->next_offset -= 8;
    t->num_vars++;
    return off;
}

/* ── Label table for branch resolution ─────────────────────────────── */

#define JIT_MAX_LABELS 2048

typedef struct {
    char   name[IR_LABEL_MAX];
    size_t offset;  /* byte offset in JITBuffer where label lives */
} JitLabel;

typedef struct {
    char   label[IR_LABEL_MAX];
    size_t patch_site;  /* byte offset of the rel32 to patch */
} JitPatch;

typedef struct {
    JitLabel labels[JIT_MAX_LABELS];
    int      num_labels;
    JitPatch patches[JIT_MAX_LABELS * 2];
    int      num_patches;
} JitLabelTable;

static void jlt_define(JitLabelTable *t, const char *name, size_t offset) {
    if (t->num_labels >= JIT_MAX_LABELS) return;
    strncpy(t->labels[t->num_labels].name, name, IR_LABEL_MAX - 1);
    t->labels[t->num_labels].offset = offset;
    t->num_labels++;
}

static void jlt_add_patch(JitLabelTable *t, const char *label, size_t site) {
    if (t->num_patches >= JIT_MAX_LABELS * 2) return;
    strncpy(t->patches[t->num_patches].label, label, IR_LABEL_MAX - 1);
    t->patches[t->num_patches].patch_site = site;
    t->num_patches++;
}

static void jlt_resolve(JitLabelTable *t, JITBuffer *buf) {
    int i, j;
    for (i = 0; i < t->num_patches; i++) {
        for (j = 0; j < t->num_labels; j++) {
            if (strcmp(t->patches[i].label, t->labels[j].name) == 0) {
                jit_patch_rel32(buf, t->patches[i].patch_site, t->labels[j].offset);
                break;
            }
        }
    }
}

/* ── Operand helpers (register-aware, mirrors ir_to_x86.c) ─────────── */

static void jit_load_operand(JITBuffer *b, const char *src, X86Reg dst_reg,
                              const RegAllocator *ra, JitVarTable *vt) {
    if (ra) {
        PhysReg pr = ra_get(ra, src);
        if (pr != PREG_NONE && pr < PREG_XMM0) {
            X86Reg xr = preg_to_x86(pr);
            if (xr != dst_reg)
                jit_mov_reg_reg(b, dst_reg, xr);
            return;
        }
    }
    int off = jvt_get_or_create(vt, src);
    jit_mov_reg_mem_rbp(b, dst_reg, off);
}

static void jit_store_result(JITBuffer *b, const char *dst, X86Reg src_reg,
                              const RegAllocator *ra, JitVarTable *vt) {
    if (ra) {
        PhysReg pr = ra_get(ra, dst);
        if (pr != PREG_NONE && pr < PREG_XMM0) {
            X86Reg xr = preg_to_x86(pr);
            if (xr != src_reg)
                jit_mov_reg_reg(b, xr, src_reg);
            return;
        }
    }
    int off = jvt_get_or_create(vt, dst);
    jit_mov_mem_rbp_reg(b, off, src_reg);
}

static void jit_load_address(JITBuffer *b, const char *src, X86Reg dst,
                              const RegAllocator *ra, JitVarTable *vt) {
    if (strncmp(src, "%t", 2) == 0 && ra) {
        PhysReg pr = ra_get(ra, src);
        if (pr != PREG_NONE && pr < PREG_XMM0) {
            X86Reg xr = preg_to_x86(pr);
            if (xr != dst)
                jit_mov_reg_reg(b, dst, xr);
            return;
        }
    }
    /* Stack variable or temp on stack: lea dst, [rbp+off] */
    int off = jvt_get_or_create(vt, src);
    jit_lea_reg_rbp(b, dst, off);
}

/* ── Main lowering: single IR function → JITBuffer ─────────────────── */

void *jit_lower_func(ir_func_t *fn, JITBuffer *buf) {
    if (!fn || !buf) return NULL;

    JitVarTable vt;
    JitLabelTable lt;
    ir_node_t *n;
    int arg_idx = 0;

    memset(&vt, 0, sizeof(vt));
    memset(&lt, 0, sizeof(lt));
    vt.next_offset = -8;

    /* Run register allocator */
    RegAllocator *ra = ra_create();
    ra_run(ra, fn);

    /* Pass 1: Pre-allocate stack slots for all vars/temps */
    for (n = fn->head; n; n = n->next) {
        if (n->dst[0]  && n->dst[0]  != '-') jvt_get_or_create(&vt, n->dst);
        if (n->src1[0] && n->src1[0] != '-') jvt_get_or_create(&vt, n->src1);
        if (n->src2[0] && n->src2[0] != '-') jvt_get_or_create(&vt, n->src2);
        if (n->op == IR_ALLOCA) vt.next_offset -= (int)n->imm;
    }

    int stack_size = -vt.next_offset + 40;
    stack_size = (stack_size + 15) & ~15;

    /* Record function start */
    size_t func_start = buf->size;

    /* Prologue */
    jit_push_rbp(buf);
    jit_mov_rbp_rsp(buf);
    jit_sub_rsp_imm32(buf, stack_size);

    /* Save callee-saved registers used by allocator */
    if (ra->used[PREG_RBX])  jit_push_reg(buf, X86_RBX);
    if (ra->used[PREG_R12])  jit_push_reg(buf, X86_R12);
    if (ra->used[PREG_R13])  jit_push_reg(buf, X86_R13);
    if (ra->used[PREG_R14])  jit_push_reg(buf, X86_R14);
    if (ra->used[PREG_R15])  jit_push_reg(buf, X86_R15);

    /* Store incoming parameters (System V: rdi, rsi, rdx, rcx, r8, r9) */
    {
        static const X86Reg arg_regs[6] = {
            X86_RDI, X86_RSI, X86_RDX, X86_RCX, X86_R8, X86_R9
        };
        for (int pnum = 0; pnum < fn->num_params && pnum < 6; pnum++) {
            char pname[32];
            sprintf(pname, "%%stack_%d", -8 * (pnum + 1));
            int off = jvt_get_or_create(&vt, pname);
            jit_mov_mem_rbp_reg(buf, off, arg_regs[pnum]);
        }
    }

    /* Pass 2: Emit machine code */
    arg_idx = 0;

    for (n = fn->head; n; n = n->next) {
        switch (n->op) {

        case IR_CONST: {
            jit_emit_telem_call(buf, "jit_telem_count_const");
            jit_mov_reg_imm64(buf, X86_RAX, n->imm);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_ADD: case IR_SUB: case IR_MUL:
        case IR_AND: case IR_OR:  case IR_XOR: {
            if (n->op == IR_AND || n->op == IR_OR || n->op == IR_XOR)
                jit_emit_telem_call(buf, "jit_telem_count_logic");
            else
                jit_emit_telem_call(buf, "jit_telem_count_arith");
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_load_operand(buf, n->src2, X86_RCX, ra, &vt);
            if      (n->op == IR_ADD) jit_add_reg_reg(buf, X86_RAX, X86_RCX);
            else if (n->op == IR_SUB) jit_sub_reg_reg(buf, X86_RAX, X86_RCX);
            else if (n->op == IR_MUL) jit_imul_reg_reg(buf, X86_RAX, X86_RCX);
            else if (n->op == IR_AND) jit_and_reg_reg(buf, X86_RAX, X86_RCX);
            else if (n->op == IR_OR)  jit_or_reg_reg(buf, X86_RAX, X86_RCX);
            else if (n->op == IR_XOR) jit_xor_reg_reg(buf, X86_RAX, X86_RCX);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_SHL: case IR_SHR: {
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_load_operand(buf, n->src2, X86_RCX, ra, &vt);
            if (n->op == IR_SHL)
                jit_shl_reg_cl(buf, X86_RAX);
            else if (ir_type_unsigned(n->type))
                jit_shr_reg_cl(buf, X86_RAX);
            else
                jit_sar_reg_cl(buf, X86_RAX);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_DIV: case IR_MOD: {
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_load_operand(buf, n->src2, X86_RCX, ra, &vt);
            if (ir_type_unsigned(n->type)) {
                jit_xor_eax_eax(buf);  /* actually: xor rdx,rdx */
                /* xor %rdx, %rdx */
                jit_byte(buf, 0x48); jit_byte(buf, 0x31); jit_byte(buf, 0xD2);
                /* reload RAX since we just zeroed it */
                jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
                jit_div_reg(buf, X86_RCX);
            } else {
                jit_cqo(buf);
                jit_idiv_reg(buf, X86_RCX);
            }
            if (n->op == IR_MOD)
                jit_store_result(buf, n->dst, X86_RDX, ra, &vt);
            else
                jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_NEG: case IR_NOT: {
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            if (n->op == IR_NEG) jit_neg_reg(buf, X86_RAX);
            else                 jit_not_reg(buf, X86_RAX);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_EQ: case IR_NE: case IR_LT:
        case IR_LE: case IR_GT: case IR_GE: {
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_load_operand(buf, n->src2, X86_RCX, ra, &vt);
            jit_cmp_reg_reg(buf, X86_RAX, X86_RCX);
            uint8_t cc = JIT_CC_E;
            if      (n->op == IR_EQ) cc = JIT_CC_E;
            else if (n->op == IR_NE) cc = JIT_CC_NE;
            else if (n->op == IR_LT) cc = JIT_CC_L;
            else if (n->op == IR_LE) cc = JIT_CC_LE;
            else if (n->op == IR_GT) cc = JIT_CC_G;
            else if (n->op == IR_GE) cc = JIT_CC_GE;
            jit_setcc_al(buf, cc);
            jit_movzx_al_rax(buf);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_LOAD: {
            /* Labeled load (e.g., __evm_sload): convert to runtime call */
            if (n->label[0] && jit_rt_resolve(n->label)) {
                if (strncmp(n->label, "__evm_sload", 11) == 0 ||
                    strncmp(n->label, "__evm_tload", 11) == 0)
                    jit_emit_telem_call(buf, "jit_telem_count_sload");
                else
                    jit_emit_telem_call(buf, "jit_telem_count_load");
                void *target = jit_rt_resolve(n->label);
                /* Load key into RDI (arg 1) */
                jit_load_operand(buf, n->src1, X86_RDI, ra, &vt);
                /* movabs rax, <runtime fn> ; call rax */
                jit_mov_reg_imm64(buf, X86_RAX, (int64_t)(uintptr_t)target);
                jit_byte(buf, 0xFF);
                jit_byte(buf, modrm(3, (X86Reg)2, X86_RAX));
                /* Result in RAX */
                jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            } else {
                jit_load_address(buf, n->src1, X86_RAX, ra, &vt);
                jit_mov_reg_deref(buf, X86_RAX, X86_RAX);
                jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            }
            break;
        }

        case IR_STORE: {
            /* Labeled store (e.g., __evm_sstore): convert to runtime call */
            if (n->label[0] && jit_rt_resolve(n->label)) {
                if (strncmp(n->label, "__evm_sstore", 12) == 0 ||
                    strncmp(n->label, "__evm_tstore", 12) == 0)
                    jit_emit_telem_call(buf, "jit_telem_count_sstore");
                else
                    jit_emit_telem_call(buf, "jit_telem_count_store");
                void *target = jit_rt_resolve(n->label);
                /* Load key into RDI (arg 1), value into RSI (arg 2) */
                jit_load_operand(buf, n->dst, X86_RDI, ra, &vt);
                jit_load_operand(buf, n->src1, X86_RSI, ra, &vt);
                /* movabs rax, <runtime fn> ; call rax */
                jit_mov_reg_imm64(buf, X86_RAX, (int64_t)(uintptr_t)target);
                jit_byte(buf, 0xFF);
                jit_byte(buf, modrm(3, (X86Reg)2, X86_RAX));
            } else {
                jit_load_operand(buf, n->src1, X86_RCX, ra, &vt);
                jit_load_address(buf, n->dst, X86_RAX, ra, &vt);
                jit_mov_deref_reg(buf, X86_RAX, X86_RCX);
            }
            break;
        }

        case IR_ALLOCA: {
            int off = jvt_get_or_create(&vt, n->dst);
            jit_lea_reg_rbp(buf, X86_RAX, off - (int)n->imm);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_COPY: case IR_CAST: {
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            break;
        }

        case IR_LABEL: {
            jlt_define(&lt, n->label, buf->size);
            break;
        }

        case IR_BR: {
            jit_emit_telem_call(buf, "jit_telem_count_branch");
            /* jmp rel32 — patch later */
            jit_byte(buf, 0xE9);
            jlt_add_patch(&lt, n->label, buf->size);
            jit_imm32(buf, 0);  /* placeholder */
            break;
        }

        case IR_BR_IF: {
            jit_emit_telem_call(buf, "jit_telem_count_branch");
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            jit_cmp_reg_imm32(buf, X86_RAX, 0);
            /* EVM JUMPI: jump when condition is NON-ZERO → jne (0x0F 0x85)
             * C IR_BR_IF: jump when condition is ZERO → je (0x0F 0x84)
             * Detect EVM labels by ".L_evm_" prefix */
            jit_byte(buf, 0x0F);
            if (strncmp(n->label, ".L_evm_", 7) == 0)
                jit_byte(buf, 0x85);  /* jne rel32 — EVM JUMPI semantics */
            else
                jit_byte(buf, 0x84);  /* je rel32  — C branch semantics */
            jlt_add_patch(&lt, n->label, buf->size);
            jit_imm32(buf, 0);
            break;
        }

        case IR_ARG: {
            static const X86Reg aregs[6] = {
                X86_RDI, X86_RSI, X86_RDX, X86_RCX, X86_R8, X86_R9
            };
            jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            if (arg_idx < 6) {
                jit_mov_reg_reg(buf, aregs[arg_idx], X86_RAX);
            } else {
                jit_push_reg(buf, X86_RAX);
            }
            arg_idx++;
            break;
        }

        case IR_CALL: {
            jit_emit_telem_call(buf, "jit_telem_count_call");
            /* Resolve the function name to a host address */
            void *target = jit_rt_resolve(n->label);
            if (target) {
                /* movabs rax, <host function pointer> */
                jit_mov_reg_imm64(buf, X86_RAX, (int64_t)(uintptr_t)target);
                /* call rax */
                jit_byte(buf, 0xFF);
                jit_byte(buf, modrm(3, (X86Reg)2, X86_RAX));  /* /2 = CALL r/m64 */
            } else {
                /* Unresolved: emit NOP sled + warning */
                jit_nop(buf); jit_nop(buf); jit_nop(buf); jit_nop(buf); jit_nop(buf);
            }
            if (n->dst[0] && n->dst[0] != '-')
                jit_store_result(buf, n->dst, X86_RAX, ra, &vt);
            arg_idx = 0;
            break;
        }

        case IR_RET: {
            if (n->src1[0] && n->src1[0] != '-')
                jit_load_operand(buf, n->src1, X86_RAX, ra, &vt);
            /* Restore callee-saved */
            if (ra->used[PREG_R15]) jit_pop_reg(buf, X86_R15);
            if (ra->used[PREG_R14]) jit_pop_reg(buf, X86_R14);
            if (ra->used[PREG_R13]) jit_pop_reg(buf, X86_R13);
            if (ra->used[PREG_R12]) jit_pop_reg(buf, X86_R12);
            if (ra->used[PREG_RBX]) jit_pop_reg(buf, X86_RBX);
            jit_mov_rsp_rbp(buf);
            jit_pop_rbp(buf);
            jit_ret(buf);
            break;
        }

        default:
            jit_nop(buf);
            break;
        }
    }

    /* Resolve all branch targets */
    jlt_resolve(&lt, buf);

    ra_free(ra);

    return (void *)(buf->code + func_start);
}
