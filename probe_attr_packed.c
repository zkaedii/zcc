/* probe_attr_packed.c -- packed attribute silicon test
 * ERR-0029 status: ATTR known-registered (ATTR-UNKNOWN-001)
 * packed is in ZCC attribute registry v1.0 — sizeof validates the implementation.
 * -Wunknown-attributes will NOT fire for this attribute.
 */
#include <stdio.h>
struct __attribute__((packed)) P { char a; int b; }; /* ATTR: known-registered */

int main(void) {
    int sz = (int)sizeof(struct P);
    printf("sizeof(packed P) = %d  (GCC=5, want 5)\n", sz);
    return sz == 5 ? 0 : 1;
}
