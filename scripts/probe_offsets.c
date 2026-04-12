/* Phase 4.9 — print GCC's offsetof(Compiler, field) for comparison with ZCC. */
#define main zcc_main
#include "zcc.c"
#undef main

#include <stdio.h>
#include <stddef.h>

int main(void) {
    printf("pos=%zu\n",          offsetof(Compiler, pos));
    printf("line=%zu\n",         offsetof(Compiler, line));
    printf("tk=%zu\n",           offsetof(Compiler, tk));
    printf("tk_text=%zu\n",      offsetof(Compiler, tk_text));
    printf("local_offset=%zu\n", offsetof(Compiler, local_offset));
    printf("current_scope=%zu\n", offsetof(Compiler, current_scope));
    printf("out=%zu\n",          offsetof(Compiler, out));
    printf("errors=%zu\n",       offsetof(Compiler, errors));
    printf("sizeof=%zu\n",       sizeof(Compiler));
    return 0;
}
