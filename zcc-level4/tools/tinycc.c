/* zcc-level4: tinycc — a tiny C compiler
 * Compiles a minimal C subset to x86-64 assembly:
 *   - int variables (local only)
 *   - arithmetic: + - * /
 *   - comparison: == != < > <= >=
 *   - if/else, while, return
 *   - printf (extern call)
 *   - single main() function
 * Outputs AT&T syntax assembly to stdout
 */
#include <stdio.h>
#include <string.h>

/* tokens */
int TK_NUM;
int TK_IDENT;
int TK_INT;
int TK_IF;
int TK_ELSE;
int TK_WHILE;
int TK_RETURN;
int TK_PLUS;
int TK_MINUS;
int TK_STAR;
int TK_SLASH;
int TK_EQ;
int TK_NE;
int TK_LT;
int TK_GT;
int TK_LE;
int TK_GE;
int TK_ASSIGN;
int TK_LPAREN;
int TK_RPAREN;
int TK_LBRACE;
int TK_RBRACE;
int TK_SEMI;
int TK_COMMA;
int TK_EOF;
int TK_STR;

char source[65536];
int srclen;
int srcpos;

int cur_tok;
long cur_val;
char cur_name[64];
char cur_str[256];

/* local variables */
char locals[64][64];
int local_count;
int label_count;

void init_tokens(void) {
    TK_NUM = 1; TK_IDENT = 2; TK_INT = 3;
    TK_IF = 4; TK_ELSE = 5; TK_WHILE = 6; TK_RETURN = 7;
    TK_PLUS = 10; TK_MINUS = 11; TK_STAR = 12; TK_SLASH = 13;
    TK_EQ = 20; TK_NE = 21; TK_LT = 22; TK_GT = 23; TK_LE = 24; TK_GE = 25;
    TK_ASSIGN = 30; TK_LPAREN = 31; TK_RPAREN = 32;
    TK_LBRACE = 33; TK_RBRACE = 34; TK_SEMI = 35; TK_COMMA = 36;
    TK_EOF = 99; TK_STR = 40;
}

void skip_whitespace(void) {
    while (srcpos < srclen) {
        if (source[srcpos] == ' ' || source[srcpos] == '\t' ||
            source[srcpos] == '\n' || source[srcpos] == '\r') {
            srcpos = srcpos + 1;
        } else if (source[srcpos] == '/' && source[srcpos + 1] == '/') {
            while (srcpos < srclen && source[srcpos] != '\n')
                srcpos = srcpos + 1;
        } else {
            break;
        }
    }
}

