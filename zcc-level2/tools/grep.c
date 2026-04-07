/* zcc-level2: grep — line-by-line substring search */
#include <stdio.h>
#include <string.h>

int match(char *haystack, char *needle) {
    int hlen;
    int nlen;
    int i;

    hlen = strlen(haystack);
    nlen = strlen(needle);

    if (nlen == 0) return 1;
    if (nlen > hlen) return 0;

    i = 0;
    while (i <= hlen - nlen) {
        if (memcmp(haystack + i, needle, nlen) == 0) {
            return 1;
        }
        i = i + 1;
    }
    return 0;
}

int grep_stream(FILE *f, char *pattern, char *filename, int show_name) {
    char line[4096];
    int found;
    int ch;
    int pos;

    found = 0;

    pos = 0;
    ch = fgetc(f);
    while (ch != (-1)) {
        if (ch == '\n' || pos >= 4094) {
            line[pos] = '\0';
            if (match(line, pattern)) {
                if (show_name) {
                    fputs(filename, stdout);
                    putchar(':');
                }
                fputs(line, stdout);
                putchar('\n');
                found = 1;
            }
            pos = 0;
        } else {
            line[pos] = ch;
            pos = pos + 1;
        }
        ch = fgetc(f);
    }

    /* handle last line without newline */
    if (pos > 0) {
        line[pos] = '\0';
        if (match(line, pattern)) {
            if (show_name) {
                fputs(filename, stdout);
                putchar(':');
            }
            fputs(line, stdout);
            putchar('\n');
            found = 1;
        }
    }

    return found;
}

int main(int argc, char **argv) {
    FILE *f;
    char *pattern;
    int i;
    int found;
    int show_name;

    if (argc < 2) {
        fprintf(stderr, "usage: grep PATTERN [FILE...]\n");
        return 2;
    }

    pattern = argv[1];
    found = 0;
    show_name = (argc > 3);

    if (argc < 3) {
        found = grep_stream(stdin, pattern, "(stdin)", 0);
    } else {
        i = 2;
        while (i < argc) {
            f = fopen(argv[i], "r");
            if (!f) {
                fprintf(stderr, "grep: %s: No such file\n", argv[i]);
                i = i + 1;
                continue;
            }
            if (grep_stream(f, pattern, argv[i], show_name)) {
                found = 1;
            }
            fclose(f);
            i = i + 1;
        }
    }

    return found ? 0 : 1;
}
