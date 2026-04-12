#include <stdio.h>
int clobber(void) { return 5; }
int main(void) {
    int a = 10, b = 20, c = 30, d = 40, e = 50, f = 60, g = 70, h = 80;
    int result = clobber();
    result += a + b + c + d + e + f + g + h; /* Uses all regs, forces logic across call */
    printf("%d\n", result);
    return (result == 365) ? 0 : 1;
}
