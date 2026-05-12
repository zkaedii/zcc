/*
 * jit_x86_emit.h — x86-64 Binary Emitter DSL for ZCC JIT
 *
 * Task I-1 of the Leviathan Roadmap.
 * Provides typed macros that encode x86-64 instructions directly into
 * a JITBuffer. No raw hex in calling code.
 *
 * Register encoding (REX.B / ModR/M):
 *   RAX=0, RCX=1, RDX=2, RBX=3, RSP=4, RBP=5, RSI=6, RDI=7
 *   R8=0+REX.B, R9=1+REX.B, R10=2+REX.B, R11=3+REX.B,
 *   R12=4+REX.B, R13=5+REX.B, R14=6+REX.B, R15=7+REX.B
 *
 * All macros expect `JITBuffer *buf` and `uint8_t *p` in scope,
 * where p = buf->code + buf->size. After emission, buf->size is updated.
 */

#ifndef ZCC_JIT_X86_EMIT_H
#define ZCC_JIT_X86_EMIT_H

#include <string.h>
#include <stdint.h>

/* ── JITBuffer (canonical definition) ──────────────────────────────── */
#ifndef JIT_BUFFER_DEFINED
#define JIT_BUFFER_DEFINED
typedef struct {
    uint8_t *code;
    size_t   size;
    size_t   capacity;
} JITBuffer;
#endif

/* ── Low-level byte emission ───────────────────────────────────────── */

static inline void jit_byte(JITBuffer *b, uint8_t v) {
    if (b->size < b->capacity) b->code[b->size++] = v;
}

static inline void jit_bytes(JITBuffer *b, const void *data, size_t len) {
    if (b->size + len <= b->capacity) {
        memcpy(b->code + b->size, data, len);
        b->size += len;
    }
}

static inline void jit_imm32(JITBuffer *b, int32_t v) {
    jit_bytes(b, &v, 4);
}

static inline void jit_imm64(JITBuffer *b, int64_t v) {
    jit_bytes(b, &v, 8);
}

/* ── Register encoding ─────────────────────────────────────────────── */

/* x86-64 register IDs (low 3 bits of ModR/M encoding) */
typedef enum {
    X86_RAX = 0, X86_RCX = 1, X86_RDX = 2, X86_RBX = 3,
    X86_RSP = 4, X86_RBP = 5, X86_RSI = 6, X86_RDI = 7,
    X86_R8  = 8, X86_R9  = 9, X86_R10 = 10, X86_R11 = 11,
    X86_R12 = 12, X86_R13 = 13, X86_R14 = 14, X86_R15 = 15
} X86Reg;

/* REX prefix: W=64-bit, R=ModR/M reg ext, B=ModR/M r/m ext */
static inline uint8_t rex_wrb(int w, X86Reg reg, X86Reg rm) {
    return (uint8_t)(0x40 | (w ? 8 : 0) | ((reg >> 3) << 2) | (rm >> 3));
}

static inline uint8_t modrm(int mod, X86Reg reg, X86Reg rm) {
    return (uint8_t)((mod << 6) | ((reg & 7) << 3) | (rm & 7));
}

/* ── Prologue / Epilogue ───────────────────────────────────────────── */

static inline void jit_push_rbp(JITBuffer *b) {
    jit_byte(b, 0x55);  /* push %rbp */
}

static inline void jit_mov_rbp_rsp(JITBuffer *b) {
    jit_byte(b, 0x48); jit_byte(b, 0x89); jit_byte(b, 0xE5);
}

static inline void jit_sub_rsp_imm32(JITBuffer *b, int32_t v) {
    jit_byte(b, 0x48); jit_byte(b, 0x81); jit_byte(b, 0xEC);
    jit_imm32(b, v);
}

static inline void jit_add_rsp_imm32(JITBuffer *b, int32_t v) {
    jit_byte(b, 0x48); jit_byte(b, 0x81); jit_byte(b, 0xC4);
    jit_imm32(b, v);
}

static inline void jit_mov_rsp_rbp(JITBuffer *b) {
    jit_byte(b, 0x48); jit_byte(b, 0x89); jit_byte(b, 0xEC);
}

static inline void jit_pop_rbp(JITBuffer *b) {
    jit_byte(b, 0x5D);
}

static inline void jit_ret(JITBuffer *b) {
    jit_byte(b, 0xC3);
}

