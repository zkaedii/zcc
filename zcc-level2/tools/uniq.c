/* zcc-level2: uniq — remove adjacent duplicate lines */
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
    char cur[4096];
    char prev[4096];
    int have_prev;
    int count;
    int show_count;
    int show_dups;
    int show_uniq;
    int pos;
    int ch;
    FILE *f;
    int i;

    show_count = 0;
    show_dups = 0;
    show_uniq = 0;
    have_prev = 0;
    count = 0;
    prev[0] = '\0';

    /* parse flags */
    i = 1;
    while (i < argc && argv[i][0] == '-') {
        if (argv[i][1] == 'c') show_count = 1;
        if (argv[i][1] == 'd') show_dups = 1;
        if (argv[i][1] == 'u') show_uniq = 1;
        i = i + 1;
    }

    /* open file or stdin */
    if (i < argc) {
        f = fopen(argv[i], "r");
        if (!f) {
            fprintf(stderr, "uniq: %s: No such file\n", argv[i]);
            return 1;
        }
    } else {
        f = stdin;
    }

    pos = 0;
    ch = fgetc(f);
    while (ch != (-1)) {
        if (ch == '\n' || pos >= 4094) {
            cur[pos] = '\0';

            if (!have_prev) {
                strcpy(prev, cur);
                count = 1;
                have_prev = 1;
            } else if (strcmp(cur, prev) == 0) {
                count = count + 1;
            } else {
                /* emit prev */
                if ((!show_dups && !show_uniq) ||
                    (show_dups && count > 1) ||
                    (show_uniq && count == 1)) {
                    if (show_count) {
                        printf("%7d %s\n", count, prev);
                    } else {
                        fputs(prev, stdout);
                        putchar('\n');
                    }
                }
                strcpy(prev, cur);
                count = 1;
            }

            pos = 0;
        } else {
            cur[pos] = ch;
            pos = pos + 1;
        }
        ch = fgetc(f);
    }

    /* handle last line */
    if (pos > 0) {
        cur[pos] = '\0';
        if (!have_prev) {
            strcpy(prev, cur);
            count = 1;
            have_prev = 1;
        } else if (strcmp(cur, prev) == 0) {
            count = count + 1;
        } else {
            if ((!show_dups && !show_uniq) ||
                (show_dups && count > 1) ||
                (show_uniq && count == 1)) {
                if (show_count) {
                    printf("%7d %s\n", count, prev);
                } else {
                    fputs(prev, stdout);
                    putchar('\n');
                }
            }
            strcpy(prev, cur);
            count = 1;
        }
    }

    /* emit final line */
    if (have_prev) {
        if ((!show_dups && !show_uniq) ||
            (show_dups && count > 1) ||
            (show_uniq && count == 1)) {
            if (show_count) {
                printf("%7d %s\n", count, prev);
            } else {
                fputs(prev, stdout);
                putchar('\n');
            }
        }
    }

    if (f != stdin) fclose(f);

    return 0;
}
