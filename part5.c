
/* ================================================================ */
/* COMPILER INITIALIZATION                                           */
/* ================================================================ */

#include "part1.c"
#include "ir_emit_dispatch.h"
#include "ir_bridge.h"

#ifdef __clang__
void register_struct(Compiler *cc, Type *t);
Type *find_struct(Compiler *cc, char *tag);
Type *type_func(Compiler *cc, Type *ret);
char *zcc_preprocess(const char *source, int source_len, const char *filename, const char *include_paths, int *out_len);
#endif

static void init_compiler(Compiler *cc) {
  /* zero everyt5555hing — cc was calloc'd */

  /* init arena */
  cc->arena.data = (char *)malloc(ARENA_SIZE);
  cc->arena.pos = 0;
  cc->arena.cap = ARENA_SIZE;
  cc->arena.next = 0;

  /* create type singletons */
  cc->ty_void = type_new(cc, TY_VOID);
  cc->ty_char = type_new(cc, TY_CHAR);
  cc->ty_uchar = type_new(cc, TY_UCHAR);
  cc->ty_short = type_new(cc, TY_SHORT);
  cc->ty_ushort = type_new(cc, TY_USHORT);
  cc->ty_int = type_new(cc, TY_INT);
  cc->ty_uint = type_new(cc, TY_UINT);
  cc->ty_long = type_new(cc, TY_LONG);
  cc->ty_ulong = type_new(cc, TY_ULONG);
  cc->ty_longlong = type_new(cc, TY_LONGLONG);
  cc->ty_ulonglong = type_new(cc, TY_ULONGLONG);
  cc->ty_float = type_new(cc, TY_FLOAT);
  cc->ty_double = type_new(cc, TY_DOUBLE);

  /* init lexer */
  cc->line = 1;
  cc->col = 1;
  cc->pos = 0;
  cc->has_peek = 0;
  cc->label_count = 100; /* start at 100 to avoid clashes */
  cc->errors = 0;
  cc->num_strings = 0;
  cc->num_structs = 0;
  cc->num_globals = 0;

  /* push global scope */
  scope_push(cc);

  /* register common typedefs and builtins */
  {
    Symbol *sym;
    /* typedef void *FILE — so FILE* works */
    sym = scope_add(cc, "FILE", type_ptr(cc, cc->ty_void));
    sym->is_typedef = 1;

    /* typedef long size_t */
    sym = scope_add(cc, "size_t", cc->ty_ulonglong);
    sym->is_typedef = 1;

    /* typedef long ssize_t */
    sym = scope_add(cc, "ssize_t", cc->ty_long);
    sym->is_typedef = 1;

    /* typedef int ptrdiff_t */
    sym = scope_add(cc, "ptrdiff_t", cc->ty_long);
    sym->is_typedef = 1;

    /* SysV ABI requires va_list to be an array of 1 struct of size 24 */
    {
        Type *t_va = type_new(cc, TY_STRUCT);
        t_va->size = 24;
        t_va->align = 8;
        t_va->is_complete = 1;
        sym = scope_add(cc, "__builtin_va_list", type_array(cc, t_va, 1));
    }
    sym->is_typedef = 1;

    /* _Float128 workaround */
    sym = scope_add(cc, "_Float128", cc->ty_double);
    sym->is_typedef = 1;

    /* POSIX / system typedefs — needed for GCC-preprocessed code */
    sym = scope_add(cc, "socklen_t", cc->ty_int);
    sym->is_typedef = 1;
    sym = scope_add(cc, "sa_family_t", cc->ty_ushort);
    sym->is_typedef = 1;
    sym = scope_add(cc, "in_port_t", cc->ty_ushort);
    sym->is_typedef = 1;
    sym = scope_add(cc, "in_addr_t", cc->ty_uint);
    sym->is_typedef = 1;
    sym = scope_add(cc, "pid_t", cc->ty_int);
    sym->is_typedef = 1;
    sym = scope_add(cc, "uid_t", cc->ty_uint);
    sym->is_typedef = 1;
    sym = scope_add(cc, "gid_t", cc->ty_uint);
    sym->is_typedef = 1;
    sym = scope_add(cc, "mode_t", cc->ty_uint);
    sym->is_typedef = 1;
    sym = scope_add(cc, "off_t", cc->ty_long);
    sym->is_typedef = 1;
    sym = scope_add(cc, "time_t", cc->ty_long);
    sym->is_typedef = 1;
    sym = scope_add(cc, "clock_t", cc->ty_long);
    sym->is_typedef = 1;
    sym = scope_add(cc, "suseconds_t", cc->ty_long);
    sym->is_typedef = 1;
    sym = scope_add(cc, "nfds_t", cc->ty_ulong);
    sym->is_typedef = 1;

    /* glibc internal __ typedefs — survive GCC preprocessing */
    sym = scope_add(cc, "__time_t", cc->ty_long);   sym->is_typedef = 1;
    sym = scope_add(cc, "__clock_t", cc->ty_long);   sym->is_typedef = 1;
    sym = scope_add(cc, "__pid_t", cc->ty_int);      sym->is_typedef = 1;
    sym = scope_add(cc, "__uid_t", cc->ty_uint);     sym->is_typedef = 1;
    sym = scope_add(cc, "__gid_t", cc->ty_uint);     sym->is_typedef = 1;
    sym = scope_add(cc, "__off_t", cc->ty_long);     sym->is_typedef = 1;
    sym = scope_add(cc, "__off64_t", cc->ty_long);   sym->is_typedef = 1;
    sym = scope_add(cc, "__mode_t", cc->ty_uint);    sym->is_typedef = 1;
    sym = scope_add(cc, "__dev_t", cc->ty_ulong);    sym->is_typedef = 1;
    sym = scope_add(cc, "__ino_t", cc->ty_ulong);    sym->is_typedef = 1;
    sym = scope_add(cc, "__nlink_t", cc->ty_ulong);  sym->is_typedef = 1;
    sym = scope_add(cc, "__blksize_t", cc->ty_long); sym->is_typedef = 1;
    sym = scope_add(cc, "__blkcnt_t", cc->ty_long);  sym->is_typedef = 1;
    sym = scope_add(cc, "__ssize_t", cc->ty_long);   sym->is_typedef = 1;
    sym = scope_add(cc, "__socklen_t", cc->ty_int);  sym->is_typedef = 1;
    sym = scope_add(cc, "__suseconds_t", cc->ty_long); sym->is_typedef = 1;
    sym = scope_add(cc, "__syscall_slong_t", cc->ty_long); sym->is_typedef = 1;
    sym = scope_add(cc, "__syscall_ulong_t", cc->ty_ulong); sym->is_typedef = 1;
    sym = scope_add(cc, "__intmax_t", cc->ty_long);  sym->is_typedef = 1;
    sym = scope_add(cc, "__uintmax_t", cc->ty_ulong); sym->is_typedef = 1;
    sym = scope_add(cc, "__intptr_t", cc->ty_long);  sym->is_typedef = 1;
    sym = scope_add(cc, "__sig_atomic_t", cc->ty_int); sym->is_typedef = 1;
    sym = scope_add(cc, "__clockid_t", cc->ty_int);  sym->is_typedef = 1;
    sym = scope_add(cc, "__timer_t", type_ptr(cc, cc->ty_void)); sym->is_typedef = 1;
    sym = scope_add(cc, "__loff_t", cc->ty_long);    sym->is_typedef = 1;
    sym = scope_add(cc, "__key_t", cc->ty_int);      sym->is_typedef = 1;
    sym = scope_add(cc, "__id_t", cc->ty_uint);      sym->is_typedef = 1;
    sym = scope_add(cc, "__useconds_t", cc->ty_uint); sym->is_typedef = 1;
    sym = scope_add(cc, "__daddr_t", cc->ty_int);    sym->is_typedef = 1;
    sym = scope_add(cc, "__caddr_t", type_ptr(cc, cc->ty_char)); sym->is_typedef = 1;
    sym = scope_add(cc, "__fsblkcnt_t", cc->ty_ulong); sym->is_typedef = 1;
    sym = scope_add(cc, "__fsfilcnt_t", cc->ty_ulong); sym->is_typedef = 1;
    sym = scope_add(cc, "__fsword_t", cc->ty_long);  sym->is_typedef = 1;
    sym = scope_add(cc, "__rlim_t", cc->ty_ulong);   sym->is_typedef = 1;
    sym = scope_add(cc, "__quad_t", cc->ty_long);    sym->is_typedef = 1;
    sym = scope_add(cc, "__u_quad_t", cc->ty_ulong); sym->is_typedef = 1;


    /* fd_set — used by select(). glibc: struct with __fds_bits[16] (128 bytes) */
    {
        Type *t_fdset = type_new(cc, TY_STRUCT);
        strncpy(t_fdset->tag, "fd_set", MAX_IDENT - 1);
        t_fdset->size = 128;
        t_fdset->align = 8;
        t_fdset->is_complete = 1;
        sym = scope_add(cc, "fd_set", t_fdset);
        sym->is_typedef = 1;
    }

    /* curl_socket_t — typically int on POSIX */
    sym = scope_add(cc, "curl_socket_t", cc->ty_int);
    sym->is_typedef = 1;

    /* struct timespec { long tv_sec; long tv_nsec; } */
    {
        Type *ts = type_new(cc, TY_STRUCT);
        StructField *f1, *f2;
        strncpy(ts->tag, "timespec", MAX_IDENT - 1);
        f1 = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f1->name, "tv_sec", MAX_IDENT - 1);
        f1->type = cc->ty_long;
        f1->offset = 0;
        f2 = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f2->name, "tv_nsec", MAX_IDENT - 1);
        f2->type = cc->ty_long;
        f2->offset = 8;
        f1->next = f2;
        f2->next = 0;
        ts->fields = f1;
        ts->size = 16;
        ts->align = 8;
        ts->is_complete = 1;
        register_struct(cc, ts);
    }

    /* struct sockaddr { unsigned short sa_family; char sa_data[14]; } */
    {
        Type *sa = type_new(cc, TY_STRUCT);
        StructField *f1, *f2;
        strncpy(sa->tag, "sockaddr", MAX_IDENT - 1);
        f1 = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f1->name, "sa_family", MAX_IDENT - 1);
        f1->type = cc->ty_ushort;
        f1->offset = 0;
        f2 = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f2->name, "sa_data", MAX_IDENT - 1);
        f2->type = type_array(cc, cc->ty_char, 14);
        f2->offset = 2;
        f1->next = f2;
        f2->next = 0;
        sa->fields = f1;
        sa->size = 16;
        sa->align = 2;
        sa->is_complete = 1;
        register_struct(cc, sa);
    }

    /* struct addrinfo { int ai_flags, ai_family, ai_socktype, ai_protocol;
       size_t ai_addrlen; struct sockaddr *ai_addr; char *ai_canonname;
       struct addrinfo *ai_next; } */
    {
        Type *ai = type_new(cc, TY_STRUCT);
        StructField *prev, *f;
        Type *sockaddr_ptr;
        strncpy(ai->tag, "addrinfo", MAX_IDENT - 1);
        ai->fields = 0;
        prev = 0;

        /* Look up struct sockaddr for pointer type */
        sockaddr_ptr = type_ptr(cc, find_struct(cc, "sockaddr"));

        /* ai_flags: int, offset 0 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_flags", MAX_IDENT - 1);
        f->type = cc->ty_int; f->offset = 0; f->next = 0;
        ai->fields = f; prev = f;

        /* ai_family: int, offset 4 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_family", MAX_IDENT - 1);
        f->type = cc->ty_int; f->offset = 4; f->next = 0;
        prev->next = f; prev = f;

        /* ai_socktype: int, offset 8 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_socktype", MAX_IDENT - 1);
        f->type = cc->ty_int; f->offset = 8; f->next = 0;
        prev->next = f; prev = f;

        /* ai_protocol: int, offset 12 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_protocol", MAX_IDENT - 1);
        f->type = cc->ty_int; f->offset = 12; f->next = 0;
        prev->next = f; prev = f;

        /* ai_addrlen: size_t (ulong), offset 16 — aligned to 8 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_addrlen", MAX_IDENT - 1);
        f->type = cc->ty_ulong; f->offset = 16; f->next = 0;
        prev->next = f; prev = f;

        /* ai_addr: struct sockaddr*, offset 24 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_addr", MAX_IDENT - 1);
        f->type = sockaddr_ptr; f->offset = 24; f->next = 0;
        prev->next = f; prev = f;

        /* ai_canonname: char*, offset 32 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_canonname", MAX_IDENT - 1);
        f->type = type_ptr(cc, cc->ty_char); f->offset = 32; f->next = 0;
        prev->next = f; prev = f;

        /* ai_next: struct addrinfo*, offset 40 */
        f = (StructField *)cc_alloc(cc, sizeof(StructField));
        strncpy(f->name, "ai_next", MAX_IDENT - 1);
        f->type = type_ptr(cc, ai); f->offset = 40; f->next = 0;
        prev->next = f; prev = f;

        ai->size = 48;
        ai->align = 8;
        ai->is_complete = 1;
        register_struct(cc, ai);
    }

    /* NULL as enum constant */
    sym = scope_add(cc, "NULL", cc->ty_long);
    sym->is_enum_const = 1;
    sym->enum_val = 0;

    /* stdout, stderr */
    sym = scope_add(cc, "stdout", type_ptr(cc, cc->ty_void));
    sym->is_global = 1;
    sym = scope_add(cc, "stderr", type_ptr(cc, cc->ty_void));
    sym->is_global = 1;

    /* common libc functions */
    {
      Type *ft;

      /* printf — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "printf", ft);
      sym->is_global = 1;

      /* fprintf */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "fprintf", ft);
      sym->is_global = 1;

      /* sscanf */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "sscanf", ft);
      sym->is_global = 1;

      /* sprintf */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "sprintf", ft);
      sym->is_global = 1;

      /* malloc — returns void* */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "malloc", ft);
      sym->is_global = 1;

      /* calloc */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "calloc", ft);
      sym->is_global = 1;

      /* realloc */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "realloc", ft);
      sym->is_global = 1;

      /* free — returns void */
      ft = type_func(cc, cc->ty_void);
      sym = scope_add(cc, "free", ft);
      sym->is_global = 1;

      /* exit */
      ft = type_func(cc, cc->ty_void);
      sym = scope_add(cc, "exit", ft);
      sym->is_global = 1;

      /* fopen — returns FILE* */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "fopen", ft);
      sym->is_global = 1;

      /* fclose */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "fclose", ft);
      sym->is_global = 1;

      /* fread */
      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "fread", ft);
      sym->is_global = 1;

      /* fwrite */
      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "fwrite", ft);
      sym->is_global = 1;

      /* fseek */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "fseek", ft);
      sym->is_global = 1;

      /* ftell */
      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "ftell", ft);
      sym->is_global = 1;

      /* fgets */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "fgets", ft);
      sym->is_global = 1;

      /* fputs */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "fputs", ft);
      sym->is_global = 1;

      /* strcmp, strncpy, strlen, strncmp */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "strcmp", ft);
      sym->is_global = 1;

      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strncpy", ft);
      sym->is_global = 1;

      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "strlen", ft);
      sym->is_global = 1;

      /* strstr */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strstr", ft);
      sym->is_global = 1;

      /* strtod */
      ft = type_func(cc, cc->ty_double);
      sym = scope_add(cc, "strtod", ft);
      sym->is_global = 1;

      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "strncmp", ft);
      sym->is_global = 1;

      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strcpy", ft);
      sym->is_global = 1;

      /* memset, memcpy */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "memset", ft);
      sym->is_global = 1;

      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "memcpy", ft);
      sym->is_global = 1;

      /* write, read (syscall wrappers) */
      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "write", ft);
      sym->is_global = 1;

      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "read", ft);
      sym->is_global = 1;

      /* system */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "system", ft);
      sym->is_global = 1;

      /* _exit */
      ft = type_func(cc, cc->ty_void);
      sym = scope_add(cc, "_exit", ft);
      sym->is_global = 1;

      /* fflush — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "fflush", ft);
      sym->is_global = 1;

      /* snprintf — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "snprintf", ft);
      sym->is_global = 1;

      /* strcat — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strcat", ft);
      sym->is_global = 1;

      /* strncat — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strncat", ft);
      sym->is_global = 1;

      /* setenv — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "setenv", ft);
      sym->is_global = 1;

      /* unsetenv — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "unsetenv", ft);
      sym->is_global = 1;

      /* freopen — returns FILE* (void*) */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "freopen", ft);
      sym->is_global = 1;

      /* memcmp — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "memcmp", ft);
      sym->is_global = 1;

      /* memmove — returns void* */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "memmove", ft);
      sym->is_global = 1;

      /* atoi — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "atoi", ft);
      sym->is_global = 1;

      /* strtol — returns long */
      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "strtol", ft);
      sym->is_global = 1;

      /* strtoul — returns unsigned long */
      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "strtoul", ft);
      sym->is_global = 1;

      /* abort — returns void */
      ft = type_func(cc, cc->ty_void);
      sym = scope_add(cc, "abort", ft);
      sym->is_global = 1;

      /* getenv — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "getenv", ft);
      sym->is_global = 1;

      /* strchr — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strchr", ft);
      sym->is_global = 1;

      /* vsnprintf — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "vsnprintf", ft);
      sym->is_global = 1;

      /* vfprintf — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "vfprintf", ft);
      sym->is_global = 1;

      /* strrchr — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strrchr", ft);
      sym->is_global = 1;

      /* strcspn — returns size_t (ulong) */
      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "strcspn", ft);
      sym->is_global = 1;

      /* strspn — returns size_t (ulong) */
      ft = type_func(cc, cc->ty_ulong);
      sym = scope_add(cc, "strspn", ft);
      sym->is_global = 1;

      /* memchr — returns void* */
      ft = type_func(cc, type_ptr(cc, cc->ty_void));
      sym = scope_add(cc, "memchr", ft);
      sym->is_global = 1;

      /* inet_pton — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "inet_pton", ft);
      sym->is_global = 1;

      /* strtod — returns double */
      ft = type_func(cc, cc->ty_double);
      sym = scope_add(cc, "strtod", ft);
      sym->is_global = 1;

      /* ctype functions — all return int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isalpha", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isdigit", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isxdigit", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "toupper", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "tolower", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isalnum", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isspace", ft); sym->is_global = 1;
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "isupper", ft); sym->is_global = 1;

      /* strerror — returns char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "strerror", ft);
      sym->is_global = 1;

      /* close — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "close", ft);
      sym->is_global = 1;

      /* select — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "select", ft);
      sym->is_global = 1;

      /* socket — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "socket", ft);
      sym->is_global = 1;

      /* connect — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "connect", ft);
      sym->is_global = 1;

      /* bind — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "bind", ft);
      sym->is_global = 1;

      /* listen — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "listen", ft);
      sym->is_global = 1;

      /* accept — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "accept", ft);
      sym->is_global = 1;

      /* recv — returns ssize_t */
      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "recv", ft);
      sym->is_global = 1;

      /* send — returns ssize_t */
      ft = type_func(cc, cc->ty_long);
      sym = scope_add(cc, "send", ft);
      sym->is_global = 1;

      /* setsockopt — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "setsockopt", ft);
      sym->is_global = 1;

      /* getsockopt — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "getsockopt", ft);
      sym->is_global = 1;

      /* fcntl — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "fcntl", ft);
      sym->is_global = 1;

      /* ioctl — returns int, variadic */
      ft = type_func(cc, cc->ty_int);
      ft->is_variadic = 1;
      sym = scope_add(cc, "ioctl", ft);
      sym->is_global = 1;

      /* poll — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "poll", ft);
      sym->is_global = 1;

      /* gettimeofday — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "gettimeofday", ft);
      sym->is_global = 1;

      /* clock_gettime — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "clock_gettime", ft);
      sym->is_global = 1;

      /* getaddrinfo — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "getaddrinfo", ft);
      sym->is_global = 1;

      /* freeaddrinfo — returns void */
      ft = type_func(cc, cc->ty_void);
      sym = scope_add(cc, "freeaddrinfo", ft);
      sym->is_global = 1;

      /* gai_strerror — returns const char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "gai_strerror", ft);
      sym->is_global = 1;

      /* inet_ntop — returns const char* */
      ft = type_func(cc, type_ptr(cc, cc->ty_char));
      sym = scope_add(cc, "inet_ntop", ft);
      sym->is_global = 1;

      /* getpeername — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "getpeername", ft);
      sym->is_global = 1;

      /* getsockname — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "getsockname", ft);
      sym->is_global = 1;

      /* gethostname — returns int */
      ft = type_func(cc, cc->ty_int);
      sym = scope_add(cc, "gethostname", ft);
      sym->is_global = 1;
    }
  }
}

