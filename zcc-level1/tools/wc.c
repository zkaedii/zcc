/* zcc-level1: wc — word, line, and byte count */
#include <stdio.h>

int main(int argc, char **argv) {
    FILE *f;
    int ch;
    int i;
    long lines;
    long words;
    long bytes;
    long total_lines;
    long total_words;
    long total_bytes;
    int in_word;
    int multiple;

    total_lines = 0;
    total_words = 0;
    total_bytes = 0;
    multiple = (argc > 2);

    i = 1;
    if (argc < 2) {
        /* stdin mode */
        lines = 0;
        words = 0;
        bytes = 0;
        in_word = 0;

        ch = getchar();
        while (ch != (-1)) {
            bytes = bytes + 1;
            if (ch == '\n') {
                lines = lines + 1;
            }
            if (ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r') {
                in_word = 0;
            } else {
                if (!in_word) {
                    words = words + 1;
                    in_word = 1;
                }
            }
            ch = getchar();
        }

        printf("  %ld  %ld %ld\n", lines, words, bytes);
        return 0;
    }

    while (i < argc) {
        f = fopen(argv[i], "r");
        if (!f) {
            fprintf(stderr, "wc: cannot open '%s'\n", argv[i]);
            i = i + 1;
            continue;
        }

        lines = 0;
        words = 0;
        bytes = 0;
        in_word = 0;

        ch = fgetc(f);
        while (ch != (-1)) {
            bytes = bytes + 1;
            if (ch == '\n') {
                lines = lines + 1;
            }
            if (ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r') {
                in_word = 0;
            } else {
                if (!in_word) {
                    words = words + 1;
                    in_word = 1;
                }
            }
            ch = fgetc(f);
        }

        fclose(f);
        printf("  %ld  %ld %ld %s\n", lines, words, bytes, argv[i]);

        total_lines = total_lines + lines;
        total_words = total_words + words;
        total_bytes = total_bytes + bytes;

        i = i + 1;
    }

    if (multiple) {
        printf("  %ld  %ld %ld total\n", total_lines, total_words, total_bytes);
    }

    return 0;
}