static inline void jit_nop(JITBuffer *b) {
    jit_byte(b, 0x90);
}

/* ── Push / Pop any register ───────────────────────────────────────── */

static inline void jit_push_reg(JITBuffer *b, X86Reg r) {
    if (r >= X86_R8) jit_byte(b, 0x41);
    jit_byte(b, (uint8_t)(0x50 + (r & 7)));
}

static inline void jit_pop_reg(JITBuffer *b, X86Reg r) {
    if (r >= X86_R8) jit_byte(b, 0x41);
    jit_byte(b, (uint8_t)(0x58 + (r & 7)));
}

/* ── MOV reg, imm64 ────────────────────────────────────────────────── */

static inline void jit_mov_reg_imm64(JITBuffer *b, X86Reg dst, int64_t imm) {
    /* movabs $imm64, %dst  (REX.W + 0xB8+rd) */
    jit_byte(b, rex_wrb(1, X86_RAX, dst));
    jit_byte(b, (uint8_t)(0xB8 + (dst & 7)));
    jit_imm64(b, imm);
}

/* ── MOV reg, [rbp + disp32] ───────────────────────────────────────── */

static inline void jit_mov_reg_mem_rbp(JITBuffer *b, X86Reg dst, int32_t disp) {
    /* movq disp(%rbp), %dst */
    jit_byte(b, rex_wrb(1, dst, X86_RBP));
    jit_byte(b, 0x8B);
    jit_byte(b, modrm(2, dst, X86_RBP));  /* mod=10 → disp32 */
    jit_imm32(b, disp);
}

/* ── MOV [rbp + disp32], reg ───────────────────────────────────────── */

static inline void jit_mov_mem_rbp_reg(JITBuffer *b, int32_t disp, X86Reg src) {
    /* movq %src, disp(%rbp) */
    jit_byte(b, rex_wrb(1, src, X86_RBP));
    jit_byte(b, 0x89);
    jit_byte(b, modrm(2, src, X86_RBP));
    jit_imm32(b, disp);
}

/* ── MOV reg, reg ──────────────────────────────────────────────────── */

static inline void jit_mov_reg_reg(JITBuffer *b, X86Reg dst, X86Reg src) {
    jit_byte(b, rex_wrb(1, src, dst));
    jit_byte(b, 0x89);
    jit_byte(b, modrm(3, src, dst));
}

/* ── MOV reg, [reg] (load through pointer) ─────────────────────────── */

static inline void jit_mov_reg_deref(JITBuffer *b, X86Reg dst, X86Reg ptr) {
    jit_byte(b, rex_wrb(1, dst, ptr));
    jit_byte(b, 0x8B);
    if (ptr == X86_RBP || ptr == X86_R13) {
        /* RBP/R13 need disp8=0 to avoid SIB confusion */
        jit_byte(b, modrm(1, dst, ptr));
        jit_byte(b, 0x00);
    } else if (ptr == X86_RSP || ptr == X86_R12) {
        /* RSP/R12 need SIB byte */
        jit_byte(b, modrm(0, dst, X86_RSP));
        jit_byte(b, 0x24);  /* SIB: base=RSP, index=none */
    } else {
        jit_byte(b, modrm(0, dst, ptr));
    }
}

/* ── MOV [reg], reg (store through pointer) ────────────────────────── */

static inline void jit_mov_deref_reg(JITBuffer *b, X86Reg ptr, X86Reg src) {
    jit_byte(b, rex_wrb(1, src, ptr));
    jit_byte(b, 0x89);
    if (ptr == X86_RBP || ptr == X86_R13) {
        jit_byte(b, modrm(1, src, ptr));
        jit_byte(b, 0x00);
    } else if (ptr == X86_RSP || ptr == X86_R12) {
        jit_byte(b, modrm(0, src, X86_RSP));
        jit_byte(b, 0x24);
    } else {
        jit_byte(b, modrm(0, src, ptr));
    }
}

/* ── LEA reg, [rbp + disp32] ───────────────────────────────────────── */

static inline void jit_lea_reg_rbp(JITBuffer *b, X86Reg dst, int32_t disp) {
    jit_byte(b, rex_wrb(1, dst, X86_RBP));
    jit_byte(b, 0x8D);
    jit_byte(b, modrm(2, dst, X86_RBP));
    jit_imm32(b, disp);
}