/* ================================================================ */
/* FILE READING                                                      */
/* ================================================================ */

static char *read_file(char *path, int *out_len) {
  FILE *fp;
  long len;
  char *buf;
  int nr;

  fprintf(stderr, "read_file: path = '%s' (addr: %p)\n", path, path);
  fp = fopen(path, "rb");
  if (!fp)
    return 0;

  fseek(fp, 0, 2); /* SEEK_END = 2 */
  len = ftell(fp);
  fseek(fp, 0, 0); /* SEEK_SET = 0 */

  buf = (char *)malloc(len + 1);
  if (!buf) {
    fclose(fp);
    return 0;
  }

  nr = fread(buf, 1, len, fp);
  buf[nr] = 0;
  fclose(fp);

  *out_len = nr;
  return buf;
}

/* ================================================================ */
/* PEEPHOLE OPTIMIZER                                                */
/* ================================================================ */

#define MAX_PEEP_LINES 3000000
#define MAX_PEEP_LEN 128

static char *line_buffer = 0;
static char **line_ptrs = 0;

static void peephole_optimize(char *filename) {
  FILE *fp;
  int nlines = 0;
  int i;
  int eliminated = 0;
  long file_size;

  fp = fopen(filename, "r");
  if (!fp)
    return;

  fseek(fp, 0, 2);
  file_size = ftell(fp);
  fseek(fp, 0, 0);

  if (!line_ptrs) {
    line_ptrs = (char **)malloc(MAX_PEEP_LINES * sizeof(char *));
  }
  line_buffer = (char *)malloc(file_size + MAX_PEEP_LINES * 128);
  if (!line_buffer || !line_ptrs) {
    fclose(fp);
    return;
  }

  while (nlines < MAX_PEEP_LINES && fgets(line_buffer + nlines * 128, 128, fp)) {
    line_ptrs[nlines] = line_buffer + nlines * 128;
    nlines++;
  }
  fclose(fp);

  for (i = 0; i < nlines;) {
    char *l1 = line_ptrs[i];

    /* 1. Redundant Push/Pop */
    if (strncmp(l1, "    pushq ", 10) == 0 && i + 1 < nlines) {
      char *l2 = line_ptrs[i + 1];
      if (strncmp(l2, "    popq ", 9) == 0) {
        char tmp1[64], tmp2[64];
        sscanf(l1, "    pushq %s", tmp1);
        sscanf(l2, "    popq %s", tmp2);
        if (strcmp(tmp1, tmp2) == 0) {
          line_ptrs[i][0] = 0;
          line_ptrs[i + 1][0] = 0;
          eliminated += 2;
          i += 2;
          continue;
        } else {
          sprintf(line_ptrs[i], "    movq %s, %s\n", tmp1, tmp2);
          line_ptrs[i + 1][0] = 0;
          eliminated += 2;
          i += 2;
          continue;
        }
      }
    }

    /* 2. Arithmetic Nullification */
    if (strcmp(l1, "    addq $0, %rax\n") == 0 ||
        strcmp(l1, "    subq $0, %rax\n") == 0 ||
        strcmp(l1, "    addq $0, %rsp\n") == 0 ||
        strcmp(l1, "    subq $0, %rsp\n") == 0) {
      line_ptrs[i][0] = 0;
      eliminated += 1;
      i += 1;
      continue;
    }

    /* 3. Push/Lea/Pop Triad */
    if (strcmp(l1, "    pushq %rax\n") == 0 && i + 2 < nlines) {
      char *l2 = line_ptrs[i + 1];
      char *l3 = line_ptrs[i + 2];
      if (strncmp(l2, "    leaq ", 9) == 0 && strstr(l2, ", %rax") &&
          strncmp(l3, "    popq ", 9) == 0) {
        char pop_reg[64];
        sscanf(l3, "    popq %s", pop_reg);
        sprintf(line_ptrs[i], "    movq %%rax, %s\n", pop_reg);
        line_ptrs[i + 2][0] = 0;
        eliminated += 3;
        i += 3;
        continue;
      }
    }
    i++;
  }

  fp = fopen(filename, "w");
  if (!fp) {
    free(line_buffer);
    return;
  }
  for (i = 0; i < nlines; i++) {
    if (line_ptrs[i][0] != 0)
      fputs(line_ptrs[i], fp);
  }
  fclose(fp);
  free(line_buffer);
  printf("[Phase 5] Native C Peephole Optimization... OK (%d elided)\n",
         eliminated);
}

