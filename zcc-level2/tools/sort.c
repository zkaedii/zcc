/* zcc-level2: sort — line sorting via custom qsort */
#include <stdio.h>
#include <string.h>


char lines[8192][4096];
int nlines;

/* manual qsort to avoid stdlib function pointer ABI issues */
void swap_lines(int a, int b) {
    char tmp[4096];
    int i;
    i = 0;
    while (i < 4096) {
        tmp[i] = lines[a][i];
        i = i + 1;
    }
    i = 0;
    while (i < 4096) {
        lines[a][i] = lines[b][i];
        i = i + 1;
    }
    i = 0;
    while (i < 4096) {
        lines[b][i] = tmp[i];
        i = i + 1;
    }
}

int cmp_lines(int a, int b) {
    return strcmp(lines[a], lines[b]);
}

int cmp_lines_reverse(int a, int b) {
    return strcmp(lines[b], lines[a]);
}

void do_sort(int lo, int hi, int reverse) {
    int i;
    int j;
    int pivot;
    int c;

    if (lo >= hi) return;

    pivot = hi;
    i = lo;
    j = hi - 1;

    while (1) {
        if (reverse) {
            while (i <= j && cmp_lines_reverse(i, pivot) <= 0) i = i + 1;
            while (j >= i && cmp_lines_reverse(j, pivot) >= 0) j = j - 1;
        } else {
            while (i <= j && cmp_lines(i, pivot) <= 0) i = i + 1;
            while (j >= i && cmp_lines(j, pivot) >= 0) j = j - 1;
        }
        if (i >= j) break;
        swap_lines(i, j);
    }
    swap_lines(i, hi);

    do_sort(lo, i - 1, reverse);
    do_sort(i + 1, hi, reverse);
}

int read_lines(FILE *f) {
    int ch;
    int pos;

    pos = 0;
    ch = fgetc(f);
    while (ch != (-1)) {
        if (ch == '\n' || pos >= 4096 - 2) {
            lines[nlines][pos] = '\0';
            nlines = nlines + 1;
            if (nlines >= 8192) return 0;
            pos = 0;
        } else {
            lines[nlines][pos] = ch;
            pos = pos + 1;
        }
        ch = fgetc(f);
    }

    /* last line without newline */
    if (pos > 0) {
        lines[nlines][pos] = '\0';
        nlines = nlines + 1;
    }

    return 0;
}

int main(int argc, char **argv) {
    FILE *f;
    int i;
    int reverse;
    int unique;
    int fi;

    nlines = 0;
    reverse = 0;
    unique = 0;

    /* parse flags */
    fi = 1;
    while (fi < argc && argv[fi][0] == '-') {
        i = 1;
        while (argv[fi][i] != '\0') {
            if (argv[fi][i] == 'r') reverse = 1;
            if (argv[fi][i] == 'u') unique = 1;
            i = i + 1;
        }
        fi = fi + 1;
    }

    /* read input */
    if (fi >= argc) {
        read_lines(stdin);
    } else {
        while (fi < argc) {
            f = fopen(argv[fi], "r");
            if (!f) {
                fprintf(stderr, "sort: %s: No such file\n", argv[fi]);
                fi = fi + 1;
                continue;
            }
            read_lines(f);
            fclose(f);
            fi = fi + 1;
        }
    }

    /* sort */
    if (nlines > 1) {
        do_sort(0, nlines - 1, reverse);
    }

    /* output */
    i = 0;
    while (i < nlines) {
        if (unique && i > 0 && strcmp(lines[i], lines[i - 1]) == 0) {
            i = i + 1;
            continue;
        }
        fputs(lines[i], stdout);
        putchar('\n');
        i = i + 1;
    }

    return 0;
}