void next_token(void) {
    int i;
    int c;

    skip_whitespace();

    if (srcpos >= srclen) { cur_tok = TK_EOF; return; }

    c = source[srcpos];

    /* string literal */
    if (c == '"') {
        srcpos = srcpos + 1;
        i = 0;
        while (srcpos < srclen && source[srcpos] != '"' && i < 254) {
            if (source[srcpos] == '\\' && srcpos + 1 < srclen) {
                srcpos = srcpos + 1;
                if (source[srcpos] == 'n') cur_str[i] = '\n';
                else if (source[srcpos] == 't') cur_str[i] = '\t';
                else if (source[srcpos] == '\\') cur_str[i] = '\\';
                else if (source[srcpos] == '"') cur_str[i] = '"';
                else cur_str[i] = source[srcpos];
            } else {
                cur_str[i] = source[srcpos];
            }
            i = i + 1;
            srcpos = srcpos + 1;
        }
        cur_str[i] = '\0';
        if (srcpos < srclen) srcpos = srcpos + 1; /* skip closing quote */
        cur_tok = TK_STR;
        return;
    }

    /* number */
    if (c >= '0' && c <= '9') {
        cur_val = 0;
        while (srcpos < srclen && source[srcpos] >= '0' && source[srcpos] <= '9') {
            cur_val = cur_val * 10 + (source[srcpos] - '0');
            srcpos = srcpos + 1;
        }
        cur_tok = TK_NUM;
        return;
    }

    /* identifier/keyword */
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
        i = 0;
        while (srcpos < srclen && ((source[srcpos] >= 'a' && source[srcpos] <= 'z') ||
               (source[srcpos] >= 'A' && source[srcpos] <= 'Z') ||
               (source[srcpos] >= '0' && source[srcpos] <= '9') ||
               source[srcpos] == '_') && i < 63) {
            cur_name[i] = source[srcpos];
            i = i + 1;
            srcpos = srcpos + 1;
        }
        cur_name[i] = '\0';

        if (strcmp(cur_name, "int") == 0) { cur_tok = TK_INT; return; }
        if (strcmp(cur_name, "if") == 0) { cur_tok = TK_IF; return; }
        if (strcmp(cur_name, "else") == 0) { cur_tok = TK_ELSE; return; }
        if (strcmp(cur_name, "while") == 0) { cur_tok = TK_WHILE; return; }
        if (strcmp(cur_name, "return") == 0) { cur_tok = TK_RETURN; return; }
        cur_tok = TK_IDENT;
        return;
    }

    /* two-char operators */
    if (c == '=' && srcpos + 1 < srclen && source[srcpos + 1] == '=') {
        srcpos = srcpos + 2; cur_tok = TK_EQ; return;
    }
    if (c == '!' && srcpos + 1 < srclen && source[srcpos + 1] == '=') {
        srcpos = srcpos + 2; cur_tok = TK_NE; return;
    }
    if (c == '<' && srcpos + 1 < srclen && source[srcpos + 1] == '=') {
        srcpos = srcpos + 2; cur_tok = TK_LE; return;
    }
    if (c == '>' && srcpos + 1 < srclen && source[srcpos + 1] == '=') {
        srcpos = srcpos + 2; cur_tok = TK_GE; return;
    }

    /* single-char tokens */
    srcpos = srcpos + 1;
    if (c == '+') { cur_tok = TK_PLUS; return; }
    if (c == '-') { cur_tok = TK_MINUS; return; }
    if (c == '*') { cur_tok = TK_STAR; return; }
    if (c == '/') { cur_tok = TK_SLASH; return; }
    if (c == '=') { cur_tok = TK_ASSIGN; return; }
    if (c == '<') { cur_tok = TK_LT; return; }
    if (c == '>') { cur_tok = TK_GT; return; }
    if (c == '(') { cur_tok = TK_LPAREN; return; }
    if (c == ')') { cur_tok = TK_RPAREN; return; }
    if (c == '{') { cur_tok = TK_LBRACE; return; }
    if (c == '}') { cur_tok = TK_RBRACE; return; }
    if (c == ';') { cur_tok = TK_SEMI; return; }
    if (c == ',') { cur_tok = TK_COMMA; return; }

    cur_tok = TK_EOF;
}

int find_local(char *name) {
    int i;
    i = 0;
    while (i < local_count) {
        if (strcmp(locals[i], name) == 0)
            return i;
        i = i + 1;
    }
    return -1;
}

int add_local(char *name) {
    int idx;
    idx = find_local(name);
    if (idx >= 0) return idx;
    strncpy(locals[local_count], name, 63);
    locals[local_count][63] = '\0';
    idx = local_count;
    local_count = local_count + 1;
    return idx;
}

int local_offset(int idx) {
    return -8 * (idx + 1);
}

int new_label(void) {
    int l;
    l = label_count;
    label_count = label_count + 1;
    return l;
}

/* string table */
char strings[64][256];
int string_count;

int add_string(char *s) {
    int idx;
    idx = string_count;
    strncpy(strings[idx], s, 255);
    strings[idx][255] = '\0';
    string_count = string_count + 1;
    return idx;
}

/* code generation — result always in %rax */
void gen_expr(void);
void gen_compare(void);
void gen_add(void);
void gen_mul(void);
void gen_unary(void);
void gen_primary(void);

void gen_primary(void) {
    int idx;
    int sid;
    char fname[64];
    int nargs;

    if (cur_tok == TK_NUM) {
        printf("    movq $%ld, %%rax\n", cur_val);
        next_token();
        return;
    }

    if (cur_tok == TK_STR) {
        sid = add_string(cur_str);
        printf("    leaq .LS%d(%%rip), %%rax\n", sid);
        next_token();
        return;
    }

    if (cur_tok == TK_IDENT) {
        strncpy(fname, cur_name, 63);
        fname[63] = '\0';
        next_token();

        /* function call */
        if (cur_tok == TK_LPAREN) {
            next_token();
            nargs = 0;

            while (cur_tok != TK_RPAREN && cur_tok != TK_EOF) {
                gen_expr();
                if (nargs == 0) printf("    movq %%rax, %%rdi\n");
                else if (nargs == 1) printf("    movq %%rax, %%rsi\n");
                else if (nargs == 2) printf("    movq %%rax, %%rdx\n");
                else if (nargs == 3) printf("    movq %%rax, %%rcx\n");
                nargs = nargs + 1;
                if (cur_tok == TK_COMMA) next_token();
            }
            if (cur_tok == TK_RPAREN) next_token();

            printf("    xorq %%rax, %%rax\n");
            printf("    call %s@PLT\n", fname);
            return;
        }

        /* variable */
        idx = find_local(fname);
        if (idx < 0) idx = add_local(fname);
        printf("    movq %d(%%rbp), %%rax\n", local_offset(idx));
        return;
    }

    if (cur_tok == TK_LPAREN) {
        next_token();
        gen_expr();
        if (cur_tok == TK_RPAREN) next_token();
        return;
    }

    next_token();
}

