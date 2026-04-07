/* zcc-level4: mini-forth — stack-based Forth interpreter
 * Data stack, return stack, dictionary with user-defined words
 * Built-ins: + - * / mod . .s dup drop swap over rot
 *            = < > and or not if else then do loop
 *            : ; (define words) emit cr
 */
#include <stdio.h>
#include <string.h>

/* stacks */
long dstack[256];
int dsp;

long rstack[256];
int rsp;

/* dictionary */
char dict_name[256][32];
char dict_body[256][512];
int dict_count;

/* input buffer */
char input[4096];
char token[256];
int input_pos;

void dpush(long v) {
    if (dsp < 256) {
        dstack[dsp] = v;
        dsp = dsp + 1;
    }
}

long dpop(void) {
    if (dsp > 0) {
        dsp = dsp - 1;
        return dstack[dsp];
    }
    fprintf(stderr, "stack underflow\n");
    return 0;
}

long dpeek(void) {
    if (dsp > 0) return dstack[dsp - 1];
    return 0;
}

void rpush(long v) {
    if (rsp < 256) {
        rstack[rsp] = v;
        rsp = rsp + 1;
    }
}

long rpop(void) {
    if (rsp > 0) {
        rsp = rsp - 1;
        return rstack[rsp];
    }
    return 0;
}

int is_digit(char c) {
    return c >= '0' && c <= '9';
}

int is_number(char *s) {
    int i;
    i = 0;
    if (s[0] == '-' && s[1] != '\0') i = 1;
    while (s[i] != '\0') {
        if (!is_digit(s[i])) return 0;
        i = i + 1;
    }
    return s[0] != '\0';
}

long parse_number(char *s) {
    long val;
    int i;
    int neg;

    val = 0;
    neg = 0;
    i = 0;

    if (s[0] == '-') {
        neg = 1;
        i = 1;
    }

    while (s[i] != '\0') {
        val = val * 10 + (s[i] - '0');
        i = i + 1;
    }

    if (neg) val = -val;
    return val;
}

int find_word(char *name) {
    int i;
    i = dict_count - 1;
    while (i >= 0) {
        if (strcmp(dict_name[i], name) == 0) return i;
        i = i - 1;
    }
    return -1;
}

/* forward declaration */
int execute_line(char *line);

int next_token_from(char *src, int *pos, char *out) {
    int i;

    /* skip whitespace */
    while (src[*pos] == ' ' || src[*pos] == '\t')
        *pos = *pos + 1;

    if (src[*pos] == '\0' || src[*pos] == '\n')
        return 0;

    i = 0;
    while (src[*pos] != '\0' && src[*pos] != ' ' &&
           src[*pos] != '\t' && src[*pos] != '\n' && i < 254) {
        out[i] = src[*pos];
        i = i + 1;
        *pos = *pos + 1;
    }
    out[i] = '\0';
    return 1;
}

