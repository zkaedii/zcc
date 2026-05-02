/* zcc-level1: echo — print arguments to stdout */
#include <stdio.h>

int main(int argc, char **argv) {
    int i;
    int newline;

    newline = 1;
    i = 1;

    /* handle -n flag */
    if (argc > 1 && argv[1][0] == '-' && argv[1][1] == 'n' && argv[1][2] == '\0') {
        newline = 0;
        i = 2;
    }

    while (i < argc) {
        if (i > 1 + (1 - newline)) {
            putchar(' ');
        }
        fputs(argv[i], stdout);
        i = i + 1;
    }

    if (newline) {
        putchar('\n');
    }

    return 0;
}