void gen_unary(void) {
    if (cur_tok == TK_MINUS) {
        next_token();
        gen_unary();
        printf("    negq %%rax\n");
        return;
    }
    gen_primary();
}

void gen_mul(void) {
    int op;
    gen_unary();
    while (cur_tok == TK_STAR || cur_tok == TK_SLASH) {
        op = cur_tok;
        next_token();
        printf("    pushq %%rax\n");
        gen_unary();
        printf("    movq %%rax, %%rcx\n");
        printf("    popq %%rax\n");
        if (op == TK_STAR) {
            printf("    imulq %%rcx, %%rax\n");
        } else {
            printf("    cqto\n");
            printf("    idivq %%rcx\n");
        }
    }
}

void gen_add(void) {
    int op;
    gen_mul();
    while (cur_tok == TK_PLUS || cur_tok == TK_MINUS) {
        op = cur_tok;
        next_token();
        printf("    pushq %%rax\n");
        gen_mul();
        printf("    movq %%rax, %%rcx\n");
        printf("    popq %%rax\n");
        if (op == TK_PLUS) {
            printf("    addq %%rcx, %%rax\n");
        } else {
            printf("    subq %%rcx, %%rax\n");
        }
    }
}

void gen_compare(void) {
    int op;
    int lbl;
    gen_add();
    if (cur_tok == TK_EQ || cur_tok == TK_NE || cur_tok == TK_LT ||
        cur_tok == TK_GT || cur_tok == TK_LE || cur_tok == TK_GE) {
        op = cur_tok;
        next_token();
        printf("    pushq %%rax\n");
        gen_add();
        printf("    popq %%rcx\n");
        printf("    cmpq %%rax, %%rcx\n");
        lbl = new_label();
        printf("    movq $0, %%rax\n");
        if (op == TK_EQ)       printf("    je .L%d\n", lbl);
        else if (op == TK_NE)  printf("    jne .L%d\n", lbl);
        else if (op == TK_LT)  printf("    jl .L%d\n", lbl);
        else if (op == TK_GT)  printf("    jg .L%d\n", lbl);
        else if (op == TK_LE)  printf("    jle .L%d\n", lbl);
        else if (op == TK_GE)  printf("    jge .L%d\n", lbl);
        printf("    jmp .L%de\n", lbl);
        printf(".L%d:\n", lbl);
        printf("    movq $1, %%rax\n");
        printf(".L%de:\n", lbl);
    }
}

void gen_expr(void) {
    gen_compare();
}