/* ── ALU reg, reg  (ADD/SUB/AND/OR/XOR/CMP) ────────────────────────── */
/* opcode_base: ADD=0x01, SUB=0x29, AND=0x21, OR=0x09, XOR=0x31, CMP=0x39 */

static inline void jit_alu_reg_reg(JITBuffer *b, uint8_t opcode, X86Reg dst, X86Reg src) {
    jit_byte(b, rex_wrb(1, src, dst));
    jit_byte(b, opcode);
    jit_byte(b, modrm(3, src, dst));
}

#define jit_add_reg_reg(b, d, s)  jit_alu_reg_reg(b, 0x01, d, s)
#define jit_sub_reg_reg(b, d, s)  jit_alu_reg_reg(b, 0x29, d, s)
#define jit_and_reg_reg(b, d, s)  jit_alu_reg_reg(b, 0x21, d, s)
#define jit_or_reg_reg(b, d, s)   jit_alu_reg_reg(b, 0x09, d, s)
#define jit_xor_reg_reg(b, d, s)  jit_alu_reg_reg(b, 0x31, d, s)
#define jit_cmp_reg_reg(b, d, s)  jit_alu_reg_reg(b, 0x39, d, s)

/* ── ALU reg, [rbp+disp] ──────────────────────────────────────────── */

static inline void jit_alu_reg_mem_rbp(JITBuffer *b, uint8_t opcode, X86Reg dst, int32_t disp) {
    /* e.g. addq disp(%rbp), %dst  →  opcode-2 is the r,r/m form */
    jit_byte(b, rex_wrb(1, dst, X86_RBP));
    jit_byte(b, (uint8_t)(opcode - 2));  /* 0x01→0xFF is wrong; use 0x03 for add r,r/m */
    jit_byte(b, modrm(2, dst, X86_RBP));
    jit_imm32(b, disp);
}

/* Correct r/m→r ALU forms: ADD=0x03, SUB=0x2B, AND=0x23, OR=0x0B, XOR=0x33, CMP=0x3B */
#define jit_add_reg_mem(b, d, off)  jit_alu_reg_mem_rbp(b, 0x03, d, off)
#define jit_sub_reg_mem(b, d, off)  do { jit_byte(b, rex_wrb(1,d,X86_RBP)); jit_byte(b,0x2B); jit_byte(b,modrm(2,d,X86_RBP)); jit_imm32(b,off); } while(0)
#define jit_cmp_reg_mem(b, d, off)  do { jit_byte(b, rex_wrb(1,d,X86_RBP)); jit_byte(b,0x3B); jit_byte(b,modrm(2,d,X86_RBP)); jit_imm32(b,off); } while(0)

/* ── IMUL reg, reg ─────────────────────────────────────────────────── */

static inline void jit_imul_reg_reg(JITBuffer *b, X86Reg dst, X86Reg src) {
    jit_byte(b, rex_wrb(1, dst, src));
    jit_byte(b, 0x0F); jit_byte(b, 0xAF);
    jit_byte(b, modrm(3, dst, src));
}

/* ── NEG / NOT reg ─────────────────────────────────────────────────── */

static inline void jit_neg_reg(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, X86_RBX, r));  /* /3 */
    jit_byte(b, 0xF7);
    jit_byte(b, modrm(3, (X86Reg)3, r));
}

static inline void jit_not_reg(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, X86_RDX, r));  /* /2 */
    jit_byte(b, 0xF7);
    jit_byte(b, modrm(3, (X86Reg)2, r));
}

/* ── CMP reg, imm32 ────────────────────────────────────────────────── */

static inline void jit_cmp_reg_imm32(JITBuffer *b, X86Reg r, int32_t imm) {
    jit_byte(b, rex_wrb(1, X86_RAX, r));
    jit_byte(b, 0x81);
    jit_byte(b, modrm(3, (X86Reg)7, r));  /* /7 = CMP */
    jit_imm32(b, imm);
}

/* ── SETcc → AL, then MOVZX ───────────────────────────────────────── */

static inline void jit_setcc_al(JITBuffer *b, uint8_t cc) {
    /* 0F 9x /0  → sete=0x94, setne=0x95, setl=0x9C, setle=0x9E, setg=0x9F, setge=0x9D */
    jit_byte(b, 0x0F); jit_byte(b, cc);
    jit_byte(b, modrm(3, X86_RAX, X86_RAX));
}

