/* zcc-level2: cut — extract fields by delimiter */
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
    char line[4096];
    char delim;
    int field;
    int pos;
    int ch;
    int cur_field;
    int start;
    int i;
    int len;
    FILE *f;
    int fi;

    delim = '\t';
    field = 1;

    /* parse args: -d DELIM -f FIELD [files...] */
    i = 1;
    while (i < argc) {
        if (argv[i][0] == '-' && argv[i][1] == 'd') {
            if (argv[i][2] != '\0') {
                delim = argv[i][2];
            } else if (i + 1 < argc) {
                i = i + 1;
                delim = argv[i][0];
            }
        } else if (argv[i][0] == '-' && argv[i][1] == 'f') {
            if (argv[i][2] != '\0') {
                field = 0;
                pos = 2;
                while (argv[i][pos] >= '0' && argv[i][pos] <= '9') {
                    field = field * 10 + (argv[i][pos] - '0');
                    pos = pos + 1;
                }
            } else if (i + 1 < argc) {
                i = i + 1;
                field = 0;
                pos = 0;
                while (argv[i][pos] >= '0' && argv[i][pos] <= '9') {
                    field = field * 10 + (argv[i][pos] - '0');
                    pos = pos + 1;
                }
            }
        } else {
            break;
        }
        i = i + 1;
    }

    if (field < 1) field = 1;

    /* process files or stdin */
    fi = i;
    if (fi >= argc) {
        /* stdin */
        pos = 0;
        ch = getchar();
        while (ch != (-1)) {
            if (ch == '\n' || pos >= 4094) {
                line[pos] = '\0';

                /* extract field */
                cur_field = 1;
                start = 0;
                len = pos;
                i = 0;
                while (i <= len) {
                    if (i == len || line[i] == delim) {
                        if (cur_field == field) {
                            line[i] = '\0';
                            fputs(line + start, stdout);
                            putchar('\n');
                            break;
                        }
                        cur_field = cur_field + 1;
                        start = i + 1;
                    }
                    i = i + 1;
                }
                /* field not found: print newline */
                if (cur_field < field) {
                    putchar('\n');
                }

                pos = 0;
            } else {
                line[pos] = ch;
                pos = pos + 1;
            }
            ch = getchar();
        }
    } else {
        while (fi < argc) {
            f = fopen(argv[fi], "r");
            if (!f) {
                fprintf(stderr, "cut: %s: No such file\n", argv[fi]);
                fi = fi + 1;
                continue;
            }

            pos = 0;
            ch = fgetc(f);
            while (ch != (-1)) {
                if (ch == '\n' || pos >= 4094) {
                    line[pos] = '\0';

                    cur_field = 1;
                    start = 0;
                    len = pos;
                    i = 0;
                    while (i <= len) {
                        if (i == len || line[i] == delim) {
                            if (cur_field == field) {
                                line[i] = '\0';
                                fputs(line + start, stdout);
                                putchar('\n');
                                break;
                            }
                            cur_field = cur_field + 1;
                            start = i + 1;
                        }
                        i = i + 1;
                    }
                    if (cur_field < field) {
                        putchar('\n');
                    }

                    pos = 0;
                } else {
                    line[pos] = ch;
                    pos = pos + 1;
                }
                ch = fgetc(f);
            }

            fclose(f);
            fi = fi + 1;
        }
    }

    return 0;
}
