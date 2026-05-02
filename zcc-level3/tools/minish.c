/* zcc-level3: mini-sh — basic command shell
 * Builtins: cd, exit, echo, set (env vars)
 * External commands via system()
 * Semicolons for chaining
 * Reads from stdin or -c "command"
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char shell_vars[26][256];

void trim(char *s) {
    int len;
    int start;
    int i;

    len = strlen(s);

    /* trim trailing whitespace */
    while (len > 0 && (s[len - 1] == ' ' || s[len - 1] == '\t' ||
                       s[len - 1] == '\n' || s[len - 1] == '\r')) {
        s[len - 1] = '\0';
        len = len - 1;
    }

    /* trim leading whitespace */
    start = 0;
    while (s[start] == ' ' || s[start] == '\t')
        start = start + 1;

    if (start > 0) {
        i = 0;
        while (s[start + i] != '\0') {
            s[i] = s[start + i];
            i = i + 1;
        }
        s[i] = '\0';
    }
}

int count_args(char *cmd) {
    int n;
    int in_word;
    int i;

    n = 0;
    in_word = 0;
    i = 0;
    while (cmd[i] != '\0') {
        if (cmd[i] == ' ' || cmd[i] == '\t') {
            in_word = 0;
        } else {
            if (!in_word) {
                n = n + 1;
                in_word = 1;
            }
        }
        i = i + 1;
    }
    return n;
}

void get_arg(char *cmd, int idx, char *out, int maxlen) {
    int n;
    int in_word;
    int i;
    int oi;

    n = 0;
    in_word = 0;
    i = 0;
    out[0] = '\0';

    while (cmd[i] != '\0') {
        if (cmd[i] == ' ' || cmd[i] == '\t') {
            if (in_word && n == idx + 1) {
                out[oi] = '\0';
                return;
            }
            in_word = 0;
        } else {
            if (!in_word) {
                n = n + 1;
                in_word = 1;
                oi = 0;
            }
            if (n == idx + 1 && oi < maxlen - 1) {
                out[oi] = cmd[i];
                oi = oi + 1;
                out[oi] = '\0';
            }
        }
        i = i + 1;
    }
}

int run_command(char *cmd) {
    char arg0[256];
    char arg1[256];
    char arg2[256];
    int nargs;
    int rc;
    int vi;

    trim(cmd);

    if (cmd[0] == '\0' || cmd[0] == '#')
        return 0;

    nargs = count_args(cmd);
    get_arg(cmd, 0, arg0, 256);

    /* builtin: exit */
    if (strcmp(arg0, "exit") == 0) {
        rc = 0;
        if (nargs > 1) {
            get_arg(cmd, 1, arg1, 256);
            rc = 0;
            vi = 0;
            while (arg1[vi] >= '0' && arg1[vi] <= '9') {
                rc = rc * 10 + (arg1[vi] - '0');
                vi = vi + 1;
            }
        }
        return -(rc + 1); /* negative signals exit */
    }

    /* builtin: echo */
    if (strcmp(arg0, "echo") == 0) {
        /* print everything after "echo " */
        vi = 4;
        while (cmd[vi] == ' ') vi = vi + 1;
        if (cmd[vi] != '\0')
            printf("%s", cmd + vi);
        printf("\n");
        return 0;
    }

    /* builtin: cd */
    if (strcmp(arg0, "cd") == 0) {
        if (nargs < 2) {
            fprintf(stderr, "cd: missing argument\n");
            return 1;
        }
        get_arg(cmd, 1, arg1, 256);
        /* no chdir in ZCC-safe mode, just acknowledge */
        printf("cd: %s\n", arg1);
        return 0;
    }

    /* builtin: set VAR=VALUE (a-z single char vars) */
    if (strcmp(arg0, "set") == 0 && nargs > 1) {
        get_arg(cmd, 1, arg1, 256);
        if (arg1[0] >= 'a' && arg1[0] <= 'z' && arg1[1] == '=') {
            vi = arg1[0] - 'a';
            strncpy(shell_vars[vi], arg1 + 2, 255);
            shell_vars[vi][255] = '\0';
            return 0;
        }
    }

    /* builtin: get VAR */
    if (strcmp(arg0, "get") == 0 && nargs > 1) {
        get_arg(cmd, 1, arg1, 256);
        if (arg1[0] >= 'a' && arg1[0] <= 'z') {
            vi = arg1[0] - 'a';
            printf("%s\n", shell_vars[vi]);
            return 0;
        }
    }

    /* external command */
    rc = system(cmd);
    return rc;
}

int process_line(char *line) {
    char cmd[4096];
    int i;
    int ci;
    int rc;

    /* split on semicolons */
    i = 0;
    ci = 0;
    while (1) {
        if (line[i] == ';' || line[i] == '\0') {
            cmd[ci] = '\0';
            rc = run_command(cmd);
            if (rc < 0) return rc; /* exit signal */
            ci = 0;
            if (line[i] == '\0') break;
        } else {
            cmd[ci] = line[i];
            ci = ci + 1;
        }
        i = i + 1;
    }

    return 0;
}

int main(int argc, char **argv) {
    char line[4096];
    int ch;
    int pos;
    int rc;
    int interactive;
    int i;

    /* init vars */
    i = 0;
    while (i < 26) {
        shell_vars[i][0] = '\0';
        i = i + 1;
    }

    /* -c "command" mode */
    if (argc >= 3 && argv[1][0] == '-' && argv[1][1] == 'c') {
        rc = process_line(argv[2]);
        if (rc < 0) return -(rc + 1);
        return 0;
    }

    /* interactive / pipe mode */
    interactive = 0; /* don't print prompt when piped */

    while (1) {
        pos = 0;
        ch = getchar();
        if (ch == (-1)) break;

        while (ch != (-1) && ch != '\n' && pos < 4094) {
            line[pos] = ch;
            pos = pos + 1;
            ch = getchar();
        }
        line[pos] = '\0';

        rc = process_line(line);
        if (rc < 0) return -(rc + 1);
    }

    return 0;
}
