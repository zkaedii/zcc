/* zcc-level4: bf — brainfuck interpreter
 * Commands: > < + - . , [ ]
 * Tape: 30000 cells, wrapping byte values
 * Reads program from file or stdin
 */
#include <stdio.h>
#include <string.h>

char program[65536];
int proglen;
unsigned char tape[30000];
int ptr;

/* precompute bracket matching */
int bracket[65536];

int match_brackets(void) {
    int stack[4096];
    int sp;
    int i;

    sp = 0;
    i = 0;
    while (i < proglen) {
        if (program[i] == '[') {
            if (sp >= 4096) {
                fprintf(stderr, "bf: bracket nesting too deep\n");
                return 1;
            }
            stack[sp] = i;
            sp = sp + 1;
        } else if (program[i] == ']') {
            if (sp == 0) {
                fprintf(stderr, "bf: unmatched ]\n");
                return 1;
            }
            sp = sp - 1;
            bracket[i] = stack[sp];
            bracket[stack[sp]] = i;
        }
        i = i + 1;
    }

    if (sp != 0) {
        fprintf(stderr, "bf: unmatched [\n");
        return 1;
    }

    return 0;
}

int run(void) {
    int ip;
    int ch;

    ip = 0;
    ptr = 0;

    while (ip < proglen) {
        switch (program[ip]) {
        case '>':
            ptr = ptr + 1;
            if (ptr >= 30000) ptr = 0;
            break;
        case '<':
            ptr = ptr - 1;
            if (ptr < 0) ptr = 29999;
            break;
        case '+':
            tape[ptr] = tape[ptr] + 1;
            break;
        case '-':
            tape[ptr] = tape[ptr] - 1;
            break;
        case '.':
            putchar(tape[ptr]);
            break;
        case ',':
            ch = getchar();
            if (ch == (-1)) ch = 0;
            tape[ptr] = (unsigned char)ch;
            break;
        case '[':
            if (tape[ptr] == 0) {
                ip = bracket[ip];
            }
            break;
        case ']':
            if (tape[ptr] != 0) {
                ip = bracket[ip];
            }
            break;
        }
        ip = ip + 1;
    }

    return 0;
}

int main(int argc, char **argv) {
    FILE *f;
    int ch;
    int i;

    /* clear tape */
    i = 0;
    while (i < 30000) {
        tape[i] = 0;
        i = i + 1;
    }

    /* read program */
    proglen = 0;

    if (argc >= 2) {
        f = fopen(argv[1], "r");
        if (!f) {
            fprintf(stderr, "bf: cannot open '%s'\n", argv[1]);
            return 1;
        }
    } else {
        f = stdin;
    }

    ch = fgetc(f);
    while (ch != (-1) && proglen < 65534) {
        /* only keep bf instructions */
        if (ch == '>' || ch == '<' || ch == '+' || ch == '-' ||
            ch == '.' || ch == ',' || ch == '[' || ch == ']') {
            program[proglen] = ch;
            proglen = proglen + 1;
        }
        ch = fgetc(f);
    }
    program[proglen] = '\0';

    if (f != stdin) fclose(f);

    /* match brackets */
    if (match_brackets() != 0) return 1;

    /* run */
    run();

    return 0;
}