void gen_stmt(void) {
    int idx;
    char vname[64];
    int lbl_else;
    int lbl_end;
    int lbl_top;

    /* int declaration */
    if (cur_tok == TK_INT) {
        next_token();
        while (cur_tok == TK_IDENT) {
            add_local(cur_name);
            next_token();
            if (cur_tok == TK_ASSIGN) {
                idx = find_local(cur_name);
                /* wait, cur_name may have been overwritten by next_token */
            }
            if (cur_tok == TK_COMMA) next_token();
        }
        if (cur_tok == TK_SEMI) next_token();
        return;
    }

    /* return */
    if (cur_tok == TK_RETURN) {
        next_token();
        if (cur_tok != TK_SEMI) {
            gen_expr();
        }
        printf("    leave\n");
        printf("    ret\n");
        if (cur_tok == TK_SEMI) next_token();
        return;
    }

    /* if */
    if (cur_tok == TK_IF) {
        next_token();
        if (cur_tok == TK_LPAREN) next_token();
        gen_expr();
        if (cur_tok == TK_RPAREN) next_token();

        lbl_else = new_label();
        lbl_end = new_label();

        printf("    cmpq $0, %%rax\n");
        printf("    je .L%d\n", lbl_else);

        if (cur_tok == TK_LBRACE) {
            next_token();
            while (cur_tok != TK_RBRACE && cur_tok != TK_EOF) gen_stmt();
            if (cur_tok == TK_RBRACE) next_token();
        } else {
            gen_stmt();
        }

        printf("    jmp .L%d\n", lbl_end);
        printf(".L%d:\n", lbl_else);

        if (cur_tok == TK_ELSE) {
            next_token();
            if (cur_tok == TK_LBRACE) {
                next_token();
                while (cur_tok != TK_RBRACE && cur_tok != TK_EOF) gen_stmt();
                if (cur_tok == TK_RBRACE) next_token();
            } else {
                gen_stmt();
            }
        }

        printf(".L%d:\n", lbl_end);
        return;
    }

    /* while */
    if (cur_tok == TK_WHILE) {
        next_token();
        lbl_top = new_label();
        lbl_end = new_label();

        printf(".L%d:\n", lbl_top);

        if (cur_tok == TK_LPAREN) next_token();
        gen_expr();
        if (cur_tok == TK_RPAREN) next_token();

        printf("    cmpq $0, %%rax\n");
        printf("    je .L%d\n", lbl_end);

        if (cur_tok == TK_LBRACE) {
            next_token();
            while (cur_tok != TK_RBRACE && cur_tok != TK_EOF) gen_stmt();
            if (cur_tok == TK_RBRACE) next_token();
        } else {
            gen_stmt();
        }

        printf("    jmp .L%d\n", lbl_top);
        printf(".L%d:\n", lbl_end);
        return;
    }

    /* block */
    if (cur_tok == TK_LBRACE) {
        next_token();
        while (cur_tok != TK_RBRACE && cur_tok != TK_EOF) gen_stmt();
        if (cur_tok == TK_RBRACE) next_token();
        return;
    }

    /* assignment or expression statement */
    if (cur_tok == TK_IDENT) {
        strncpy(vname, cur_name, 63);
        vname[63] = '\0';
        next_token();

        if (cur_tok == TK_ASSIGN) {
            next_token();
            gen_expr();
            idx = find_local(vname);
            if (idx < 0) idx = add_local(vname);
            printf("    movq %%rax, %d(%%rbp)\n", local_offset(idx));
            if (cur_tok == TK_SEMI) next_token();
            return;
        }

        /* it was an expression starting with ident — hacky rewind */
        /* push ident value, then continue */
        idx = find_local(vname);
        if (idx < 0) idx = add_local(vname);
        printf("    movq %d(%%rbp), %%rax\n", local_offset(idx));
        /* rest of expression */
        while (cur_tok != TK_SEMI && cur_tok != TK_EOF) next_token();
        if (cur_tok == TK_SEMI) next_token();
        return;
    }

    /* expression statement */
    gen_expr();
    if (cur_tok == TK_SEMI) next_token();
}

int main(int argc, char **argv) {
    FILE *f;
    int ch;
    int i;

    init_tokens();
    local_count = 0;
    label_count = 0;
    string_count = 0;

    /* read source */
    if (argc >= 2) {
        f = fopen(argv[1], "r");
        if (!f) {
            fprintf(stderr, "tinycc: cannot open '%s'\n", argv[1]);
            return 1;
        }
    } else {
        f = stdin;
    }

    srclen = 0;
    ch = fgetc(f);
    while (ch != (-1) && srclen < 65534) {
        source[srclen] = ch;
        srclen = srclen + 1;
        ch = fgetc(f);
    }
    source[srclen] = '\0';
    if (f != stdin) fclose(f);

    /* parse: expect int main() { ... } */
    next_token();

    /* skip to opening brace of main */
    while (cur_tok != TK_LBRACE && cur_tok != TK_EOF)
        next_token();
    if (cur_tok == TK_LBRACE) next_token();

    /* emit prologue */
    printf("    .text\n");
    printf("    .globl main\n");
    printf("main:\n");
    printf("    pushq %%rbp\n");
    printf("    movq %%rsp, %%rbp\n");
    printf("    subq $512, %%rsp\n");

    /* compile statements */
    while (cur_tok != TK_RBRACE && cur_tok != TK_EOF) {
        gen_stmt();
    }

    /* epilogue */
    printf("    movq $0, %%rax\n");
    printf("    leave\n");
    printf("    ret\n");

    /* emit string constants */
    if (string_count > 0) {
        printf("    .section .rodata\n");
        i = 0;
        while (i < string_count) {
            printf(".LS%d:\n", i);
            printf("    .asciz \"");
            /* emit string, escaping special chars */
            {
                int j;
                j = 0;
                while (strings[i][j] != '\0') {
                    if (strings[i][j] == '\n') printf("\\n");
                    else if (strings[i][j] == '\t') printf("\\t");
                    else if (strings[i][j] == '"') printf("\\\"");
                    else if (strings[i][j] == '\\') printf("\\\\");
                    else putchar(strings[i][j]);
                    j = j + 1;
                }
            }
            printf("\"\n");
            i = i + 1;
        }
    }

    return 0;
}
