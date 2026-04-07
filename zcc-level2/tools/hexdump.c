/* zcc-level2: hexdump — display file contents in hex + ASCII */
#include <stdio.h>

void dump_stream(FILE *f) {
    unsigned char buf[16];
    int n;
    int i;
    long offset;
    int ch;

    offset = 0;

    while (1) {
        n = 0;
        while (n < 16) {
            ch = fgetc(f);
            if (ch == (-1)) break;
            buf[n] = (unsigned char)ch;
            n = n + 1;
        }

        if (n == 0) break;

        /* offset */
        printf("%08lx  ", offset);

        /* hex bytes */
        i = 0;
        while (i < 16) {
            if (i < n) {
                printf("%02x ", (unsigned int)buf[i]);
            } else {
                printf("   ");
            }
            if (i == 7) putchar(' ');
            i = i + 1;
        }

        /* ASCII */
        printf(" |");
        i = 0;
        while (i < n) {
            if (buf[i] >= 32 && buf[i] < 127) {
                putchar(buf[i]);
            } else {
                putchar('.');
            }
            i = i + 1;
        }
        printf("|\n");

        offset = offset + n;
    }

    /* final offset line */
    printf("%08lx\n", offset);
}

int main(int argc, char **argv) {
    FILE *f;
    int i;

    if (argc < 2) {
        dump_stream(stdin);
        return 0;
    }

    i = 1;
    while (i < argc) {
        f = fopen(argv[i], "rb");
        if (!f) {
            fprintf(stderr, "hexdump: %s: No such file\n", argv[i]);
            i = i + 1;
            continue;
        }
        dump_stream(f);
        fclose(f);
        i = i + 1;
    }

    return 0;
}