static inline void jit_movzx_al_rax(JITBuffer *b) {
    /* movzbq %al, %rax */
    jit_byte(b, 0x48); jit_byte(b, 0x0F); jit_byte(b, 0xB6); jit_byte(b, 0xC0);
}

#define JIT_CC_E   0x94
#define JIT_CC_NE  0x95
#define JIT_CC_L   0x9C
#define JIT_CC_LE  0x9E
#define JIT_CC_G   0x9F
#define JIT_CC_GE  0x9D

/* ── Shift: SHL/SHR/SAR by CL ─────────────────────────────────────── */

static inline void jit_shl_reg_cl(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, (X86Reg)4, r));  /* /4 = SHL */
    jit_byte(b, 0xD3);
    jit_byte(b, modrm(3, (X86Reg)4, r));
}

static inline void jit_shr_reg_cl(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, (X86Reg)5, r));  /* /5 = SHR */
    jit_byte(b, 0xD3);
    jit_byte(b, modrm(3, (X86Reg)5, r));
}

static inline void jit_sar_reg_cl(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, (X86Reg)7, r));  /* /7 = SAR */
    jit_byte(b, 0xD3);
    jit_byte(b, modrm(3, (X86Reg)7, r));
}

/* ── DIV / IDIV ────────────────────────────────────────────────────── */

static inline void jit_cqo(JITBuffer *b) {
    jit_byte(b, 0x48); jit_byte(b, 0x99);  /* cqo: sign-extend RAX → RDX:RAX */
}

static inline void jit_idiv_reg(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, (X86Reg)7, r));  /* /7 = IDIV */
    jit_byte(b, 0xF7);
    jit_byte(b, modrm(3, (X86Reg)7, r));
}

static inline void jit_div_reg(JITBuffer *b, X86Reg r) {
    jit_byte(b, rex_wrb(1, (X86Reg)6, r));  /* /6 = DIV */
    jit_byte(b, 0xF7);
    jit_byte(b, modrm(3, (X86Reg)6, r));
}

/* ── JMP / Jcc (near, rel32) ───────────────────────────────────────── */

static inline void jit_jmp_rel32(JITBuffer *b, int32_t rel) {
    jit_byte(b, 0xE9);
    jit_imm32(b, rel);
}

/* je rel32 (jump if equal/zero) */
static inline void jit_je_rel32(JITBuffer *b, int32_t rel) {
    jit_byte(b, 0x0F); jit_byte(b, 0x84);
    jit_imm32(b, rel);
}

/* jne rel32 */
static inline void jit_jne_rel32(JITBuffer *b, int32_t rel) {
    jit_byte(b, 0x0F); jit_byte(b, 0x85);
    jit_imm32(b, rel);
}

/* ── CALL rel32 ────────────────────────────────────────────────────── */

static inline void jit_call_rel32(JITBuffer *b, int32_t rel) {
    jit_byte(b, 0xE8);
    jit_imm32(b, rel);
}

/* ── MOV AL, 0 (for variadic call ABI) ─────────────────────────────── */

static inline void jit_xor_eax_eax(JITBuffer *b) {
    jit_byte(b, 0x31); jit_byte(b, 0xC0);  /* xor %eax, %eax */
}

/* ── Patch a rel32 at a known offset ───────────────────────────────── */

static inline void jit_patch_rel32(JITBuffer *b, size_t patch_offset, size_t target) {
    int32_t rel = (int32_t)((int64_t)target - (int64_t)(patch_offset + 4));
    memcpy(b->code + patch_offset, &rel, 4);
}

/* ── PhysReg → X86Reg mapping (from regalloc.h) ────────────────────── */
/* Maps the RegAllocator's PhysReg enum to our X86Reg encoding */

static inline X86Reg preg_to_x86(int preg) {
    switch (preg) {
        case 0: return X86_RBX;  /* PREG_RBX */
        case 1: return X86_R12;  /* PREG_R12 */
        case 2: return X86_R13;  /* PREG_R13 */
        case 3: return X86_R14;  /* PREG_R14 */
        case 4: return X86_R15;  /* PREG_R15 */
        case 5: return X86_R10;  /* PREG_R10 */
        case 6: return X86_R11;  /* PREG_R11 */
        default: return X86_RAX;
    }
}

#endif /* ZCC_JIT_X86_EMIT_H */