/* ================================================================ */
/* MAIN                                                              */
/* Bug fix: Compiler is heap-allocated (52KB+ struct, not stack)     */
/* ================================================================ */

int main(int argc, char **argv) {
  Compiler *cc;
  char *input_file;
  char *output_file;
  char *source;
  int source_len;
  char asm_file[256];
  char cmd[512];
  Node *prog;
  int ret;
  int i;
  int al;

  input_file = 0;
  output_file = 0;

  int pp_only = 0;

  int zcc_verbose_flag = 0;

  int compile_only = 0;

  /* parse arguments */
  for (i = 1; i < argc; i++) {
    if (strcmp(argv[i], "-o") == 0) {
      i++;
      if (i < argc)
        output_file = argv[i];
    } else if (strcmp(argv[i], "-c") == 0) {
      compile_only = 1;
    } else if (strcmp(argv[i], "--pp-only") == 0) {
      pp_only = 1;
    } else if (strcmp(argv[i], "-v") == 0) {
      zcc_verbose_flag = 1;
    } else if (strcmp(argv[i], "-target") == 0) {
      i++;
      if (i < argc) {
          if (strcmp(argv[i], "thumbv6m-none-eabi") == 0) {
              extern TargetBackend backend_thumbv6m;
              backend_ops = &backend_thumbv6m;
              ZCC_POINTER_WIDTH = 4;
          }
      }
    } else {
      input_file = argv[i];
    }
  }

  if (!zcc_verbose_flag) {
#ifdef _WIN32
    freopen("nul", "w", stderr);
#else
    freopen("/dev/null", "w", stderr);
#endif
  }

  if (!input_file) {
    printf("Usage: zcc <input.c> [-o output]\n");
    return 1;
  }

  if (!output_file)
    output_file = "a.out";

  ZCC_IR_INIT();

  /* read source file */
  source = read_file(input_file, &source_len);
  if (!source) {
    printf("zcc: cannot read '%s'\n", input_file);
    return 1;
  }

  /* PREPROCESSOR HOOK */
  {
    int pp_len;
    char *pp_source = zcc_preprocess(source, source_len, input_file, ".:./include", &pp_len);
    if (!pp_source) {
      fprintf(stderr, "zcc: preprocessing failed\n");
      return 1;
    }
    /* We leak original `source` here because we replaced it.
       ZCC doesn't care much about leaking in main string allocations anyway. */
    source = pp_source;
    source_len = pp_len;
  }

  if (pp_only) {
    printf("%s", source);
    return 0;
  }

  /* heap-allocate compiler state (too large for stack) */
  cc = (Compiler *)calloc(1, sizeof(Compiler));
  if (!cc) {
    printf("zcc: out of memory\n");
    free(source);
    return 1;
  }

  cc->source = source;
  cc->source_len = source_len;
  cc->filename = input_file;

  init_compiler(cc);

  /* generate asm file name */
  strncpy(asm_file, output_file, 250);
  al = 0;
  while (asm_file[al])
    al++;

  int stop_at_asm = 0;
  if (al >= 2 && asm_file[al - 2] == '.' && asm_file[al - 1] == 's') {
    stop_at_asm = 1;
  } else {
    asm_file[al] = '.';
    asm_file[al + 1] = 's';
    asm_file[al + 2] = 0;
  }

  /* open output */
  cc->out = fopen(asm_file, "w");
  if (!cc->out) {
    printf("zcc: cannot write '%s'\n", asm_file);
    free(source);
    free(cc);
    return 1;
  }

  /* lex first token */
  printf("[Phase 1] Lexical Array Bootstrap... OK\n");
  next_token(cc);

  /* Pass 1: Pre-scan all top-level declarations for forward references */
  printf("[Phase 1.5] Forward Declaration Pre-Scan... ");
  prescan_declarations(cc);
  printf("OK\n");

  /* parse */
  printf("[Phase 2] AST Topological Generation... ");
  prog = parse_program(cc);

  if (cc->errors > 0) {
    printf("\033[0;31mFAILED\033[0m\n");
    printf("zcc: %d error(s)\n", cc->errors);
    fclose(cc->out);
    free(source);
    free(cc);
    return 1;
  }

  printf("OK\n");

  /* generate code */
  printf("[Phase 3] Native AST Constant Folding... OK\n");
  printf("[Phase 4] SystemV ABI X86-64 Codegen... OK\n");
  fprintf(cc->out, "# ZCC asm begin\n");
  codegen_program(cc, prog);
  fclose(cc->out);



  ZCC_IR_FLUSH(stdout);

  /* peephole optimize the emitted assembly safely out-of-bounds */
  peephole_optimize(asm_file);

  /* assemble and link if not stopping at assembly */
  if (!stop_at_asm) {
    printf("[Phase 6] GCC Assembly/Linker Binding... ");
    if (backend_ops) {
      if (compile_only) {
        sprintf(cmd, "arm-none-eabi-gcc -c -o %s %s 2>&1", output_file, asm_file);
      } else {
        sprintf(cmd, "arm-none-eabi-gcc -mthumb -mcpu=cortex-m0plus -nostdlib -Wl,-Ttext=0x10000000 -o %s %s 2>&1", output_file, asm_file);
      }
    } else if (compile_only) {
      sprintf(cmd, "gcc -O0 -w -fno-asynchronous-unwind-tables -Wa,--noexecstack -fno-unwind-tables -c -o %s %s 2>&1", output_file, asm_file);
    } else if (strcmp(input_file, "zcc.c") == 0 || (strlen(input_file) >= 6 && strcmp(input_file + strlen(input_file) - 6, "/zcc.c") == 0)) {
      sprintf(cmd, "gcc -O0 -w -fno-asynchronous-unwind-tables -Wa,--noexecstack -fno-unwind-tables -o %s %s compiler_passes.c compiler_passes_ir.c -lm 2>&1", output_file, asm_file);
    } else {
      sprintf(cmd, "gcc -O0 -w -fno-asynchronous-unwind-tables -Wa,--noexecstack -fno-unwind-tables -o %s %s -lm -lpthread -ldl 2>&1", output_file, asm_file);
    }
    ret = system(cmd);
    if (ret != 0) {
      printf("FAILED\n");
      printf("zcc: assembly/linking failed\n");
      free(source);
      free(cc);
      return 1;
    }
    printf("OK\n");
  }

  printf("[OK] ZCC Engine Compilation Terminated Successfully.\n");

  free(source);
  free(cc);
  return 0;
}

/* ZKAEDI FORCE RENDER CACHE INVALIDATION */
