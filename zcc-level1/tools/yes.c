/* zcc-level1: yes — repeatedly output a line */
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
    char buf[4096];
    int i;
    int len;
    int total;
    int max_iters;

    /* Build output string */
    buf[0] = '\0';
    total = 0;

    if (argc < 2) {
        buf[0] = 'y';
        buf[1] = '\n';
        buf[2] = '\0';
        total = 2;
    } else {
        i = 1;
        while (i < argc) {
            if (i > 1) {
                buf[total] = ' ';
                total = total + 1;
            }
            len = strlen(argv[i]);
            memcpy(buf + total, argv[i], len);
            total = total + len;
            i = i + 1;
        }
        buf[total] = '\n';
        total = total + 1;
        buf[total] = '\0';
    }

    /* Print limited iterations for testability (real yes is infinite) */
    max_iters = 1000;
    i = 0;
    while (i < max_iters) {
        fputs(buf, stdout);
        i = i + 1;
    }

    return 0;
}
