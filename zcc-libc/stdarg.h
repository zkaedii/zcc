/* zcc-libc/stdarg.h — SysV ABI-compliant va_list
 * Uses __builtin_va_start/va_end which ZCC handles natively.
 * va_arg uses struct field access (no __builtin needed).
 */

/* va_list is a 24-byte struct on x86-64 SysV ABI, wrapped in array[1]
 * for pass-by-reference semantics */
typedef struct {
    unsigned int gp_offset;
    unsigned int fp_offset;
    void *overflow_arg_area;
    void *reg_save_area;
} __va_list_tag;

typedef __va_list_tag va_list[1];
typedef va_list __gnuc_va_list;

#define va_start(v,l) __builtin_va_start(v, l)
#define va_end(v) __builtin_va_end(v)
#define va_copy(d, s) ((d)[0] = (s)[0])

/* va_arg — read from register save area using gp_offset, then advance.
 * For integer/pointer types only (all types <= 8 bytes go through GP regs).
 * Double/float would use fp_offset — not needed for curl's usage. */
#define va_arg(v, type) \
  (*(type *)((char *)(v)[0].reg_save_area + \
    ((v)[0].gp_offset += 8, (v)[0].gp_offset - 8)))
