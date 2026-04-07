/* zcc-level1: cat — concatenate files to stdout */
#include <stdio.h>

int cat_file(char *path) {
    FILE *f;
    int ch;

    f = fopen(path, "r");
    if (!f) {
        fprintf(stderr, "cat: cannot open '%s'\n", path);
        return 1;
    }

    ch = fgetc(f);
    while (ch != (-1)) {
        putchar(ch);
        ch = fgetc(f);
    }

    fclose(f);
    return 0;
}

int cat_stdin(void) {
    int ch;
    ch = getchar();
    while (ch != (-1)) {
        putchar(ch);
        ch = getchar();
    }
    return 0;
}

int main(int argc, char **argv) {
    int i;
    int err;

    err = 0;

    if (argc < 2) {
        return cat_stdin();
    }

    i = 1;
    while (i < argc) {
        if (argv[i][0] == '-' && argv[i][1] == '\0') {
            cat_stdin();
        } else {
            err = err | cat_file(argv[i]);
        }
        i = i + 1;
    }

    return err;
}