int execute_tokens(char *line) {
    char tok[256];
    int pos;
    long a;
    long b;
    int idx;
    int skip_depth;
    char def_name[32];
    char def_body[512];
    int def_pos;
    int in_def;

    pos = 0;
    in_def = 0;
    def_body[0] = '\0';
    def_pos = 0;

    while (next_token_from(line, &pos, tok)) {
        /* defining a new word */
        if (in_def) {
            if (strcmp(tok, ";") == 0) {
                def_body[def_pos] = '\0';
                strncpy(dict_name[dict_count], def_name, 31);
                dict_name[dict_count][31] = '\0';
                strncpy(dict_body[dict_count], def_body, 511);
                dict_body[dict_count][511] = '\0';
                dict_count = dict_count + 1;
                in_def = 0;
            } else {
                if (def_pos > 0) {
                    def_body[def_pos] = ' ';
                    def_pos = def_pos + 1;
                }
                strcpy(def_body + def_pos, tok);
                def_pos = def_pos + strlen(tok);
            }
            continue;
        }

        /* start word definition */
        if (strcmp(tok, ":") == 0) {
            if (!next_token_from(line, &pos, def_name)) {
                fprintf(stderr, "expected word name after :\n");
                return 1;
            }
            in_def = 1;
            def_pos = 0;
            def_body[0] = '\0';
            continue;
        }

        /* number */
        if (is_number(tok)) {
            dpush(parse_number(tok));
            continue;
        }

        /* arithmetic */
        if (strcmp(tok, "+") == 0) { b = dpop(); a = dpop(); dpush(a + b); continue; }
        if (strcmp(tok, "-") == 0) { b = dpop(); a = dpop(); dpush(a - b); continue; }
        if (strcmp(tok, "*") == 0) { b = dpop(); a = dpop(); dpush(a * b); continue; }
        if (strcmp(tok, "/") == 0) {
            b = dpop(); a = dpop();
            if (b == 0) { fprintf(stderr, "division by zero\n"); dpush(0); }
            else dpush(a / b);
            continue;
        }
        if (strcmp(tok, "mod") == 0) {
            b = dpop(); a = dpop();
            if (b == 0) { fprintf(stderr, "modulo by zero\n"); dpush(0); }
            else dpush(a % b);
            continue;
        }

        /* comparison */
        if (strcmp(tok, "=") == 0) { b = dpop(); a = dpop(); dpush(a == b ? -1 : 0); continue; }
        if (strcmp(tok, "<") == 0) { b = dpop(); a = dpop(); dpush(a < b ? -1 : 0); continue; }
        if (strcmp(tok, ">") == 0) { b = dpop(); a = dpop(); dpush(a > b ? -1 : 0); continue; }

        /* logic */
        if (strcmp(tok, "and") == 0) { b = dpop(); a = dpop(); dpush(a & b); continue; }
        if (strcmp(tok, "or") == 0) { b = dpop(); a = dpop(); dpush(a | b); continue; }
        if (strcmp(tok, "not") == 0) { a = dpop(); dpush(a == 0 ? -1 : 0); continue; }

        /* stack ops */
        if (strcmp(tok, "dup") == 0) { a = dpeek(); dpush(a); continue; }
        if (strcmp(tok, "drop") == 0) { dpop(); continue; }
        if (strcmp(tok, "swap") == 0) {
            b = dpop(); a = dpop(); dpush(b); dpush(a); continue;
        }
        if (strcmp(tok, "over") == 0) {
            if (dsp >= 2) dpush(dstack[dsp - 2]);
            continue;
        }
        if (strcmp(tok, "rot") == 0) {
            if (dsp >= 3) {
                a = dstack[dsp - 3];
                dstack[dsp - 3] = dstack[dsp - 2];
                dstack[dsp - 2] = dstack[dsp - 1];
                dstack[dsp - 1] = a;
            }
            continue;
        }

        /* I/O */
        if (strcmp(tok, ".") == 0) { printf("%ld ", dpop()); continue; }
        if (strcmp(tok, "emit") == 0) { a = dpop(); putchar((int)a); continue; }
        if (strcmp(tok, "cr") == 0) { putchar('\n'); continue; }
        if (strcmp(tok, ".s") == 0) {
            printf("<%d>", dsp);
            a = 0;
            while (a < dsp) {
                printf(" %ld", dstack[a]);
                a = a + 1;
            }
            printf(" ");
            continue;
        }

        /* if/else/then */
        if (strcmp(tok, "if") == 0) {
            a = dpop();
            if (a == 0) {
                /* skip to else or then */
                skip_depth = 1;
                while (skip_depth > 0 && next_token_from(line, &pos, tok)) {
                    if (strcmp(tok, "if") == 0) skip_depth = skip_depth + 1;
                    if (strcmp(tok, "then") == 0) skip_depth = skip_depth - 1;
                    if (strcmp(tok, "else") == 0 && skip_depth == 1) skip_depth = 0;
                }
            }
            continue;
        }
        if (strcmp(tok, "else") == 0) {
            /* skip to then */
            skip_depth = 1;
            while (skip_depth > 0 && next_token_from(line, &pos, tok)) {
                if (strcmp(tok, "if") == 0) skip_depth = skip_depth + 1;
                if (strcmp(tok, "then") == 0) skip_depth = skip_depth - 1;
            }
            continue;
        }
        if (strcmp(tok, "then") == 0) {
            continue;
        }

        /* dictionary lookup */
        idx = find_word(tok);
        if (idx >= 0) {
            execute_tokens(dict_body[idx]);
            continue;
        }

        fprintf(stderr, "unknown word: %s\n", tok);
    }

    return 0;
}

int main(int argc, char **argv) {
    int ch;
    int pos;

    dsp = 0;
    rsp = 0;
    dict_count = 0;

    /* read lines from stdin */
    while (1) {
        pos = 0;
        ch = getchar();
        if (ch == (-1)) break;

        while (ch != (-1) && ch != '\n' && pos < 4094) {
            input[pos] = ch;
            pos = pos + 1;
            ch = getchar();
        }
        input[pos] = '\0';

        execute_tokens(input);

        if (ch == (-1)) break;
    }

    return 0;
}
