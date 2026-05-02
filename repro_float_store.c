#include <stdio.h>
int main(void) {
    float a = 1.5f;
    printf("A %f  (want 1.500000)\n", (double)a);

    double d = 2.5;
    float b = (float)d;
    printf("B %f  (want 2.500000)\n", (double)b);

    int n = 3;
    float c = (float)n;
    printf("C %f  (want 3.000000)\n", (double)c);

    float e = 4.5f;
    double f = (double)e;
    printf("D %f  (want 4.500000)\n", f);

    unsigned int *bits = (unsigned int *)&a;
    printf("BITS of a (float 1.5f): 0x%08x  (want 0x3fc00000)\n", *bits);

    return 0;
}
